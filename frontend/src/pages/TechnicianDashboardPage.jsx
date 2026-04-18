import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Route,
  Settings2,
  UserCircle2,
  Wrench,
} from "lucide-react";
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

const TREND_DAYS = 7;

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
      open: assignedTickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: assignedTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: assignedTickets.filter((ticket) => ticket.status === "RESOLVED").length,
      closed: assignedTickets.filter((ticket) => ticket.status === "CLOSED").length,
      rejected: assignedTickets.filter((ticket) => ticket.status === "REJECTED").length,
    }),
    [assignedTickets]
  );

  const prioritySummary = useMemo(() => buildPrioritySummary(assignedTickets), [assignedTickets]);
  const trendData = useMemo(() => buildTechnicianTrend(assignedTickets, TREND_DAYS), [assignedTickets]);

  const resolutionRate = useMemo(() => {
    if (ticketSummary.assigned === 0) return 0;
    return Math.round(((ticketSummary.resolved + ticketSummary.closed) / ticketSummary.assigned) * 100);
  }, [ticketSummary]);

  const staleTickets = useMemo(() => {
    const now = Date.now();
    return assignedTickets.filter((ticket) => {
      if (ticket.status !== "OPEN" && ticket.status !== "IN_PROGRESS") return false;
      const createdAt = new Date(ticket.createdAt).getTime();
      if (Number.isNaN(createdAt)) return false;
      const ageHours = (now - createdAt) / (1000 * 60 * 60);
      return ageHours >= 72;
    }).length;
  }, [assignedTickets]);

  if (role && role !== "TECHNICIAN") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -bottom-24 h-72 w-72 rounded-full bg-indigo-400/18 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Technician Workspace
          </p>
          <h2 className="mt-2 text-2xl font-bold">Technician Dashboard</h2>
          <p className="mt-2 max-w-3xl text-sm text-[color:var(--text-muted)]">
            Monitor workload, ticket velocity, and resolution health in real time while keeping maintenance execution aligned with bookings.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Assigned Tickets" value={ticketSummary.assigned} icon={ClipboardList} tone="cyan" />
        <MetricCard title="In Progress" value={ticketSummary.inProgress} icon={Activity} tone="indigo" />
        <MetricCard title="Resolved / Closed" value={ticketSummary.resolved + ticketSummary.closed} icon={CheckCircle2} tone="emerald" />
        <MetricCard title="Stale 72h+" value={staleTickets} icon={AlertTriangle} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Ticket Throughput Trend</h3>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                Last {TREND_DAYS} days assigned vs completed tickets.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] bg-white/70 px-2.5 py-1 text-xs font-semibold dark:bg-[color:var(--bg-soft)]/80">
              <Gauge className="h-3.5 w-3.5 text-[color:var(--brand)]" />
              Resolution rate: {resolutionRate}%
            </span>
          </div>
          {loading ? <LoadingSkeleton className="h-64 rounded-xl" /> : <TechnicianTrendChart data={trendData} />}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[color:var(--brand)]" />
              <h3 className="text-lg font-semibold">Status Distribution</h3>
            </div>
            {loading ? (
              <LoadingSkeleton className="h-44 rounded-xl" />
            ) : (
              <StatusDonut summary={ticketSummary} />
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[color:var(--brand)]" />
              <h3 className="text-lg font-semibold">Priority Pressure</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="h-7 rounded-xl" />
                ))}
              </div>
            ) : (
              <PriorityBars items={prioritySummary} />
            )}
          </Card>
        </div>
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
          description="Move tickets through IN_PROGRESS, RESOLVED, and CLOSED with clear ownership."
        />
        <WorkflowCard
          icon={Wrench}
          title="Resolution Shortcuts"
          description="Add resolution notes and keep maintenance outcomes fully documented."
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
          to="/technician/sla"
          icon={Gauge}
          title="SLA Monitor"
          subtitle="Track breach risk, due windows, and overdue tickets."
        />
        <QuickAction
          to="/technician/queue"
          icon={ClipboardList}
          title="My Queue"
          subtitle="Open priority-sorted technician queue with quick filters."
        />
        <QuickAction
          to="/technician/visits"
          icon={Route}
          title="Field Visits"
          subtitle="Log travel, arrival, work start, and completion checkpoints."
        />
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
          to="/notifications"
          icon={Activity}
          title="Live Alerts"
          subtitle="Review unread alerts before starting field work."
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

function MetricCard({ title, value, icon: Icon, tone = "cyan" }) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-300/44 via-emerald-200/30 to-emerald-50/90 dark:from-emerald-800/50 dark:via-emerald-900/30 dark:to-[color:var(--bg-soft)]/90"
      : tone === "amber"
        ? "from-amber-300/46 via-amber-200/30 to-amber-50/90 dark:from-amber-800/50 dark:via-amber-900/30 dark:to-[color:var(--bg-soft)]/90"
        : tone === "indigo"
          ? "from-indigo-300/44 via-indigo-200/30 to-indigo-50/90 dark:from-indigo-800/50 dark:via-indigo-900/30 dark:to-[color:var(--bg-soft)]/90"
          : "from-cyan-300/44 via-cyan-200/30 to-cyan-50/90 dark:from-cyan-800/50 dark:via-cyan-900/30 dark:to-[color:var(--bg-soft)]/90";

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

