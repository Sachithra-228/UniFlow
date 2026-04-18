import { BellRing, CalendarClock, Clock3, ClipboardList, Sparkles, TrendingUp, UserCircle2 } from "lucide-react";
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

const TREND_MONTHS = 6;

function StudentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
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

        setProfile(profileResponse.data);
        setRole(normalizeRole(profileResponse.data?.role));
        setBookings(bookingsResponse.items);
        setTickets(ticketsResponse.items);

        if (bookingsResponse.isFallback || profileResponse.isFallback || ticketsResponse.isFallback) {
          addToast({
            type: "info",
            title: "Fallback mode active",
            message: "Some dashboard data is using local fallback values.",
          });
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Student dashboard unavailable",
          message: error?.response?.data?.message || "Failed to load student dashboard data.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const myBookings = useMemo(() => {
    const profileId = Number(profile?.id);
    if (!Number.isFinite(profileId)) return [];

    return bookings
      .filter((booking) => Number(booking.userId) === profileId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [bookings, profile?.id]);

  const upcomingBookings = useMemo(() => {
    const now = Date.now();
    return myBookings.filter((booking) => new Date(booking.startTime).getTime() >= now);
  }, [myBookings]);

  const nextBooking = upcomingBookings[0] ?? null;

  const trendData = useMemo(
    () => buildStudentTrend(myBookings, tickets, TREND_MONTHS),
    [myBookings, tickets]
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

  if (role && role !== "STUDENT") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-6 md:p-7">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-indigo-400/16 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-100/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-900 dark:border-cyan-500/30 dark:bg-cyan-900/30 dark:text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Student Workspace
            </p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--text-muted)]">
              Track your bookings and tickets in one place, watch monthly activity trends, and jump quickly into your most-used student actions.
            </p>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-white/65 p-4 dark:bg-[color:var(--bg-soft)]/80">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">Next Booking</p>
            {loading ? (
              <div className="mt-3 space-y-2">
                <LoadingSkeleton className="h-4 w-3/4 rounded-lg" />
                <LoadingSkeleton className="h-4 w-2/3 rounded-lg" />
              </div>
            ) : nextBooking ? (
              <div className="mt-3 space-y-2">
                <p className="font-semibold">{nextBooking.resourceName}</p>
                <p className="text-xs text-[color:var(--text-muted)]">{formatDateTime(nextBooking.startTime)}</p>
                <div>
                  <Badge value={nextBooking.status} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[color:var(--text-muted)]">No upcoming bookings yet.</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="My Bookings" value={myBookings.length} icon={CalendarClock} />
        <MetricCard title="Upcoming" value={upcomingBookings.length} icon={Clock3} />
        <MetricCard title="My Tickets" value={ticketSummary.total} icon={ClipboardList} />
        <MetricCard title="Open Tickets" value={ticketSummary.open + ticketSummary.inProgress} icon={TrendingUp} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">My Bookings</h3>
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
          ) : myBookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="Create a booking request to start using campus resources."
            />
          ) : (
            <div className="fine-scrollbar overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                  <tr>
                    <th className="pb-3">Resource</th>
                    <th className="pb-3">Start</th>
                    <th className="pb-3">End</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {myBookings.slice(0, 6).map((booking) => (
                    <tr key={booking.id}>
                      <td className="py-3 font-semibold">{booking.resourceName}</td>
                      <td className="py-3 text-xs">{formatDateTime(booking.startTime)}</td>
                      <td className="py-3 text-xs">{formatDateTime(booking.endTime)}</td>
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

        <Card className="p-5">
          <div className="mb-3">
            <h3 className="text-lg font-semibold">Activity Trend</h3>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              Last {TREND_MONTHS} months of booking and ticket activity.
            </p>
          </div>
          {loading ? (
            <LoadingSkeleton className="h-64 rounded-xl" />
          ) : (
            <StudentTrendChart data={trendData} />
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">Go straight to the pages students use most.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        <QuickAction
          to="/bookings"
          icon={CalendarClock}
          title="My Bookings"
          subtitle="Create and monitor resource booking requests."
        />
        <QuickAction
          to="/tickets"
          icon={ClipboardList}
          title="My Tickets"
          subtitle="Create and track your support ticket workflow."
        />
        <QuickAction
          to="/notifications"
          icon={BellRing}
          title="Notifications"
          subtitle="Review platform alerts and activity notifications."
        />
        <QuickAction
          to="/profile"
          icon={UserCircle2}
          title="My Profile"
          subtitle="Review your role, provider, and identity details."
        />
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon }) {
  return (
    <Card className="rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-white/85 to-cyan-50/65 p-4 dark:from-[color:var(--bg-soft)]/90 dark:to-cyan-900/15">
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

function QuickAction({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_30px_-22px_rgba(14,165,233,0.55)] dark:bg-[color:var(--bg-soft)]/75 dark:hover:bg-[color:var(--bg-soft)]"
    >
      <span className="rounded-lg bg-[color:var(--brand-soft)] p-2 text-[color:var(--brand)] transition group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-[color:var(--text-muted)]">{subtitle}</p>
      </span>
    </Link>
  );
}

function StudentTrendChart({ data }) {
  const width = 640;
  const height = 260;
  const margin = { top: 20, right: 18, bottom: 40, left: 28 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(1, ...data.map((item) => Math.max(item.bookings, item.tickets)));

  const points = data.map((item, index) => {
    const x = margin.left + (data.length === 1 ? graphWidth / 2 : (index * graphWidth) / (data.length - 1));
    const bookingY = margin.top + graphHeight - (item.bookings / maxValue) * graphHeight;
    const ticketY = margin.top + graphHeight - (item.tickets / maxValue) * graphHeight;
    return { x, bookingY, ticketY, label: item.label, bookings: item.bookings, tickets: item.tickets };
  });

  const bookingLine = buildSvgLine(points.map((point) => ({ x: point.x, y: point.bookingY })));
  const ticketLine = buildSvgLine(points.map((point) => ({ x: point.x, y: point.ticketY })));
  const bookingArea = buildSvgArea(points.map((point) => ({ x: point.x, y: point.bookingY })), margin.top + graphHeight);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 text-[color:var(--text-muted)]">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
          Bookings
        </span>
        <span className="inline-flex items-center gap-1.5 text-[color:var(--text-muted)]">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          Tickets
        </span>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-3 dark:bg-[color:var(--bg-soft)]/80">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
          <defs>
            <linearGradient id="student-booking-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {Array.from({ length: 5 }).map((_, index) => {
            const y = margin.top + (index * graphHeight) / 4;
            const value = Math.round(maxValue - (index * maxValue) / 4);
            return (
              <g key={`grid-${index}`}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.12"
                />
                <text x={6} y={y + 4} className="fill-[color:var(--text-muted)] text-[10px]">
                  {value}
                </text>
              </g>
            );
          })}

          <path d={bookingArea} fill="url(#student-booking-area)" />
          <path d={bookingLine} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
          <path d={ticketLine} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />

          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.bookingY} r="4" fill="#06b6d4" />
              <circle cx={point.x} cy={point.ticketY} r="4" fill="#4f46e5" />
              <text x={point.x} y={height - 10} textAnchor="middle" className="fill-[color:var(--text-muted)] text-[10px] font-semibold">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function buildStudentTrend(bookings, tickets, monthCount) {
  const now = new Date();
  const buckets = [];

  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = String(date.getFullYear()).slice(-2);
    buckets.push({ key, label: `${month} '${year}`, bookings: 0, tickets: 0 });
  }

  const indexByKey = Object.fromEntries(buckets.map((bucket, index) => [bucket.key, index]));

  bookings.forEach((booking) => {
    const date = new Date(booking.startTime);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucketIndex = indexByKey[key];
    if (bucketIndex === undefined) return;
    buckets[bucketIndex].bookings += 1;
  });

  tickets.forEach((ticket) => {
    const date = new Date(ticket.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucketIndex = indexByKey[key];
    if (bucketIndex === undefined) return;
    buckets[bucketIndex].tickets += 1;
  });

  return buckets;
}

function buildSvgLine(points) {
  if (!points.length) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildSvgArea(points, baselineY) {
  if (!points.length) return "";
  const line = buildSvgLine(points);
  const start = points[0];
  const end = points[points.length - 1];
  return `${line} L ${end.x} ${baselineY} L ${start.x} ${baselineY} Z`;
}

export default StudentDashboardPage;
