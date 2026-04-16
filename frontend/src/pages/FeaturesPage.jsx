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
    <div className="px-4 pb-16 pt-6">
      <div className="mx-auto max-w-6xl">
        <header className="animate-reveal mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Features</p>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">Built to run campus operations without friction.</h1>
          <p className="mt-4 text-base text-blue-100/90 md:text-lg">
            Every feature is designed to reduce coordination overhead and improve operational response across teams.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((item, index) => (
            <article
              key={item.title}
              className="surface-card animate-reveal rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="inline-flex rounded-xl bg-cyan-300/18 p-2 text-cyan-100">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-blue-100/85">{item.description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default FeaturesPage;

