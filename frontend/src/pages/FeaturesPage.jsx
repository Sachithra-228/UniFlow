import { BellRing, CalendarClock, ChevronLeft, ChevronRight, LayoutDashboard, ShieldCheck, UsersRound, Wrench } from "lucide-react";
import { useState } from "react";

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

const heroGallery = [
  { src: "/pic1.png", alt: "Campus operations control dashboard" },
  { src: "/pic2.png", alt: "Smart campus booking workflow" },
  { src: "/pic3.png", alt: "Team coordination for facilities" },
  { src: "/pic4.png", alt: "Maintenance and service tracking" },
  { src: "/pic5.png", alt: "Resource planning and analytics" },
];

function FeaturesPage() {
  const [activeImage, setActiveImage] = useState(0);

  const showPrev = () => {
    setActiveImage((prev) => (prev - 1 + heroGallery.length) % heroGallery.length);
  };

  const showNext = () => {
    setActiveImage((prev) => (prev + 1) % heroGallery.length);
  };

  return (
    <div className="px-4 pb-16 pt-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-white/15 dark:bg-slate-950 md:p-8">
          <div className="public-grid-bg pointer-events-none absolute inset-0 opacity-70" />

          <div className="relative">
            <article className="animate-reveal overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-slate-900 dark:shadow-none">
              <img
                key={heroGallery[activeImage].src}
                src={heroGallery[activeImage].src}
                alt={heroGallery[activeImage].alt}
                loading="lazy"
                decoding="async"
                className="aspect-[16/8] w-full object-cover"
              />
            </article>

            <button
              type="button"
              aria-label="Previous image"
              onClick={showPrev}
              className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow transition hover:bg-white dark:border-white/20 dark:bg-black/60 dark:text-white dark:hover:bg-black/75"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={showNext}
              className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow transition hover:bg-white dark:border-white/20 dark:bg-black/60 dark:text-white dark:hover:bg-black/75"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-2">
              {heroGallery.map((item, index) => (
                <button
                  key={item.src}
                  type="button"
                  aria-label={`Go to image ${index + 1}`}
                  onClick={() => setActiveImage(index)}
                  className={[
                    "h-2.5 rounded-full transition",
                    activeImage === index ? "w-8 bg-cyan-600 dark:bg-cyan-300" : "w-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-white/30 dark:hover:bg-white/50",
                  ].join(" ")}
                >
                  <span className="sr-only">{item.alt}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((item, index) => (
            <article
              key={item.title}
              className="surface-card animate-reveal rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-none"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="inline-flex rounded-xl bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-300/18 dark:text-cyan-100">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-blue-100/85">{item.description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default FeaturesPage;
