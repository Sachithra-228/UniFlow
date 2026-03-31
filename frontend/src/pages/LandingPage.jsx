import { ArrowRight, Building2, CalendarClock, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { getGoogleLoginUrl } from "../api/campusApi";

const highlights = [
  { icon: Building2, title: "Resource Intelligence", description: "Centralized visibility into rooms, labs, and equipment." },
  { icon: CalendarClock, title: "Smart Booking Flow", description: "Conflict-safe reservation workflows with clear approval states." },
  { icon: UsersRound, title: "Unified People Data", description: "Role-aware user directory synced with identity provider data." },
];

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute -left-36 top-8 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="glass-card relative mx-auto grid w-full max-w-6xl gap-10 rounded-3xl p-6 md:p-10 lg:grid-cols-2 lg:p-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/45 bg-cyan-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.19em] text-cyan-900 dark:bg-cyan-900/45 dark:text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Campus Operations Hub
          </p>

          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
            University operations, reimagined for real-time campus control.
          </h1>
          <p className="mt-5 max-w-xl text-base text-[color:var(--text-muted)]">
            Track campus resources, orchestrate bookings, and manage users through a premium interface built for operations teams, faculty
            coordinators, and admin leadership.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => (window.location.href = getGoogleLoginUrl())}>
              <ShieldCheck className="h-4 w-4" />
              Sign in with Google
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/dashboard")}>
              Explore Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 self-center">
          {highlights.map((item, index) => (
            <article
              key={item.title}
              className="surface-card rounded-2xl border px-5 py-4 transition hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-[color:var(--brand-soft)] p-2">
                  <item.icon className="h-5 w-5 text-[color:var(--brand)]" />
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-[color:var(--text-muted)]">{item.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
