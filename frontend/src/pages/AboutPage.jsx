import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Code2,
  Eye,
  Globe,
  GraduationCap,
  Heart,
  Layers3,
  Lightbulb,
  Rocket,
  Shield,
  Target,
  Users2,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const principles = [
  {
    icon: Eye,
    title: "Real-Time Visibility",
    description: "Always know what's booked, active, delayed, or blocked across every campus zone.",
  },
  {
    icon: Shield,
    title: "Conflict-Safe Scheduling",
    description: "Overlap detection and DB-level constraints ensure zero double bookings — ever.",
  },
  {
    icon: Lightbulb,
    title: "Actionable Insights",
    description: "Category distributions, utilization trends, and KPIs that drive faster decisions.",
  },
  {
    icon: Target,
    title: "Clear Ownership",
    description: "Every ticket, booking, and request has a traceable owner and audit trail.",
  },
];

const techHighlights = [
  {
    icon: Code2,
    title: "Spring Boot 3.3 + React",
    description: "Production-grade backend with a lightning-fast Vite-powered frontend.",
  },
  {
    icon: Layers3,
    title: "Layered Architecture",
    description: "Controllers → Services → Repositories → DTOs — properly separated concerns.",
  },
  {
    icon: Shield,
    title: "OAuth 2.0 Security",
    description: "Google Sign-In with OIDC tokens and role-based route/endpoint protection.",
  },
  {
    icon: Zap,
    title: "Offline Resilience",
    description: "Graceful fallback to mock data when the backend is unavailable.",
  },
];

const timeline = [
  { phase: "Phase 1", title: "Foundation", description: "Auth, user management, core resource CRUD", status: "complete" },
  { phase: "Phase 2", title: "Booking Engine", description: "Conflict-safe reservations with approval flows", status: "complete" },
  { phase: "Phase 3", title: "Analytics & Insights", description: "Dashboard KPIs, category analytics, utilization", status: "complete" },
  { phase: "Phase 4", title: "Tickets & Notifications", description: "Maintenance workflows and real-time alerts", status: "upcoming" },
];

const teamValues = [
  { icon: Rocket, label: "Ship Fast" },
  { icon: Heart, label: "User First" },
  { icon: BookOpenCheck, label: "Documentation" },
  { icon: GraduationCap, label: "Continuous Learning" },
  { icon: Users2, label: "Collaboration" },
  { icon: Globe, label: "Accessibility" },
];

