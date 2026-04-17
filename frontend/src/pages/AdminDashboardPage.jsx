import {
  BookCheck,
  ClipboardList,
  Link2,
  ShieldUser,
  UserCog,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  fetchAdminLinkRequests,
  fetchAdminTickets,
  fetchBookings,
  fetchProfile,
  fetchResources,
  fetchUsers,
} from "../api/campusApi";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";
import { formatDateTime } from "../utils/format";
import { normalizeRole } from "../utils/roles";

function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [summary, setSummary] = useState({
    resources: 0,
    bookings: 0,
    pendingBookings: 0,
    users: 0,
    pendingLinkRequests: 0,
    tickets: 0,
  });
  const [linkRequests, setLinkRequests] = useState([]);
  const [linkRequestsAvailable, setLinkRequestsAvailable] = useState(true);
  const [linkRequestsError, setLinkRequestsError] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const profileResponse = await fetchProfile();
        const resolvedRole = normalizeRole(profileResponse?.data?.role);
        setRole(resolvedRole);

        const [resourcesResult, bookingsResult, usersResult, linkRequestsResult, ticketsResult] = await Promise.allSettled([
          fetchResources({ page: 0, size: 300 }),
          fetchBookings({ page: 0, size: 300 }),
          fetchUsers({ page: 0, size: 300 }),
          fetchAdminLinkRequests("PENDING"),
          fetchAdminTickets({ page: 0, size: 300 }),
        ]);

        const nextSummary = {
          resources: 0,
          bookings: 0,
          pendingBookings: 0,
          users: 0,
          pendingLinkRequests: 0,
          tickets: 0,
        };

        let usedFallback = false;

        if (linkRequestsResult.status === "fulfilled") {
          nextSummary.pendingLinkRequests = linkRequestsResult.value.items.length;
          setLinkRequests(linkRequestsResult.value.items);
          setLinkRequestsAvailable(true);
          setLinkRequestsError("");
        } else {
          setLinkRequests([]);
          setLinkRequestsAvailable(false);
          setLinkRequestsError(
            linkRequestsResult.reason?.response?.data?.message ||
              "Pending link-request API is currently unavailable."
          );
        }

        if (resourcesResult.status === "fulfilled") {
          nextSummary.resources = resourcesResult.value.items.length;
          usedFallback = usedFallback || Boolean(resourcesResult.value.isFallback);
        }

        if (bookingsResult.status === "fulfilled") {
          nextSummary.bookings = bookingsResult.value.items.length;
          nextSummary.pendingBookings = bookingsResult.value.items.filter(
            (booking) => booking.status === "PENDING"
          ).length;
          usedFallback = usedFallback || Boolean(bookingsResult.value.isFallback);
        }

        if (usersResult.status === "fulfilled") {
          nextSummary.users = usersResult.value.items.length;
          usedFallback = usedFallback || Boolean(usersResult.value.isFallback);
        }

        if (ticketsResult.status === "fulfilled") {
          nextSummary.tickets = ticketsResult.value.items.length;
          usedFallback = usedFallback || Boolean(ticketsResult.value.isFallback);
        }

        setSummary(nextSummary);

        if (usedFallback) {
          addToast({
            type: "info",
            title: "Fallback data in use",
            message: "Some admin dashboard values are using local fallback mode.",
          });
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Admin dashboard unavailable",
          message: error?.response?.data?.message || "Failed to load admin dashboard data.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const previewLinkRequests = useMemo(() => linkRequests.slice(0, 5), [linkRequests]);

  if (role && role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Admin Workspace
        </p>
        <h2 className="mt-2 text-2xl font-bold">Admin Dashboard</h2>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Control resources, approvals, user operations, and account-link governance from one place.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <SummaryCard title="Resources" value={summary.resources} />
        <SummaryCard title="Bookings" value={summary.bookings} />
        <SummaryCard title="Pending Bookings" value={summary.pendingBookings} />
        <SummaryCard title="Tickets" value={summary.tickets} />
        <SummaryCard title="Pending Link Requests" value={summary.pendingLinkRequests} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ShortcutCard
          to="/resources"
          icon={Wrench}
          title="Resource Management"
          subtitle="Create and maintain resource inventory."
          loading={loading}
          countLabel="Resources"
          countValue={summary.resources}
        />
        <ShortcutCard
          to="/bookings?status=PENDING"
          icon={BookCheck}
          title="Booking Approvals"
          subtitle="Review pending booking decisions."
          loading={loading}
          countLabel="Pending"
          countValue={summary.pendingBookings}
        />
        <ShortcutCard
          to="/users"
          icon={UserCog}
          title="User Management"
          subtitle="Inspect role-based user records."
          loading={loading}
          countLabel="Users"
          countValue={summary.users}
        />
        <ShortcutCard
          to="/tickets"
          icon={ClipboardList}
          title="Ticket Operations"
          subtitle="Monitor and manage all ticket workflows."
          loading={loading}
          countLabel="Tickets"
          countValue={summary.tickets}
        />
        <ShortcutCard
          to="/admin/link-requests"
          icon={Link2}
          title="Pending Link Requests"
          subtitle="Approve or reject mismatched Google-account links."
          loading={loading}
          countLabel="Pending"
          countValue={summary.pendingLinkRequests}
        />
        <ShortcutCard
          to="/tickets?view=admin-ops"
          icon={ClipboardList}
          title="Reject / Escalate"
          subtitle="Use ticket workspace to reject tickets with reasons and audit status."
        />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pending Link-Request Preview</h3>
          <Link to="/admin/link-requests" className="text-sm font-semibold text-[color:var(--brand)] hover:underline">
            Open full queue
          </Link>
        </div>

        {!linkRequestsAvailable ? (
          <EmptyState
            title="Link-request preview unavailable"
            description={`${linkRequestsError} TODO: keep this preview connected to /api/admin/link-requests.`}
            icon={ShieldUser}
          />
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : previewLinkRequests.length === 0 ? (
          <EmptyState
            title="No pending link requests"
            description="There are currently no pending mismatched Google-link requests."
          />
        ) : (
          <div className="fine-scrollbar overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                <tr>
                  <th className="pb-3">Request</th>
                  <th className="pb-3">Google Email</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {previewLinkRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="py-3 font-semibold">#{request.id}</td>
                    <td className="py-3">{request.requestedGoogleEmail}</td>
                    <td className="py-3">
                      <Badge value={request.status} />
                    </td>
                    <td className="py-3 text-xs text-[color:var(--text-muted)]">
                      {formatDateTime(request.createdAt)}
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

function SummaryCard({ title, value }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}

function ShortcutCard({
  to,
  icon: Icon,
  title,
  subtitle,
  loading = false,
  countLabel,
  countValue,
  todo = false,
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 transition hover:bg-white dark:bg-[color:var(--bg-soft)]/80 dark:hover:bg-[color:var(--bg-soft)]"
    >
      <span className="inline-flex rounded-lg bg-[color:var(--brand-soft)] p-2 text-[color:var(--brand)]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-xs text-[color:var(--text-muted)]">{subtitle}</p>
      {loading ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
          Loading...
        </p>
      ) : null}
      {!loading && countLabel ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
          {countLabel}: {countValue}
        </p>
      ) : null}
      {todo ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
          TODO Stub
        </p>
      ) : null}
    </Link>
  );
}

export default AdminDashboardPage;
