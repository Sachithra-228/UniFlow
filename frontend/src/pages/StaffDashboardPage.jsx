import { BellRing, CalendarClock, ClipboardList, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { fetchBookings, fetchMyTickets, fetchProfile } from "../api/campusApi";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";
import { formatDateTime } from "../utils/format";
import { normalizeRole } from "../utils/roles";

function StaffDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [role, setRole] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileResponse, bookingsResponse, ticketsResponse] = await Promise.all([
          fetchProfile(),
          fetchBookings({ page: 0, size: 300 }),
          fetchMyTickets({ page: 0, size: 300 }),
        ]);
        setRole(normalizeRole(profileResponse?.data?.role));
        setBookings(bookingsResponse.items);
        setTickets(ticketsResponse.items);

        if (bookingsResponse.isFallback || profileResponse.isFallback || ticketsResponse.isFallback) {
          addToast({
            type: "info",
            title: "Fallback mode active",
            message: "Some staff dashboard values are using local fallback data.",
          });
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Staff dashboard unavailable",
          message: error?.response?.data?.message || "Failed to load staff operations data.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "PENDING"),
    [bookings]
  );

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 6),
    [bookings]
  );

  const ticketSummary = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    }),
    [tickets]
  );

  if (role && role !== "STAFF") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Staff Workspace</p>
        <h2 className="mt-2 text-2xl font-bold">Staff Dashboard</h2>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Coordinate booking operations for teaching schedules and track staff-facing support workflows.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Bookings" value={bookings.length} />
        <MetricCard title="Pending Requests" value={pendingBookings.length} />
        <MetricCard title="My Tickets" value={ticketSummary.total} />
        <MetricCard title="Open Tickets" value={ticketSummary.open + ticketSummary.inProgress} />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Booking Activity</h3>
          <Link to="/bookings?status=PENDING" className="text-sm font-semibold text-[color:var(--brand)] hover:underline">
            Review pending
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <EmptyState
            title="No booking activity yet"
            description="Bookings will appear once requests are created."
          />
        ) : (
          <div className="fine-scrollbar overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                <tr>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Resource</th>
                  <th className="pb-3">Start</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-3 font-semibold">{booking.userName}</td>
                    <td className="py-3">{booking.resourceName}</td>
                    <td className="py-3 text-xs">{formatDateTime(booking.startTime)}</td>
                    <td className="py-3">
                      <Badge value={booking.status} />
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
          to="/bookings"
          icon={CalendarClock}
          title="Booking Actions"
          subtitle="Create bookings and monitor current request status."
        />
        <QuickAction
          to="/bookings?status=PENDING"
          icon={CalendarClock}
          title="Pending Booking Queue"
          subtitle="Focus on unresolved requests that need operational follow-up."
        />
        <QuickAction
          to="/tickets"
          icon={ClipboardList}
          title="Staff Tickets"
          subtitle="Create and track tickets for staff operational issues."
        />
        <QuickAction
          to="/notifications"
          icon={BellRing}
          title="Notifications"
          subtitle="Review platform alerts and status notifications."
        />
        <QuickAction
          to="/profile"
          icon={UserCircle2}
          title="Profile"
          subtitle="Check role and account identity details."
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

export default StaffDashboardPage;
