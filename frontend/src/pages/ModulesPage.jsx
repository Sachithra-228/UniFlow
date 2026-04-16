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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Modules</p>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">Everything your operations team needs, split by responsibility.</h1>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((item, index) => (
            <article
              key={item.name}
              className="surface-card animate-reveal flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="rounded-xl bg-cyan-300/18 p-2 text-cyan-100">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">{item.name}</h3>
                <p className="mt-1 text-sm text-blue-100/85">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModulesPage;

