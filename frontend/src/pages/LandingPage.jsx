import {
  BellRing,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getGoogleLoginUrl } from "../api/campusApi";
import Button from "../components/common/Button";
import GoogleLogo from "../components/public/GoogleLogo";

const keyMetrics = [
  { value: "99.9%", label: "Platform Uptime" },
  { value: "12k+", label: "Bookings Tracked" },
  { value: "320+", label: "Campus Resources" },
];

const featureCards = [
  {
    icon: LayoutDashboard,
    title: "Live Operations View",
    description: "Monitor what is booked, active, delayed, or blocked from one command center.",
  },
  {
    icon: CalendarClock,
    title: "Conflict-Safe Booking",
    description: "Built-in safeguards prevent double booking and keep approvals clean.",
  },
  {
    icon: BellRing,
    title: "Operational Alerts",
    description: "Instant updates for decisions, ticket activity, and critical status changes.",
  },
  {
    icon: Wrench,
    title: "Maintenance Workflow",
    description: "Track tickets from report to closure with assignment and SLA visibility.",
  },
];

const workflow = [
  {
    icon: BookOpenCheck,
    title: "1. Register & Structure",
    description: "Create spaces, labs, and equipment with capacity, location, and availability windows.",
  },
  {
    icon: Clock3,
    title: "2. Orchestrate Requests",
    description: "Receive booking and maintenance requests with role-based review and action.",
  },
  {
    icon: CheckCircle2,
    title: "3. Execute with Confidence",
    description: "Act on real-time insights and keep campus operations consistent across teams.",
  },
];

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-14">
      <section className="relative mx-auto flex min-h-[88vh] w-full max-w-6xl items-center px-4">
        <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-reveal space-y-6">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-900 md:text-6xl dark:text-white">
              One platform for smarter campus coordination.
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-slate-700 md:text-xl dark:text-blue-100/90">
              Track resources, handle bookings, and empower teams with real-time operational control.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="animate-glow" onClick={() => (window.location.href = getGoogleLoginUrl())}>
                <GoogleLogo className="h-4 w-4" />
                Sign in with Google
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-slate-300 bg-white text-[color:var(--text)] hover:bg-slate-100 dark:border-white/45 dark:bg-white/90 dark:text-[color:var(--brand)] dark:hover:bg-white"
                onClick={() => navigate("/login")}
              >
                Sign in with Email
              </Button>
            </div>

            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {keyMetrics.map((item, index) => (
                <article
                  key={item.label}
                  className="animate-reveal rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:border-white/20 dark:bg-white/10 dark:shadow-none"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-blue-100/80">{item.label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="self-end lg:self-center">
            <div className="animate-float rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.12)] dark:border-white/25 dark:bg-white/10 dark:backdrop-blur-xl dark:shadow-none">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Today in Campus Pulse</h3>
              <div className="mt-4 grid gap-3">
                {[
                  "24 bookings approved across faculty zones",
                  "7 active maintenance tickets under review",
                  "95% resource readiness for tomorrow",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-blue-50/95"
                  >
                    <span className="font-semibold text-cyan-600 dark:text-cyan-200">0{index + 1}.</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-2xl animate-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Platform Features</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">Modern tools for every operations team.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((card, index) => (
              <article
                key={card.title}
                className="surface-card animate-reveal rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-cyan-300 dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-none dark:hover:border-cyan-200/45"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-300/18 dark:text-cyan-100">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{card.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-blue-100/85">{card.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-none md:p-8">
          <div className="mb-8 animate-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Workflow</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">From request to resolution, everything stays synchronized.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((item, index) => (
              <article
                key={item.title}
                className="animate-reveal rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/20 dark:bg-[color:var(--navy-mid)]/55"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <item.icon className="h-6 w-6 text-cyan-700 dark:text-cyan-200" />
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-blue-100/85">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 pt-16">
        <div className="mx-auto max-w-6xl animate-reveal rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 to-blue-100 p-7 shadow-[0_16px_34px_rgba(15,23,42,0.08)] dark:border-cyan-200/35 dark:bg-gradient-to-r dark:from-[color:var(--navy-mid)] dark:to-[color:var(--navy-deep)] dark:shadow-2xl md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-100">Ready to launch</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Bring your campus operations into one intelligent control center.</h2>
          </div>

          <div className="mt-5 md:mt-0">
            <Button
              size="lg"
              variant="secondary"
              className="border-slate-300 bg-white text-[color:var(--text)] hover:bg-slate-100 dark:border-white/40 dark:bg-white dark:text-[color:var(--brand)]"
              onClick={() => (window.location.href = getGoogleLoginUrl())}
            >
              <GoogleLogo className="h-4 w-4" />
              Start with Google
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
