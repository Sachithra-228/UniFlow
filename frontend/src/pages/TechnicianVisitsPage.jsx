import { CheckCircle2, Clock3, MapPin, Navigation, PlayCircle, Route, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addTicketVisitEvent, fetchAssignedTicketVisits, fetchAssignedTickets } from "../api/campusApi";
import { API_BASE_URL } from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";
import { formatDateTime, titleCase } from "../utils/format";

const VISIT_STEPS = [
  { type: "START_TRAVEL", label: "Start Travel", icon: Navigation },
  { type: "ARRIVED_ON_SITE", label: "Arrived On Site", icon: MapPin },
  { type: "WORK_STARTED", label: "Work Started", icon: PlayCircle },
  { type: "WORK_COMPLETED", label: "Work Completed", icon: CheckCircle2 },
];

function TechnicianVisitsPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [timelineByTicket, setTimelineByTicket] = useState({});
  const [noteByTicket, setNoteByTicket] = useState({});
  const [visitsApiUnavailable, setVisitsApiUnavailable] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ticketResult, visitResult] = await Promise.allSettled([
          fetchAssignedTickets({ page: 0, size: 400 }),
          fetchAssignedTicketVisits(),
        ]);

        if (ticketResult.status === "rejected") {
          throw ticketResult.reason;
        }
        setTickets(ticketResult.value.items);

        if (visitResult.status === "fulfilled") {
          const grouped = {};
          visitResult.value.items.forEach((item) => {
            grouped[item.ticketId] = Array.isArray(item.events) ? item.events : [];
          });
          setTimelineByTicket(grouped);
          setVisitsApiUnavailable(false);
        } else if (isMissingVisitsEndpoint(visitResult.reason)) {
          setTimelineByTicket({});
          setVisitsApiUnavailable(true);
          addToast({
            type: "info",
            title: "Field visit endpoint unavailable",
            message: `Running backend at ${API_BASE_URL} is missing /api/tickets/assigned/visits. Restart backend with latest code.`,
          });
        } else {
          throw visitResult.reason;
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Field visits unavailable",
          message: error?.response?.data?.message || "Failed to load field visit workflows.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS" || ticket.status === "RESOLVED"),
    [tickets]
  );

  async function handleLogNextStep(ticket) {
    const events = timelineByTicket[ticket.id] || [];
    const nextStep = getNextStep(events);
    if (!nextStep) {
      addToast({
        type: "info",
        title: "Visit flow completed",
        message: "All field checkpoints already captured for this ticket.",
      });
      return;
    }

    const key = `visit-${ticket.id}`;
    setBusyKey(key);
    try {
      const response = await addTicketVisitEvent(ticket.id, {
        eventType: nextStep.type,
        note: (noteByTicket[ticket.id] || "").trim(),
      });

      setTimelineByTicket((current) => {
        const existing = current[ticket.id] || [];
        return {
          ...current,
          [ticket.id]: [...existing, response.data],
        };
      });
      setNoteByTicket((current) => ({ ...current, [ticket.id]: "" }));

      setTickets((current) =>
        current.map((item) => {
          if (item.id !== ticket.id) return item;
          if (nextStep.type === "WORK_STARTED" && item.status === "OPEN") {
            return { ...item, status: "IN_PROGRESS", updatedAt: new Date().toISOString() };
          }
          if (nextStep.type === "WORK_COMPLETED" && item.status !== "CLOSED") {
            return { ...item, status: "RESOLVED", updatedAt: new Date().toISOString() };
          }
          return item;
        })
      );

      addToast({
        type: "success",
        title: "Checkpoint logged",
        message: `${nextStep.label} saved for ticket #${ticket.id}.`,
      });
    } catch (error) {
      if (isMissingVisitsEndpoint(error)) {
        setVisitsApiUnavailable(true);
      }
      addToast({
        type: "error",
        title: "Checkpoint failed",
        message: isMissingVisitsEndpoint(error)
          ? `Field visits endpoint missing on ${API_BASE_URL}. Restart backend with latest code.`
          : error?.response?.data?.message || "Unable to log field visit event.",
      });
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Technician Ops</p>
        <h2 className="mt-2 text-2xl font-bold">Field Visits</h2>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Capture travel and on-site execution checkpoints: start travel, arrived, work started, and work completed.
        </p>
      </Card>

      {visitsApiUnavailable ? (
        <Card className="border border-amber-300/60 bg-amber-100/75 p-4 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-100">
          <p className="text-sm font-semibold">Field Visits API is unavailable on the running backend.</p>
          <p className="mt-1 text-xs">
            Restart backend with latest code so `/api/tickets/assigned/visits` and `/api/tickets/&lt;ticketId&gt;/visits` are available.
          </p>
        </Card>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : activeTickets.length === 0 ? (
        <Card className="p-6">
          <EmptyState title="No active assigned tickets" description="Field visit tracking appears when tickets are assigned." />
        </Card>
      ) : (
        <div className="space-y-4">
          {activeTickets.map((ticket) => {
            const events = timelineByTicket[ticket.id] || [];
            const nextStep = getNextStep(events);
            return (
              <Card key={ticket.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">Ticket #{ticket.id}</p>
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

                <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-white/70 p-3 dark:bg-[color:var(--bg-soft)]/75">
                  <div className="mb-2 flex items-center gap-2">
                    <Route className="h-4 w-4 text-[color:var(--brand)]" />
                    <p className="text-sm font-semibold">Visit Timeline</p>
                  </div>
                  {events.length === 0 ? (
                    <p className="text-xs text-[color:var(--text-muted)]">No checkpoints logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-white/80 px-3 py-2 text-xs dark:bg-[color:var(--bg-soft)]/80">
                          <span className="font-semibold">{titleCase(event.eventType)}</span>
                          <span className="text-[color:var(--text-muted)]">{formatDateTime(event.createdAt)}</span>
                          {event.note ? <span className="text-[color:var(--text-muted)]">Note: {event.note}</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                      Optional Note
                    </span>
                    <textarea
                      rows={2}
                      value={noteByTicket[ticket.id] || ""}
                      onChange={(event) =>
                        setNoteByTicket((current) => ({ ...current, [ticket.id]: event.target.value }))
                      }
                      placeholder="Travel delay, access issue, spare parts, on-site details..."
                      className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/75"
                    />
                  </label>

                  <div className="flex flex-col gap-2">
                    <Button
                      loading={busyKey === `visit-${ticket.id}`}
                      onClick={() => handleLogNextStep(ticket)}
                      disabled={!nextStep}
                    >
                      <Clock3 className="h-4 w-4" />
                      {nextStep ? `Log: ${nextStep.label}` : "Visit Completed"}
                    </Button>
                    {nextStep ? (
                      <p className="text-xs font-semibold text-[color:var(--text-muted)]">
                        Next: {nextStep.label}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        All checkpoints captured
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getNextStep(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return VISIT_STEPS[0];
  }
  const last = events[events.length - 1];
  const currentIndex = VISIT_STEPS.findIndex((step) => step.type === last.eventType);
  if (currentIndex < 0) return null;
  return VISIT_STEPS[currentIndex + 1] || null;
}

function isMissingVisitsEndpoint(error) {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || "").toLowerCase();
  return status === 404 && (message.includes("resource not found") || message.includes("not found"));
}

export default TechnicianVisitsPage;
