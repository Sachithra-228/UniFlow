import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Fingerprint,
  Gauge,
  GitMerge,
  Globe,
  LayoutDashboard,
  Layers3,
  LineChart,
  RefreshCcw,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  UsersRound,
  Wrench,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ── Hero features (large, 2-col spotlight) ───────────── */
const spotlightFeatures = [
  {
    icon: LayoutDashboard,
    title: "Unified Command Center",
    description:
      "Get a holistic view of campus operations — live KPIs, resource utilization, booking trends, and team workload — all rendered in a single, real-time dashboard.",
    highlights: ["Live stat cards", "Category distribution", "Booking timeline", "Quick-action panel"],
    accent: "from-cyan-500 to-blue-600",
    accentSoft: "from-cyan-500/12 to-blue-600/12",
  },
  {
    icon: CalendarClock,
    title: "Conflict-Safe Reservations",
    description:
      "An approval-driven booking lifecycle with built-in overlap detection, time-slot validation, and DB-level exclusion constraints — eliminating double bookings entirely.",
    highlights: ["Overlap prevention", "Time-slot validation", "Approval pipeline", "DB-level constraints"],
    accent: "from-violet-500 to-purple-600",
    accentSoft: "from-violet-500/12 to-purple-600/12",
  },
];

/* ── Core features (3-col grid) ───────────────────────── */
const coreFeatures = [
  {
    icon: Wrench,
    title: "Ticket Execution Flow",
    description: "Create, assign, and resolve maintenance incidents with transparent ownership, priority levels, and real-time status tracking.",
    accent: "from-orange-500 to-rose-500",
  },
  {
    icon: BellRing,
    title: "Smart Notifications",
    description: "Context-aware alerts for booking decisions, ticket updates, assignment changes, and operational events — never miss a beat.",
    accent: "from-sky-500 to-indigo-500",
  },
  {
    icon: UsersRound,
    title: "Role-Based Views",
    description: "Secure, role-aware interfaces for admins, faculty coordinators, technicians, and team leads with scoped permissions.",
    accent: "from-teal-500 to-emerald-500",
  },
  {
    icon: ShieldCheck,
    title: "OAuth 2.0 Security",
    description: "Authenticate via Google Sign-In with OIDC token verification and enforce endpoint-level authorization across every route.",
    accent: "from-emerald-500 to-cyan-500",
  },
  {
    icon: LineChart,
    title: "Operational Analytics",
    description: "Visualize resource category distribution, booking patterns, and utilization rates to make data-driven campus decisions.",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    icon: RefreshCcw,
    title: "Offline Resilience",
    description: "Graceful fallback to mock data when the backend is unreachable — the UI stays functional and responsive at all times.",
    accent: "from-amber-500 to-orange-500",
  },
];

/* ── Technical edge pills ─────────────────────────────── */
const techEdges = [
  { icon: Zap, label: "Spring Boot 3.3" },
  { icon: Globe, label: "React + Vite" },
  { icon: Layers3, label: "REST APIs" },
  { icon: Shield, label: "Spring Security" },
  { icon: Fingerprint, label: "Google OAuth" },
  { icon: Gauge, label: "PostgreSQL" },
  { icon: Smartphone, label: "Responsive UI" },
  { icon: GitMerge, label: "DTO Pattern" },
  { icon: Timer, label: "Pagination" },
];

/* ── Why UniFlow cards ────────────────────────────────── */
const whyCards = [
  {
    icon: Sparkles,
    title: "Production-Grade Architecture",
    description: "Layered backend with controllers, services, repositories, and DTOs — built for scale, not just demos.",
  },
  {
    icon: CheckCircle2,
    title: "Constraint-Level Validation",
    description: "Double validation — application-level checks before save, plus DB exclusion constraints for airtight integrity.",
  },
  {
    icon: Zap,
    title: "Zero-Config Dark Mode",
    description: "System-aware theme detection with seamless CSS variable switching — dark mode that actually looks good.",
  },
];

