import { CalendarClock, ClipboardList, Settings2, UserCircle2, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { fetchAssignedTickets, fetchBookings, fetchProfile } from "../api/campusApi";
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
        const [profileResponse, bookingsResponse, ticketResponse] = await Promise.all([
          fetchProfile(),
          fetchBookings({ page: 0, size: 300 }),
          fetchAssignedTickets({ page: 0, size: 300 }),
        ]);
        setRole(normalizeRole(profileResponse?.data?.role));
        setBookings(bookingsResponse.items);
        setAssignedTickets(ticketResponse.items);

        if (bookingsResponse.isFallback || profileResponse.isFallback || ticketResponse.isFallback) {
          addToast({
            type: "info",
            title: "Fallback mode active",
            message: "Using local fallback values for part of technician dashboard data.",
          });
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Technician dashboard unavailable",
          message: error?.response?.data?.message || "Failed to load technician dashboard data.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const operationalBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 6),
    [bookings]
  );

  const ticketSummary = useMemo(
    () => ({
      assigned: assignedTickets.length,
      inProgress: assignedTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: assignedTickets.filter((ticket) => ticket.status === "RESOLVED").length,
      closed: assignedTickets.filter((ticket) => ticket.status === "CLOSED").length,
    }),
    [assignedTickets]
  );

  if (role && role !== "TECHNICIAN") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Technician Workspace</p>
        <h2 className="mt-2 text-2xl font-bold">Technician Dashboard</h2>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Track assigned maintenance workflows and keep resource issue resolution aligned with live operations.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Assigned Tickets" value={ticketSummary.assigned} />
        <MetricCard title="In Progress" value={ticketSummary.inProgress} />
        <MetricCard title="Resolved / Closed" value={ticketSummary.resolved + ticketSummary.closed} />
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
          <Link to="/bookings" className="text-sm font-semibold text-[color:var(--brand)] hover:underline">
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
                    <td className="py-3 font-semibold">{booking.resourceName}</td>
                    <td className="py-3 text-xs">{formatDateTime(booking.startTime)}</td>
                    <td className="py-3">
                      <Badge value={booking.status} />
                    </td>
                    <td className="py-3 text-xs text-[color:var(--text-muted)]">{booking.purpose || "N/A"}</td>
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
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}

function WorkflowCard({ icon: Icon, title, description }) {
  return (
    <Card className="p-4">
      <span className="inline-flex rounded-lg bg-[color:var(--brand-soft)] p-2 text-[color:var(--brand)]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-xs text-[color:var(--text-muted)]">{description}</p>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-white/70 p-4 transition hover:bg-white dark:bg-[color:var(--bg-soft)]/75 dark:hover:bg-[color:var(--bg-soft)]"
    >
      <span className="rounded-lg bg-[color:var(--brand-soft)] p-2 text-[color:var(--brand)]">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-[color:var(--text-muted)]">{subtitle}</p>
      </span>
    </Link>
  );
}

export default TechnicianDashboardPage;