function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pb-20 pt-6">
      <div className="mx-auto max-w-6xl">
        {/* ── Hero Section ──────────────────────────────── */}
        <header className="animate-reveal mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
            About UniFlow
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-slate-900 md:text-5xl dark:text-white">
            Built for operational clarity. Designed for campus teams.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-blue-100/90">
            UniFlow is a full-stack Smart Campus Operations Hub that helps universities coordinate people, spaces, and
            support workflows through one reliable, real-time platform.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-blue-100/70">
            The system unifies resource inventory, booking governance, maintenance execution, and notification pipelines
            — all guarded by role-aware access controls and Google OAuth security.
          </p>
        </header>

        {/* ── Mission Statement ─────────────────────────── */}
        <section className="animate-reveal mb-12" style={{ animationDelay: "80ms" }}>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-blue-50/60 to-cyan-50/40 p-7 shadow-[0_12px_28px_rgba(15,23,42,0.06)] dark:border-white/12 dark:from-[color:var(--navy-mid)] dark:via-[color:var(--navy-deep)] dark:to-[color:var(--navy-mid)] dark:shadow-none md:p-8">
            {/* Decorative gradient orb */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 blur-3xl dark:from-cyan-400/10 dark:to-blue-600/10" />

            <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
                  Our Mission
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                  Eliminate coordination overhead in campus operations.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-blue-100/80">
                  We believe campus teams shouldn't waste time on scheduling conflicts, lost tickets, or scattered
                  spreadsheets. UniFlow replaces fragmented workflows with a single source of truth.
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-5 text-center dark:border-white/10 dark:bg-white/[0.06]">
                <span className="text-4xl font-extrabold text-[color:var(--brand)] dark:text-cyan-300">100%</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-blue-100/60">
                  Open Source
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Core Principles ──────────────────────────── */}
        <section className="mb-12">
          <div className="animate-reveal mb-6" style={{ animationDelay: "140ms" }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
              Core Principles
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
              What drives every design decision.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {principles.map((item, index) => (
              <article
                key={item.title}
                className="group animate-reveal overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none dark:hover:border-white/18"
                style={{ animationDelay: `${180 + index * 70}ms` }}
              >
                <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 to-blue-600" />
                <div className="p-5">
                  <span className="inline-flex rounded-xl bg-cyan-100 p-2.5 text-cyan-700 transition-colors group-hover:bg-cyan-200 dark:bg-cyan-400/15 dark:text-cyan-200 dark:group-hover:bg-cyan-400/25">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-blue-100/80">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Technical Architecture ───────────────────── */}
        <section className="mb-12">
          <div className="animate-reveal mb-6" style={{ animationDelay: "350ms" }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
              Under the Hood
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
              Production-grade engineering, not just a prototype.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {techHighlights.map((item, index) => (
              <div
                key={item.title}
                className="animate-reveal flex items-start gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]"
                style={{ animationDelay: `${400 + index * 70}ms` }}
              >
                <span className="shrink-0 rounded-xl bg-gradient-to-br from-slate-100 to-blue-100/60 p-3 text-slate-700 dark:from-white/[0.08] dark:to-white/[0.04] dark:text-white">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-blue-100/80">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Development Roadmap ──────────────────────── */}
        <section className="mb-12">
          <div className="animate-reveal mb-6" style={{ animationDelay: "500ms" }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
              Roadmap
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
              Where we are and where we're headed.
            </h2>
          </div>

          <div className="animate-reveal rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6" style={{ animationDelay: "540ms" }}>
            <div className="space-y-0">
              {timeline.map((item, index) => {
                const isComplete = item.status === "complete";
                const isLast = index === timeline.length - 1;

                return (
                  <div key={item.phase} className="flex gap-4">
                    {/* Timeline rail */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isComplete
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                            : "border-2 border-dashed border-slate-300 text-slate-400 dark:border-white/20 dark:text-white/40"
                        }`}
                      >
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 ${
                            isComplete
                              ? "bg-emerald-200 dark:bg-emerald-400/25"
                              : "border-l-2 border-dashed border-slate-200 dark:border-white/10"
                          }`}
                          style={{ minHeight: "2rem" }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isComplete
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
                          }`}
                        >
                          {item.phase}
                        </span>
                        {!isComplete && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                            Upcoming
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 font-bold text-slate-900 dark:text-white">{item.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-blue-100/75">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Team Values Strip ────────────────────────── */}
        <section className="animate-reveal mb-12" style={{ animationDelay: "600ms" }}>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-[0_8px_20px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-blue-100/50">
              What We Value
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {teamValues.map((val) => (
                <div
                  key={val.label}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-blue-100/80 dark:hover:border-cyan-400/30 dark:hover:text-cyan-200"
                >
                  <val.icon className="h-4 w-4" />
                  {val.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────── */}
        <section className="animate-reveal" style={{ animationDelay: "680ms" }}>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-white/12 dark:from-[color:var(--navy-mid)] dark:to-[color:var(--navy-deep)] dark:shadow-none md:flex md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
                Want to see it in action?
              </p>
              <p className="mt-2 max-w-lg text-base font-semibold text-slate-800 dark:text-white/90">
                Explore the live dashboard, manage resources, and experience conflict-safe booking firsthand.
              </p>
            </div>
            <div className="mt-4 flex gap-3 md:mt-0">
              <button
                onClick={() => navigate("/features")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
              >
                View Features
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--brand)] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 dark:bg-cyan-500 dark:text-[color:var(--navy-deep)]"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