function TechnicianTrendChart({ data }) {
  const width = 640;
  const height = 260;
  const margin = { top: 20, right: 18, bottom: 40, left: 28 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(1, ...data.map((item) => Math.max(item.assigned, item.completed)));

  const points = data.map((item, index) => {
    const x = margin.left + (data.length === 1 ? graphWidth / 2 : (index * graphWidth) / (data.length - 1));
    const assignedY = margin.top + graphHeight - (item.assigned / maxValue) * graphHeight;
    const completedY = margin.top + graphHeight - (item.completed / maxValue) * graphHeight;
    return { x, assignedY, completedY, label: item.label, assigned: item.assigned, completed: item.completed };
  });

  const assignedLine = buildSvgLine(points.map((point) => ({ x: point.x, y: point.assignedY })));
  const completedLine = buildSvgLine(points.map((point) => ({ x: point.x, y: point.completedY })));
  const assignedArea = buildSvgArea(points.map((point) => ({ x: point.x, y: point.assignedY })), margin.top + graphHeight);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 text-[color:var(--text-muted)]">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
          Assigned
        </span>
        <span className="inline-flex items-center gap-1.5 text-[color:var(--text-muted)]">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Completed
        </span>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-3 dark:bg-[color:var(--bg-soft)]/80">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
          <defs>
            <linearGradient id="tech-assigned-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {Array.from({ length: 5 }).map((_, index) => {
            const y = margin.top + (index * graphHeight) / 4;
            const value = Math.round(maxValue - (index * maxValue) / 4);
            return (
              <g key={`grid-${index}`}>
                <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="currentColor" strokeOpacity="0.12" />
                <text x={6} y={y + 4} className="fill-[color:var(--text-muted)] text-[10px]">
                  {value}
                </text>
              </g>
            );
          })}

          <path d={assignedArea} fill="url(#tech-assigned-area)" />
          <path d={assignedLine} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
          <path d={completedLine} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

          {points.map((point) => (
            <g key={point.label}>
              <title>{`${point.label}: assigned ${point.assigned}, completed ${point.completed}`}</title>
              <circle cx={point.x} cy={point.assignedY} r="4" fill="#06b6d4" />
              <circle cx={point.x} cy={point.completedY} r="4" fill="#10b981" />
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

function StatusDonut({ summary }) {
  const segments = [
    { label: "Open", value: summary.open, color: "#06b6d4" },
    { label: "In Progress", value: summary.inProgress, color: "#6366f1" },
    { label: "Resolved", value: summary.resolved, color: "#10b981" },
    { label: "Closed", value: summary.closed, color: "#1d4ed8" },
    { label: "Rejected", value: summary.rejected, color: "#f59e0b" },
  ].filter((segment) => segment.value > 0);

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let cursor = 0;

  const gradient =
    total === 0
      ? "conic-gradient(#cbd5e1 0deg 360deg)"
      : `conic-gradient(${segments
          .map((segment) => {
            const start = (cursor / total) * 360;
            cursor += segment.value;
            const end = (cursor / total) * 360;
            return `${segment.color} ${start}deg ${end}deg`;
          })
          .join(", ")})`;

  return (
    <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-center">
      <div className="mx-auto grid h-[140px] w-[140px] place-items-center rounded-full" style={{ background: gradient }}>
        <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-white/95 text-center dark:bg-[color:var(--bg-soft)]/95">
          <p className="text-lg font-bold">{summary.assigned}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Total</p>
        </div>
      </div>

      <div className="space-y-2">
        {(segments.length ? segments : [{ label: "No status data", value: 0, color: "#94a3b8" }]).map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-white/70 px-2.5 py-1.5 text-xs dark:bg-[color:var(--bg-soft)]/75">
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              {segment.label}
            </span>
            <span className="font-bold">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityBars({ items }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percent = Math.round((item.value / max) * 100);
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">{item.label}</span>
              <span className="font-bold">{item.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200/70 dark:bg-slate-700/50">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${percent}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildPrioritySummary(tickets) {
  const counter = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  tickets.forEach((ticket) => {
    const key = String(ticket.priority || "").toUpperCase();
    if (Object.prototype.hasOwnProperty.call(counter, key)) {
      counter[key] += 1;
    }
  });

  return [
    { label: "Critical", value: counter.CRITICAL, color: "#dc2626" },
    { label: "High", value: counter.HIGH, color: "#f97316" },
    { label: "Medium", value: counter.MEDIUM, color: "#0ea5e9" },
    { label: "Low", value: counter.LOW, color: "#22c55e" },
  ];
}

function buildTechnicianTrend(tickets, dayCount) {
  const now = new Date();
  const buckets = [];

  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = toDateKey(date);
    buckets.push({
      key,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      assigned: 0,
      completed: 0,
    });
  }

  const indexByKey = Object.fromEntries(buckets.map((bucket, index) => [bucket.key, index]));

  tickets.forEach((ticket) => {
    const created = new Date(ticket.createdAt);
    if (!Number.isNaN(created.getTime())) {
      const bucketIndex = indexByKey[toDateKey(created)];
      if (bucketIndex !== undefined) {
        buckets[bucketIndex].assigned += 1;
      }
    }

    const done = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
    const completedAt = new Date(ticket.updatedAt || ticket.createdAt);
    if (done && !Number.isNaN(completedAt.getTime())) {
      const bucketIndex = indexByKey[toDateKey(completedAt)];
      if (bucketIndex !== undefined) {
        buckets[bucketIndex].completed += 1;
      }
    }
  });

  return buckets;
}

function toDateKey(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return `${normalized.getFullYear()}-${String(normalized.getMonth() + 1).padStart(2, "0")}-${String(normalized.getDate()).padStart(2, "0")}`;
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

export default TechnicianDashboardPage;
