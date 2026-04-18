import {
  BookCheck,
  ClipboardList,
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
import { formatDateTime, titleCase } from "../utils/format";
import { normalizeRole } from "../utils/roles";

const PIE_COLORS = ["#06b6d4", "#0ea5e9", "#14b8a6", "#818cf8", "#f59e0b", "#f43f5e"];

function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [summary, setSummary] = useState({
    pendingBookings: 0,
    pendingLinkRequests: 0,
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

        let usedFallback = false;

        if (resourcesResult.status === "fulfilled") {
          setResources(resourcesResult.value.items);
          usedFallback = usedFallback || Boolean(resourcesResult.value.isFallback);
        } else {
          setResources([]);
        }

        if (bookingsResult.status === "fulfilled") {
          setBookings(bookingsResult.value.items);
          usedFallback = usedFallback || Boolean(bookingsResult.value.isFallback);
        } else {
          setBookings([]);
        }

        if (usersResult.status === "fulfilled") {
          setUsers(usersResult.value.items);
          usedFallback = usedFallback || Boolean(usersResult.value.isFallback);
        } else {
          setUsers([]);
        }

        if (ticketsResult.status === "fulfilled") {
          setTicketsCount(ticketsResult.value.items.length);
          usedFallback = usedFallback || Boolean(ticketsResult.value.isFallback);
        } else {
          setTicketsCount(0);
        }

        if (linkRequestsResult.status === "fulfilled") {
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

        setSummary({
          pendingBookings:
            bookingsResult.status === "fulfilled"
              ? bookingsResult.value.items.filter((booking) => booking.status === "PENDING").length
              : 0,
          pendingLinkRequests:
            linkRequestsResult.status === "fulfilled" ? linkRequestsResult.value.items.length : 0,
        });

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

  const resourceTypeChart = useMemo(() => {
    const grouped = resources.reduce((acc, item) => {
      const key = item.type ?? "OTHER";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([label, value]) => ({ label: titleCase(label), value }));
  }, [resources]);

  const bookingStatusChart = useMemo(() => {
    const grouped = bookings.reduce((acc, item) => {
      const key = item.status ?? "UNKNOWN";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([label, value]) => ({ label: titleCase(label), value }));
  }, [bookings]);

  const bookingActivityBars = useMemo(() => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = weekDays.map((day) => ({ label: day, value: 0 }));
    bookings.forEach((item) => {
      if (!item.startTime) return;
      const day = new Date(item.startTime).getDay();
      counts[day].value += 1;
    });
    const max = Math.max(1, ...counts.map((x) => x.value));
    return counts.map((item) => ({
      ...item,
      percentage: (item.value / max) * 100,
    }));
  }, [bookings]);

  const roleBreakdown = useMemo(() => {
    const grouped = users.reduce((acc, user) => {
      const key = normalizeRole(user.role) ?? "STUDENT";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([label, value]) => ({ label, value }));
  }, [users]);

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
          Monitor operational flow with live charts and jump directly into approvals, users, and resources.
        </p>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-lg font-semibold">Resource Type Distribution</h3>
          {loading ? (
            <LoadingSkeleton className="mt-4 h-[260px] rounded-xl" />
          ) : resourceTypeChart.length ? (
            <DonutChart data={resourceTypeChart} />
          ) : (
            <EmptyState title="No resources yet" description="Add resources to generate distribution analytics." />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold">Booking Activity (By Weekday)</h3>
          {loading ? (
            <LoadingSkeleton className="mt-4 h-[260px] rounded-xl" />
          ) : (
            <BarChart data={bookingActivityBars} />
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Card className="p-5">
          <h3 className="text-lg font-semibold">Booking Status Overview</h3>
          {loading ? (
            <LoadingSkeleton className="mt-4 h-[250px] rounded-xl" />
          ) : bookingStatusChart.length ? (
            <DonutChart data={bookingStatusChart} />
          ) : (
            <EmptyState title="No booking data" description="Booking status chart will appear after requests are created." />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold">Role Breakdown</h3>
          {loading ? (
            <LoadingSkeleton className="mt-4 h-[250px] rounded-xl" />
          ) : roleBreakdown.length ? (
            <div className="mt-4 space-y-3">
              {roleBreakdown.map((item, index) => (
                <div key={item.label} className="rounded-xl border border-[color:var(--border)] bg-white/65 p-3 dark:bg-white/[0.08]">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[color:var(--text-muted)]">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-300/45 dark:bg-slate-700/60">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max((item.value / Math.max(1, users.length)) * 100, 8)}%`,
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No users found" description="User role distribution will appear here." />
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ShortcutCard
          to="/resources"
          icon={Wrench}
          title="Resources"
          subtitle="Create, update, and remove resources."
          countLabel="Total"
          countValue={resources.length}
          loading={loading}
        />
        <ShortcutCard
          to="/bookings?status=PENDING"
          icon={BookCheck}
          title="Bookings Queue"
          subtitle="Review pending booking requests."
          countLabel="Pending"
          countValue={summary.pendingBookings}
          loading={loading}
        />
        <ShortcutCard
          to="/users"
          icon={UserCog}
          title="Users"
          subtitle="Manage account roles and status."
          countLabel="Total"
          countValue={users.length}
          loading={loading}
        />
        <ShortcutCard
          to="/tickets"
          icon={ClipboardList}
          title="Tickets"
          subtitle="Track issue workload and assignments."
          countLabel="Total"
          countValue={ticketsCount}
          loading={loading}
        />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pending Link-Request Preview</h3>
          <div className="flex items-center gap-3">
            <Badge value={`Pending ${summary.pendingLinkRequests}`} />
            <Link to="/admin/link-requests" className="text-sm font-semibold text-[color:var(--brand)] hover:underline">
              Open full queue
            </Link>
          </div>
        </div>

        {!linkRequestsAvailable ? (
          <EmptyState
            title="Link-request preview unavailable"
            description={linkRequestsError}
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

function DonutChart({ data }) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulative = 0;
  const stops = data.map((item, index) => {
    const start = total ? (cumulative / total) * 100 : 0;
    cumulative += item.value;
    const end = total ? (cumulative / total) * 100 : 0;
    return `${PIE_COLORS[index % PIE_COLORS.length]} ${start}% ${end}%`;
  });

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
      <div
        className="mx-auto h-44 w-44 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="mx-auto mt-10 flex h-24 w-24 items-center justify-center rounded-full bg-[color:var(--surface)] text-xs font-semibold">
          {total} items
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/65 px-3 py-2 text-sm dark:bg-white/[0.08]">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="font-semibold">{item.label}</span>
            </span>
            <span className="text-[color:var(--text-muted)]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  return (
    <div className="mt-4 grid grid-cols-7 items-end gap-3 rounded-xl border border-[color:var(--border)] bg-white/65 p-4 dark:bg-white/[0.05]">
      {data.map((item, index) => (
        <div key={item.label} className="flex flex-col items-center gap-2">
          <span className="text-[11px] font-semibold text-[color:var(--text-muted)]">{item.value}</span>
          <div className="flex h-40 w-full items-end rounded-md bg-slate-200/45 px-1 dark:bg-slate-700/45">
            <div
              className="w-full rounded-md"
              style={{
                height: `${Math.max(item.percentage, 4)}%`,
                backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
              }}
            />
          </div>
          <span className="text-xs font-semibold text-[color:var(--text-muted)]">{item.label}</span>
        </div>
      ))}
    </div>
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
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 transition hover:bg-white dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
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
      ) : (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
          {countLabel}: {countValue}
        </p>
      )}
    </Link>
  );
}

export default AdminDashboardPage;
