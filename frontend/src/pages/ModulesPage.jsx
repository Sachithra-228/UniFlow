import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  UsersRound,
  Wrench,
  Zap,
  BarChart3,
  FileSearch,
  Settings2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    tagline: "Your operational command center",
    detail:
      "Live KPIs, category snapshots, workload distribution, and quick operational actions — all in one glance.",
    status: "Live",
    statusColor: "emerald",
    capabilities: [
      "Real-time stat cards & metrics",
      "Recent bookings feed",
      "Resource category breakdown",
      "Quick action shortcuts",
    ],
    accent: "from-cyan-500 to-blue-600",
    accentBg: "from-cyan-500/10 to-blue-600/10",
    link: "/dashboard",
  },
  {
    icon: CalendarClock,
    name: "Resources & Bookings",
    tagline: "Inventory meets scheduling",
    detail:
      "Register campus resources, define availability, handle booking requests with conflict-safe validation and approval workflows.",
    status: "Live",
    statusColor: "emerald",
    capabilities: [
      "Resource CRUD with type & capacity",
      "Time-slot conflict detection",
      "Booking approval pipeline",
      "Overlap constraint enforcement",
    ],
    accent: "from-violet-500 to-purple-600",
    accentBg: "from-violet-500/10 to-purple-600/10",
    link: "/bookings",
  },
  {
    icon: Wrench,
    name: "Maintenance Tickets",
    tagline: "Issue tracking from report to resolution",
    detail:
      "Full-lifecycle ticket management with role-based assignment, priority levels, status transitions, and SLA tracking.",
    status: "Planned",
    statusColor: "amber",
    capabilities: [
      "Ticket creation & categorization",
      "Assignment & ownership tracking",
      "Priority & SLA indicators",
      "Comment threads & history",
    ],
    accent: "from-orange-500 to-rose-500",
    accentBg: "from-orange-500/10 to-rose-500/10",
    link: null,
  },
  {
    icon: BellRing,
    name: "Notifications",
    tagline: "Stay in the loop, always",
    detail:
      "Context-aware operational alerts for booking decisions, ticket updates, assignment changes, and system events.",
    status: "Planned",
    statusColor: "amber",
    capabilities: [
      "Unread count & badges",
      "Read-state management",
      "Contextual deep links",
      "Role-filtered delivery",
    ],
    accent: "from-sky-500 to-indigo-500",
    accentBg: "from-sky-500/10 to-indigo-500/10",
    link: null,
  },
  {
    icon: UsersRound,
    name: "User Directory",
    tagline: "People data at your fingertips",
    detail:
      "Browse, filter, and inspect campus users with role information, provider details, and activity timestamps.",
    status: "Live",
    statusColor: "emerald",
    capabilities: [
      "Paginated user listing",
      "Role & provider visibility",
      "User profile inspection",
      "Admin-only access control",
    ],
    accent: "from-teal-500 to-emerald-500",
    accentBg: "from-teal-500/10 to-emerald-500/10",
    link: "/users",
  },
  {
    icon: ShieldCheck,
    name: "Identity & Access",
    tagline: "Secure by design",
    detail:
      "Google OAuth 2.0 authentication with role-based route protection and secure endpoint-level authorization.",
    status: "Live",
    statusColor: "emerald",
    capabilities: [
      "Google OAuth 2.0 sign-in",
      "OIDC token verification",
      "Protected route guards",
      "Role-based permissions",
    ],
    accent: "from-emerald-500 to-cyan-500",
    accentBg: "from-emerald-500/10 to-cyan-500/10",
    link: null,
  },
];

const stats = [
  { icon: Zap, value: "6", label: "Core Modules" },
  { icon: BarChart3, value: "4", label: "Live Now" },
  { icon: Clock3, value: "2", label: "Coming Soon" },
  { icon: Settings2, value: "24+", label: "Capabilities" },
];

const statusConfig = {
  Live: {
    icon: CheckCircle2,
    classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Planned: {
    icon: Clock3,
    classes: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

function ModulesPage() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pb-20 pt-6">
      <div className="mx-auto max-w-6xl">
        {/* ── Hero Header ───────────────────────────────── */}
        <header className="animate-reveal mb-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
            System Modules
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 md:text-5xl dark:text-white">
            Everything your operations team needs, split by responsibility.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-blue-100/90">
            Each module is a self-contained unit handling one operational domain — from resource scheduling to identity management.
          </p>
        </header>

        {/* ── Stats Row ─────────────────────────────────── */}
        <section className="animate-reveal mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "80ms" }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-white/12 dark:bg-white/[0.06]"
            >
              <span className="rounded-xl bg-cyan-100 p-2.5 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200">
                <stat.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-blue-100/70">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Module Cards Grid ─────────────────────────── */}
        <section className="grid gap-5 md:grid-cols-2">
          {modules.map((mod, index) => {
            const statusMeta = statusConfig[mod.status];
            const StatusIcon = statusMeta.icon;
            const isClickable = mod.link !== null;

            return (
              <article
                key={mod.name}
                className={`group animate-reveal relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 dark:border-white/12 dark:bg-white/[0.06] dark:shadow-none ${isClickable
                  ? "cursor-pointer hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.13)] dark:hover:border-white/20"
                  : ""
                  }`}
                style={{ animationDelay: `${100 + index * 80}ms` }}
                onClick={() => isClickable && navigate(mod.link)}
                role={isClickable ? "link" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => isClickable && e.key === "Enter" && navigate(mod.link)}
              >
                {/* Gradient accent top bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${mod.accent}`} />

                <div className="p-5">
                  {/* Top row: Icon + Status */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex rounded-xl bg-gradient-to-br ${mod.accentBg} p-3 text-slate-700 dark:text-white`}
                    >
                      <mod.icon className="h-6 w-6" />
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusMeta.classes}`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                      {mod.status}
                    </span>
                  </div>

                  {/* Title + Tagline */}
                  <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{mod.name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-cyan-700 dark:text-cyan-300">{mod.tagline}</p>

                  {/* Description */}
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-blue-100/80">{mod.detail}</p>

                  {/* Capabilities */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-blue-100/50">
                      Capabilities
                    </p>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {mod.capabilities.map((cap) => (
                        <li key={cap} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-blue-100/75">
                          <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-cyan-500 dark:text-cyan-400" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/*Footer action*/}
                  {isClickable ? (
                    <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-[color:var(--brand)] transition-colors group-hover:text-cyan-600 dark:text-cyan-300 dark:group-hover:text-cyan-200">
                      Open module
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  ) : (
                    <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-slate-400 dark:text-blue-100/40">
                      <Lock className="h-3.5 w-3.5" />
                      Coming soon
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* ── Bottom CTA ────────────────────────────────── */}
        <section className="animate-reveal mt-12" style={{ animationDelay: "600ms" }}>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-white/12 dark:from-[color:var(--navy-mid)] dark:to-[color:var(--navy-deep)] dark:shadow-none md:flex md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
                Platform Architecture
              </p>
              <p className="mt-2 max-w-lg text-base font-semibold text-slate-800 dark:text-white/90">
                Modules communicate through shared APIs and a unified data layer — enabling seamless cross-module workflows.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate("/features")}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--brand)] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 dark:bg-cyan-500 dark:text-[color:var(--navy-deep)]"
              >
                <FileSearch className="h-4 w-4" />
                Explore Features
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ModulesPage;
