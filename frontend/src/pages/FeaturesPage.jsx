import { BellRing, CalendarClock, LayoutDashboard, ShieldCheck, UsersRound, Wrench } from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Unified Command Center",
    description: "Track resource usage, team workload, and real-time operational signals in one dashboard.",
  },
  {
    icon: CalendarClock,
    title: "Conflict-Safe Reservations",
    description: "Approval-driven booking lifecycle with built-in overlap prevention and timeline controls.",
  },
  {
    icon: Wrench,
    title: "Ticket Execution Flow",
    description: "Create, assign, and resolve maintenance incidents with transparent ownership and status tracking.",
  },
  {
    icon: BellRing,
    title: "Notification Stream",
    description: "Get operational updates for assignment changes, booking decisions, and incident progress.",
  },
  {
    icon: UsersRound,
    title: "Role-Based Access",
    description: "Secure role-aware views for admins, faculty coordinators, technicians, and team leads.",
  },
  {
    icon: ShieldCheck,
    title: "Google Sign-In Security",
    description: "Authenticate users via OAuth and enforce endpoint/route protection across the platform.",
  },
];

function FeaturesPage() {
  return (
    <div className="relative overflow-hidden px-4 pb-16 pt-6">
      <div className="pointer-events-none absolute -left-28 top-8 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-28 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="mx-auto max-w-6xl">
        <header className="animate-reveal relative mb-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-[0_18px_34px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8 dark:border-white/15 dark:bg-white/10 dark:shadow-none">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Features</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 md:text-5xl dark:text-white">
              Built to run campus operations without friction.
            </h1>
            <p className="mt-4 text-base text-slate-600 md:text-lg dark:text-blue-100/90">
              Every feature is designed to reduce coordination overhead and improve operational response across teams.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-800/70 dark:bg-cyan-900/30 dark:text-cyan-200">
                Real-time awareness
              </span>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-900/30 dark:text-indigo-200">
                Role-based workflows
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-900/30 dark:text-emerald-200">
                Secure by default
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((item, index) => (
            <article
              key={item.title}
              className="surface-card animate-reveal group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(15,23,42,0.12)] dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-none"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="inline-flex rounded-xl bg-cyan-100 p-2 text-cyan-700 transition group-hover:scale-110 dark:bg-cyan-300/18 dark:text-cyan-100">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-xl font-bold leading-snug text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-blue-100/85">{item.description}</p>
              <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-500/60 to-blue-500/50 transition group-hover:w-20" />
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default FeaturesPage;
