import { AlertTriangle, CheckCircle2, Clock3, Gauge, ShieldAlert } from "lucide-react";
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

const REFRESH_MS = 30000;
const FILTERS = ["ALL", "AT_RISK", "OVERDUE"];

function TechnicianSlaPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [tick, setTick] = useState(Date.now());
  const { addToast } = useToast();

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await fetchAssignedTickets({ page: 0, size: 400 });
        setTickets(response.items);
      } catch (error) {
        addToast({
          type: "error",
          title: "SLA monitor unavailable",
          message: error?.response?.data?.message || "Failed to load SLA monitor.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"),
    [tickets]
  );

  const slaRows = useMemo(() => {
    const now = tick;
    return activeTickets
      .map((ticket) => {
        const totalHours = getSlaHours(ticket.priority);
        const createdAtMs = new Date(ticket.createdAt).getTime();
        const dueAtMs = createdAtMs + totalHours * 60 * 60 * 1000;
        const remainingMs = dueAtMs - now;
        const riskWindowMs = Math.max(2 * 60 * 60 * 1000, totalHours * 60 * 60 * 1000 * 0.25);

        let risk = "SAFE";
        if (remainingMs <= 0) risk = "OVERDUE";
        else if (remainingMs <= riskWindowMs) risk = "AT_RISK";

        return {
          ticket,
          totalHours,
          dueAtMs,
          remainingMs,
          risk,
        };
      })
      .sort((a, b) => {
        const rankA = riskRank(a.risk);
        const rankB = riskRank(b.risk);
        if (rankA !== rankB) return rankB - rankA;
        return a.dueAtMs - b.dueAtMs;
      });
  }, [activeTickets, tick]);

  const visibleRows = useMemo(() => {
    if (filter === "ALL") return slaRows;
    return slaRows.filter((row) => row.risk === filter);
  }, [filter, slaRows]);

  const summary = useMemo(
    () => ({
      total: slaRows.length,
      safe: slaRows.filter((row) => row.risk === "SAFE").length,
      atRisk: slaRows.filter((row) => row.risk === "AT_RISK").length,
      overdue: slaRows.filter((row) => row.risk === "OVERDUE").length,
    }),
    [slaRows]
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Technician Ops</p>
        <h2 className="mt-2 text-2xl font-bold">SLA Monitor</h2>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Track active assigned tickets by SLA deadline, breach risk, and overdue state.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Active SLA Tickets" value={summary.total} icon={Gauge} tone="cyan" />
        <KpiCard title="Safe" value={summary.safe} icon={CheckCircle2} tone="emerald" />
        <KpiCard title="At Risk" value={summary.atRisk} icon={AlertTriangle} tone="amber" />
        <KpiCard title="Overdue" value={summary.overdue} icon={ShieldAlert} tone="rose" />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={filter === item ? "default" : "secondary"}
              onClick={() => setFilter(item)}
            >
              {item === "AT_RISK" ? "At Risk" : item.charAt(0) + item.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : visibleRows.length === 0 ? (
          <EmptyState
            title="No SLA rows"
            description="No assigned active tickets match this SLA filter."
          />
        ) : (
          <div className="fine-scrollbar overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                <tr>
                  <th className="pb-3">Ticket</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Due</th>
                  <th className="pb-3">Remaining</th>
                  <th className="pb-3">Risk</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {visibleRows.map((row) => (
                  <tr key={row.ticket.id}>
                    <td className="py-3">
                      <p className="font-semibold">#{row.ticket.id}</p>
                      <p className="text-xs text-[color:var(--text-muted)]">{row.ticket.description}</p>
                    </td>
                    <td className="py-3">
                      <Badge value={row.ticket.priority} />
                    </td>
                    <td className="py-3 text-xs">{formatDateTime(row.ticket.createdAt)}</td>
                    <td className="py-3 text-xs">{formatDateTime(row.dueAtMs)}</td>
                    <td className="py-3 text-xs font-semibold">{formatDuration(row.remainingMs)}</td>
                    <td className="py-3">
                      <RiskBadge risk={row.risk} />
                    </td>
                    <td className="py-3">
                      <Link to="/tickets">
                        <Button size="sm" variant="secondary">
                          Open Ticket
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, tone }) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-300/45 via-emerald-200/32 to-emerald-50/90 dark:from-emerald-800/50 dark:via-emerald-900/30 dark:to-[color:var(--bg-soft)]/88"
      : tone === "amber"
        ? "from-amber-300/45 via-amber-200/32 to-amber-50/90 dark:from-amber-800/50 dark:via-amber-900/30 dark:to-[color:var(--bg-soft)]/88"
        : tone === "rose"
          ? "from-rose-300/45 via-rose-200/32 to-rose-50/90 dark:from-rose-800/50 dark:via-rose-900/30 dark:to-[color:var(--bg-soft)]/88"
          : "from-cyan-300/45 via-cyan-200/32 to-cyan-50/90 dark:from-cyan-800/50 dark:via-cyan-900/30 dark:to-[color:var(--bg-soft)]/88";

  return (
    <Card className={`rounded-2xl border border-[color:var(--border)] bg-gradient-to-br p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">{title}</p>
        <span className="rounded-lg bg-[color:var(--brand-soft)] p-1.5 text-[color:var(--brand)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}

function RiskBadge({ risk }) {
  const cls =
    risk === "OVERDUE"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
      : risk === "AT_RISK"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200";

  return <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${cls}`}>{risk.replace("_", " ")}</span>;
}

function getSlaHours(priority) {
  const key = String(priority || "").toUpperCase();
  if (key === "CRITICAL") return 4;
  if (key === "HIGH") return 8;
  if (key === "LOW") return 48;
  return 24;
}

function riskRank(risk) {
  if (risk === "OVERDUE") return 3;
  if (risk === "AT_RISK") return 2;
  return 1;
}

function formatDuration(ms) {
  if (ms <= 0) {
    const overdue = Math.abs(ms);
    const hours = Math.floor(overdue / (1000 * 60 * 60));
    const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
    return `Overdue ${hours}h ${minutes}m`;
  }
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default TechnicianSlaPage;