function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pb-20 pt-6">
      <div className="mx-auto max-w-6xl">
        {/* ── Hero Header ───────────────────────────────── */}
        <header className="animate-reveal mb-12 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
            Platform Features
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 md:text-5xl dark:text-white">
            Built to run campus operations without friction.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-blue-100/90">
            Every feature is engineered to reduce coordination overhead, prevent scheduling conflicts, and give campus teams real-time operational visibility.
          </p>
        </header>

        {/* ── Spotlight Features (2-col, large) ─────────── */}
        <section className="mb-10 grid gap-5 md:grid-cols-2">
          {spotlightFeatures.map((feat, index) => (
            <article
              key={feat.title}
              className="group animate-reveal relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)] dark:border-white/12 dark:bg-white/[0.06] dark:shadow-none dark:hover:border-white/20"
              style={{ animationDelay: `${80 + index * 100}ms` }}
            >
              {/* Gradient bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${feat.accent}`} />

              <div className="p-6">
                <span className={`inline-flex rounded-xl bg-gradient-to-br ${feat.accentSoft} p-3 text-slate-700 dark:text-white`}>
                  <feat.icon className="h-7 w-7" />
                </span>

                <h3 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-blue-100/80">{feat.description}</p>

                {/* Highlight pills */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {feat.highlights.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-blue-100/80"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* ── Core Features Grid (3-col) ────────────────── */}
        <section className="mb-14">
          <div className="animate-reveal mb-6" style={{ animationDelay: "200ms" }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
              Core Capabilities
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
              Six pillars powering campus operations.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {coreFeatures.map((feat, index) => (
              <article
                key={feat.title}
                className="group animate-reveal overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none dark:hover:border-white/18"
                style={{ animationDelay: `${250 + index * 70}ms` }}
              >
                {/* Thin gradient accent */}
                <div className={`h-0.5 w-full bg-gradient-to-r ${feat.accent}`} />

                <div className="p-5">
                  <span className="inline-flex rounded-xl bg-slate-100 p-2.5 text-slate-600 transition-colors group-hover:bg-cyan-100 group-hover:text-cyan-700 dark:bg-white/[0.08] dark:text-white dark:group-hover:bg-cyan-400/15 dark:group-hover:text-cyan-200">
                    <feat.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-blue-100/80">{feat.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Tech Stack Strip ──────────────────────────── */}
        <section className="animate-reveal mb-14" style={{ animationDelay: "400ms" }}>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-[0_8px_20px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-blue-100/50">
              Technology Stack
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {techEdges.map((edge) => (
                <div
                  key={edge.label}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-blue-100/80 dark:hover:border-cyan-400/30 dark:hover:text-cyan-200"
                >
                  <edge.icon className="h-4 w-4" />
                  {edge.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why UniFlow Section ───────────────────────── */}
        <section className="animate-reveal mb-12" style={{ animationDelay: "480ms" }}>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
              Why UniFlow
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
              Not just functional — engineered right.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {whyCards.map((card, index) => (
              <div
                key={card.title}
                className="animate-reveal rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/50 p-5 dark:border-white/10 dark:from-[color:var(--navy-mid)]/40 dark:to-[color:var(--navy-deep)]/40"
                style={{ animationDelay: `${520 + index * 80}ms` }}
              >
                <span className="inline-flex rounded-xl bg-cyan-100 p-2.5 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200">
                  <card.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-blue-100/80">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────── */}
        <section className="animate-reveal" style={{ animationDelay: "600ms" }}>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-white/12 dark:from-[color:var(--navy-mid)] dark:to-[color:var(--navy-deep)] dark:shadow-none md:flex md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
                Ready to explore?
              </p>
              <p className="mt-2 max-w-lg text-base font-semibold text-slate-800 dark:text-white/90">
                See how each module works together — from resource registration to booking resolution.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate("/modules")}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--brand)] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 dark:bg-cyan-500 dark:text-[color:var(--navy-deep)]"
              >
                View All Modules
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default FeaturesPage;
