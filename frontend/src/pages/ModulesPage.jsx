import { BellRing, CalendarClock, LayoutDashboard, ShieldCheck, UsersRound, Wrench } from "lucide-react";

const modules = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    detail: "Live KPIs, category snapshots, workload status, and quick operational actions.",
  },
  {
    icon: CalendarClock,
    name: "Resources & Bookings",
    detail: "Manage inventory, availability windows, request approvals, and booking history.",
  },
  {
    icon: Wrench,
    name: "Tickets",
    detail: "Issue lifecycle management with assignment, comments, and status controls.",
  },
  {
    icon: BellRing,
    name: "Notifications",
    detail: "Unread count, read-state management, and context-aware operational updates.",
  },
  {
    icon: UsersRound,
    name: "User Directory",
    detail: "Role-aware people data for admins, coordinators, and technical staff.",
  },
  {
    icon: ShieldCheck,
    name: "Identity & Access",
    detail: "Google OAuth login with protected routes and secure endpoint-level access.",
  },
];

function ModulesPage() {
  return (
    <div className="px-4 pb-16 pt-6">
      <div className="mx-auto max-w-6xl">
        <header className="animate-reveal mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Modules</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 md:text-5xl dark:text-white">Everything your operations team needs, split by responsibility.</h1>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((item, index) => (
            <article
              key={item.name}
              className="surface-card animate-reveal flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-none"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="rounded-xl bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-300/18 dark:text-cyan-100">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-blue-100/85">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModulesPage;
