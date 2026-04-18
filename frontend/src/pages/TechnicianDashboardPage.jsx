import {
  CalendarClock,
  ClipboardList,
  Settings2,
  UserCircle2,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  fetchAssignedTickets,
  fetchBookings,
  fetchProfile,
} from "../api/campusApi";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";
import { formatDateTime } from "../utils/format";
import { normalizeRole } from "../utils/roles";

function TechnicianDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [role, setRole] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileResult, bookingsResult, ticketsResult] =
          await Promise.allSettled([
            fetchProfile(),
            fetchBookings({ page: 0, size: 300 }),
            fetchAssignedTickets({ page: 0, size: 300 }),
          ]);

        if (profileResult.status === "fulfilled") {
          setRole(normalizeRole(profileResult.value?.data?.role));
        }

        if (bookingsResult.status === "fulfilled") {
          setBookings(bookingsResult.value.items);
        } else {
          setBookings([]);
        }

        if (ticketsResult.status === "fulfilled") {
          setAssignedTickets(ticketsResult.value.items);
        } else {
          setAssignedTickets([]);
          addToast({
            type: "error",
            title: "Assigned tickets unavailable",
            message:
              ticketsResult.reason?.response?.data?.message ||
              "Ticket queue could not be loaded right now.",
          });
        }

        if (profileResult.status === "rejected") {
          throw profileResult.reason;
        }

        if (bookingsResult.status === "rejected") {
          throw bookingsResult.reason;
        }

        if (
          profileResult.status === "fulfilled" &&
          bookingsResult.status === "fulfilled" &&
          ticketsResult.status === "fulfilled" &&
          (bookingsResult.value.isFallback ||
            profileResult.value.isFallback ||
            ticketsResult.value.isFallback)
        ) {
          addToast({
            type: "info",
            title: "Fallback mode active",
            message:
              "Using local fallback values for part of technician dashboard data.",
          });
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Technician dashboard unavailable",
          message:
            error?.response?.data?.message ||
            "Failed to load technician dashboard data.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const operationalBookings = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        )
        .slice(0, 6),
    [bookings],
  );

  const ticketSummary = useMemo(
    () => ({
      assigned: assignedTickets.length,
      inProgress: assignedTickets.filter(
        (ticket) => ticket.status === "IN_PROGRESS",
      ).length,
      resolved: assignedTickets.filter((ticket) => ticket.status === "RESOLVED")
        .length,
      closed: assignedTickets.filter((ticket) => ticket.status === "CLOSED")
        .length,
    }),
    [assignedTickets],
  );

  if (role && role !== "TECHNICIAN") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="dashboard-shell space-y-6">
      <Card className="hero-panel overflow-hidden p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/80 dark:text-[color:var(--text-muted)]">
            Technician Workspace
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white dark:text-[color:var(--text)] md:text-4xl">Technician Dashboard</h2>
          <p className="mt-3 max-w-2xl text-sm text-sky-50/82 dark:text-[color:var(--text-muted)] md:text-base">
            Track assigned maintenance workflows and keep resource issue
            resolution aligned with live operations.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-3xl border border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,246,255,0.94)_100%)] px-5 py-4 text-[color:var(--navy-deep)] shadow-[0_16px_34px_rgba(9,26,61,0.12)] backdrop-blur dark:border-[color:var(--border)] dark:bg-[color:var(--bg-soft)]/35 dark:text-[color:var(--text)]">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-sky-700/70 dark:text-[color:var(--text-muted)]">
              Assigned to you
            </p>
            <p className="mt-1 text-4xl font-bold text-[color:var(--navy-deep)] dark:text-[color:var(--text)]">{ticketSummary.assigned}</p>
          </div>
          <div>
            <Button
              className="min-w-[180px] border-0 bg-[#1b4fa3] bg-none text-white shadow-[0_14px_30px_rgba(27,79,163,0.26)] hover:bg-[#163f82] dark:bg-[color:var(--brand)]"
              onClick={() => (window.location.href = "/tickets?view=assigned")}
            >
              Open assigned tickets
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Assigned Tickets" value={ticketSummary.assigned} />
        <MetricCard title="In Progress" value={ticketSummary.inProgress} />
        <MetricCard
          title="Resolved / Closed"
          value={ticketSummary.resolved + ticketSummary.closed}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <WorkflowCard
          icon={ClipboardList}
          title="Assigned Ticket Queue"
          description="Review tickets currently assigned to your technician account."
        />
        <WorkflowCard
          icon={Settings2}
          title="Status Update Actions"
          description="Update ticket statuses through IN_PROGRESS, RESOLVED, and CLOSED."
        />
        <WorkflowCard
          icon={Wrench}
          title="Resolution Shortcuts"
          description="Add resolution notes and keep maintenance outcomes documented."
        />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Operational Booking Context</h3>
          <Link
            to="/bookings"
            className="text-sm font-semibold text-[color:var(--brand)] hover:underline"
          >
            Open bookings
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : operationalBookings.length === 0 ? (
          <EmptyState
            title="No booking schedule available"
            description="Booking activity will appear here to provide technician context."
          />
        ) : (
          <div className="fine-scrollbar overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                <tr>
                  <th className="pb-3">Resource</th>
                  <th className="pb-3">Start</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {operationalBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-3 font-semibold">
                      {booking.resourceName}
                    </td>
                    <td className="py-3 text-xs">
                      {formatDateTime(booking.startTime)}
                    </td>
                    <td className="py-3">
                      <Badge value={booking.status} />
                    </td>
                    <td className="py-3 text-xs text-[color:var(--text-muted)]">
                      {booking.purpose || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <QuickAction
          to="/tickets?view=assigned"
          icon={ClipboardList}
          title="Assigned Tickets"
          subtitle="Open ticket workspace for assigned queue."
        />
        <QuickAction
          to="/tickets?view=status"
          icon={Settings2}
          title="Update Ticket Status"
          subtitle="Go to status update workflow."
        />
        <QuickAction
          to="/tickets?view=resolution"
          icon={Wrench}
          title="Resolution Workflow"
          subtitle="Go to resolution notes workflow."
        />
        <QuickAction
          to="/bookings"
          icon={CalendarClock}
          title="Bookings Context"
          subtitle="Use booking timeline for prioritizing operational tasks."
        />
        <QuickAction
          to="/profile"
          icon={UserCircle2}
          title="Profile"
          subtitle="Review your technician access identity."
        />
      </div>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <Card className="metric-panel relative overflow-hidden p-5">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-emerald-300/25 blur-2xl dark:bg-sky-400/10" />
      <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)] dark:text-[color:var(--text-muted)]">
        {title}
      </p>
      <p className="relative mt-3 text-4xl font-bold text-[color:var(--navy-deep)] dark:text-[color:var(--text)]">{value}</p>
    </Card>
  );
}

function WorkflowCard({ icon: Icon, title, description }) {
  return (
    <Card className="action-panel p-5 transition hover:-translate-y-1">
      <span className="inline-flex rounded-2xl bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--accent)] p-3 text-white shadow-[0_12px_28px_rgba(18,58,120,0.18)]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-lg font-semibold text-[color:var(--navy-deep)] dark:text-[color:var(--text)]">{title}</p>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">
        {description}
      </p>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="action-panel flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(18,58,120,0.12)] dark:bg-[color:var(--bg-soft)]/75 dark:hover:bg-[color:var(--bg-soft)]"
    >
      <span className="rounded-2xl bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--brand)] p-3 text-white shadow-[0_12px_30px_rgba(18,58,120,0.18)]">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <p className="font-semibold text-[color:var(--navy-deep)] dark:text-[color:var(--text)]">{title}</p>
        <p className="text-xs text-[color:var(--text-muted)]">{subtitle}</p>
      </span>
    </Link>
  );
}

export default TechnicianDashboardPage;
