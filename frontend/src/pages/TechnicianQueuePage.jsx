import { AlertTriangle, Clock3, Search, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAssignedTickets } from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";
import { formatDateTime } from "../utils/format";

const QUICK_FILTERS = ["ALL", "CRITICAL", "TODAY", "OVERDUE", "OPEN", "IN_PROGRESS"];

function TechnicianQueuePage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await fetchAssignedTickets({ page: 0, size: 400 });
        setTickets(response.items);
      } catch (error) {
        addToast({
          type: "error",
          title: "Queue unavailable",
          message: error?.response?.data?.message || "Failed to load technician queue.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const enriched = useMemo(() => {
    const now = Date.now();
    return tickets.map((ticket) => {
      const createdAtMs = new Date(ticket.createdAt).getTime();
      const dueAtMs = createdAtMs + getSlaHours(ticket.priority) * 60 * 60 * 1000;
      const isOverdue = dueAtMs < now && (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS");
      return { ticket, dueAtMs, isOverdue };
    });
  }, [tickets]);

  const filtered = useMemo(() => {
    const now = new Date();
    const next = enriched.filter(({ ticket, dueAtMs, isOverdue }) => {
      const text = [ticket.id, ticket.description, ticket.resourceName, ticket.locationReference]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchQuery = text.includes(query.toLowerCase());
      if (!matchQuery) return false;

      if (filter === "ALL") return true;
      if (filter === "CRITICAL") return ticket.priority === "CRITICAL";
      if (filter === "OVERDUE") return isOverdue;
      if (filter === "OPEN" || filter === "IN_PROGRESS") return ticket.status === filter;
      if (filter === "TODAY") {
        const due = new Date(dueAtMs);
        return isSameDay(due, now);
      }
      return true;
    });

    return next.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      const priorityDiff = priorityWeight(b.ticket.priority) - priorityWeight(a.ticket.priority);
      if (priorityDiff !== 0) return priorityDiff;
      if (a.ticket.status !== b.ticket.status) {
        if (a.ticket.status === "IN_PROGRESS") return -1;
        if (b.ticket.status === "IN_PROGRESS") return 1;
      }
      return a.dueAtMs - b.dueAtMs;
    });
  }, [enriched, filter, query]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Technician Ops</p>
        <h2 className="mt-2 text-2xl font-bold">My Queue</h2>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Priority-sorted assigned tickets with quick focus filters for critical, due today, and overdue work.
        </p>
      </Card>

      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 dark:bg-[color:var(--bg-soft)]/80">
            <Search className="h-4 w-4 text-[color:var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ticket, resource, location"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]/70"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={filter === item ? "primary" : "secondary"}
                onClick={() => setFilter(item)}
              >
                {item === "IN_PROGRESS"
                  ? "In Progress"
                  : item.charAt(0) + item.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Queue is clear" description="No assigned tickets match the selected filters." />
        ) : (
          <div className="space-y-3">
            {filtered.map(({ ticket, dueAtMs, isOverdue }) => (
              <article
                key={ticket.id}
                className="rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-blue-300/35 via-indigo-200/28 to-cyan-100/70 p-4 dark:from-blue-900/35 dark:via-indigo-900/24 dark:to-[color:var(--bg-soft)]/88"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">Ticket #{ticket.id}</p>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">{ticket.description}</p>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                      Resource: {ticket.resourceName || "N/A"} | Location: {ticket.locationReference || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge value={ticket.status} />
                    <Badge value={ticket.priority} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-[color:var(--text-muted)]">
                    <Clock3 className="h-3.5 w-3.5" />
                    Due: {formatDateTime(new Date(dueAtMs).toISOString())}
                  </span>
                  {isOverdue ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-1 font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Overdue
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {remainingText(dueAtMs)}
                    </span>
                  )}
                </div>

                <div className="mt-3 border-t border-[color:var(--border)] pt-3">
                  <Link to="/tickets">
                    <Button size="sm" variant="secondary">
                      Open in Tickets
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function priorityWeight(priority) {
  const key = String(priority || "").toUpperCase();
  if (key === "CRITICAL") return 4;
  if (key === "HIGH") return 3;
  if (key === "MEDIUM") return 2;
  return 1;
}

function getSlaHours(priority) {
  const key = String(priority || "").toUpperCase();
  if (key === "CRITICAL") return 4;
  if (key === "HIGH") return 8;
  if (key === "LOW") return 48;
  return 24;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function remainingText(dueAtMs) {
  const diff = dueAtMs - Date.now();
  if (diff <= 0) return "Due now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

export default TechnicianQueuePage;

