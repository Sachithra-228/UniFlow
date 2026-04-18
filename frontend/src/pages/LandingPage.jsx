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

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com", type: "facebook" },
  { label: "Instagram", href: "https://www.instagram.com", type: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com", type: "youtube" },
  { label: "LinkedIn", href: "https://www.linkedin.com", type: "linkedin" },
];

function SocialMediaIcon({ type }) {
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13.5 21v-7h2.6l.4-3h-3V9.1c0-.9.3-1.6 1.7-1.6h1.4V4.8c-.2 0-1.1-.1-2.2-.1-2.4 0-4 1.5-4 4.3V11H8v3h2.4v7h3.1Z"
        />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (type === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path fill="currentColor" d="M10 9.2v5.6l5-2.8-5-2.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="9" r="1.2" fill="currentColor" />
      <rect x="7" y="11" width="2" height="6" fill="currentColor" />
      <path fill="currentColor" d="M11 11h2v.8c.4-.6 1.2-1 2.2-1 1.9 0 2.8 1.2 2.8 3.2V17h-2v-2.8c0-1.1-.4-1.7-1.3-1.7s-1.7.6-1.7 1.9V17h-2v-6Z" />
    </svg>
  );
}

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <section className="relative -mt-28 overflow-hidden border-b border-slate-200/80 pt-28 dark:border-white/10">
        <div className="public-grid-bg pointer-events-none absolute inset-0 opacity-70" />

        <div className="relative mx-auto flex min-h-[88vh] w-full max-w-6xl items-center px-4">
          <div className="grid w-full gap-10 py-8 lg:grid-cols-[1.15fr_0.85fr]">
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
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-28 border-b border-slate-300/35 bg-[color:var(--navy-mid)] px-4 py-16 dark:border-white/10 dark:bg-black"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-2xl animate-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Platform Features</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Modern tools for every operations team.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((card, index) => (
              <article
                key={card.title}
                className="animate-reveal rounded-2xl border border-white/30 bg-white/95 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.2)] transition hover:-translate-y-1 hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-cyan-300/55"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-500/25 dark:text-cyan-100">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{card.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">{card.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-28 border-b border-slate-200 bg-white px-4 py-16 dark:border-white/10 dark:bg-[#090909]">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-[#141414] dark:shadow-none md:p-8">
          <div className="mb-8 animate-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Workflow</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">From request to resolution, everything stays synchronized.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((item, index) => (
              <article
                key={item.title}
                className="animate-reveal rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-600 dark:bg-[#1c1c1c]"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <item.icon className="h-6 w-6 text-cyan-700 dark:text-cyan-200" />
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-200">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 border-t border-slate-200 pt-6 text-sm text-slate-600 dark:border-white/10 dark:text-blue-100/80 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-white">Smart Campus</p>
            <p className="mt-1">Unified platform for booking, maintenance, and campus operations.</p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <a href="#features" className="font-semibold text-slate-700 hover:text-cyan-700 dark:text-blue-100 dark:hover:text-cyan-200">
              Features
            </a>
            <a href="#workflow" className="font-semibold text-slate-700 hover:text-cyan-700 dark:text-blue-100 dark:hover:text-cyan-200">
              Workflow
            </a>
            <button
              type="button"
              className="font-semibold text-slate-700 hover:text-cyan-700 dark:text-blue-100 dark:hover:text-cyan-200"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>

          <div className="flex items-center gap-2">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700 dark:border-white/20 dark:text-blue-100 dark:hover:border-cyan-300 dark:hover:text-cyan-200"
              >
                <SocialMediaIcon type={item.type} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
