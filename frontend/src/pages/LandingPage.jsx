import {
  ArrowDown,
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
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
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Campus Operations Hub
            </p>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
              One platform for smarter campus coordination.
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-blue-100/90 md:text-xl">
              Track resources, handle bookings, and empower teams with real-time operational control.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="animate-glow"
                onClick={() => (window.location.href = getGoogleLoginUrl())}
              >
                <GoogleLogo className="h-4 w-4" />
                Sign in with Google
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-white/45 bg-white/90 text-[color:var(--brand)] hover:bg-white"
                onClick={() => navigate("/dashboard")}
              >
                Explore Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {keyMetrics.map((item, index) => (
                <article
                  key={item.label}
                  className="surface-card animate-reveal rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-blue-100/80">{item.label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="self-end lg:self-center">
            <div className="surface-card animate-float rounded-3xl border border-white/25 bg-white/10 p-5 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white">Today in Campus Pulse</h3>
              <div className="mt-4 grid gap-3">
                {[
                  "24 bookings approved across faculty zones",
                  "7 active maintenance tickets under review",
                  "95% resource readiness for tomorrow",
                ].map((item, index) => (
                  <div key={item} className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-blue-50/95">
                    <span className="font-semibold text-cyan-200">0{index + 1}.</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <a
          href="#features"
          className="group absolute bottom-8 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
        >
          Scroll Down
          <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" />
        </a>
      </section>

      <section id="features" className="scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-2xl animate-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Platform Features</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Modern tools for every operations team.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((card, index) => (
              <article
                key={card.title}
                className="surface-card animate-reveal rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md transition hover:-translate-y-1 hover:border-cyan-200/45"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-cyan-300/18 p-2 text-cyan-100">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-white">{card.title}</h3>
                    <p className="mt-1 text-sm text-blue-100/85">{card.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md md:p-8">
          <div className="mb-8 animate-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Workflow</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">From request to resolution, everything stays synchronized.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((item, index) => (
              <article
                key={item.title}
                className="animate-reveal rounded-2xl border border-white/20 bg-[color:var(--navy-mid)]/55 p-5"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <item.icon className="h-6 w-6 text-cyan-200" />
                <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/85">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 pt-16">
        <div className="mx-auto max-w-6xl animate-reveal rounded-3xl border border-cyan-200/35 bg-gradient-to-r from-[color:var(--navy-mid)] to-[color:var(--navy-deep)] p-7 shadow-2xl md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">Ready to launch</p>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Bring your campus operations into one intelligent control center.</h2>
          </div>

          <div className="mt-5 md:mt-0">
            <Button
              size="lg"
              variant="secondary"
              className="border-white/40 bg-white text-[color:var(--brand)] hover:bg-slate-100"
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

