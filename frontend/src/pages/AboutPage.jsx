function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 px-4 pb-16 pt-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-6xl gap-8 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-card animate-reveal group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_20px_35px_rgba(15,23,42,0.12)] dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-none">
          {/* Colorful decorative accents */}
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl" />
          
          <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">About</p>
          <h1 className="relative mt-3 text-4xl font-bold text-slate-900 md:text-5xl dark:text-white">Campus Pulse is built for operational clarity.</h1>
          <p className="relative mt-5 text-slate-600 dark:text-blue-100/90">
            Smart Campus helps universities coordinate people, spaces, and support workflows through one reliable platform.
          </p>
          <p className="relative mt-3 text-slate-600 dark:text-blue-100/85">
            The system combines resource inventory, booking governance, maintenance execution, and notification pipelines with role-aware
            access controls.
          </p>
          
          {/* Colorful feature tags */}
          <div className="relative mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200">Real-time</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-500/20 dark:text-blue-200">Scalable</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">Secure</span>
          </div>
        </section>

        <section
          className="surface-card animate-reveal group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_20px_35px_rgba(15,23,42,0.12)] dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-none"
          style={{ animationDelay: "120ms" }}
        >
          {/* Colorful decorative accents */}
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-300/20 to-blue-400/20 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-cyan-200/10 blur-2xl" />
          
          <h2 className="relative text-xl font-bold text-slate-900 dark:text-white">Core Principles</h2>
          <ul className="relative mt-4 space-y-3 text-sm text-slate-600 dark:text-blue-100/88">
            <li className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-50/30 dark:border-white/15 dark:bg-white/10 dark:hover:border-cyan-400/50 dark:hover:bg-cyan-500/10">
              <span className="text-cyan-600 dark:text-cyan-400">●</span>
              Real-time visibility over campus operations.
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-50/30 dark:border-white/15 dark:bg-white/10 dark:hover:border-cyan-400/50 dark:hover:bg-cyan-500/10">
              <span className="text-cyan-600 dark:text-cyan-400">●</span>
              Reliable approvals and conflict-safe scheduling.
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-50/30 dark:border-white/15 dark:bg-white/10 dark:hover:border-cyan-400/50 dark:hover:bg-cyan-500/10">
              <span className="text-cyan-600 dark:text-cyan-400">●</span>
              Actionable insights for faster decision-making.
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-50/30 dark:border-white/15 dark:bg-white/10 dark:hover:border-cyan-400/50 dark:hover:bg-cyan-500/10">
              <span className="text-cyan-600 dark:text-cyan-400">●</span>
              Clear ownership for every incident and request.
            </li>
          </ul>
          
          {/* Colorful stats row */}
          <div className="relative mt-6 grid grid-cols-3 gap-2 border-t border-slate-200 pt-5 dark:border-white/10">
            <div className="rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 p-2 text-center dark:from-cyan-500/10 dark:to-blue-500/10">
              <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">24/7</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Support</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 p-2 text-center dark:from-cyan-500/10 dark:to-blue-500/10">
              <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">99.9%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Uptime</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 p-2 text-center dark:from-cyan-500/10 dark:to-blue-500/10">
              <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">10k+</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Users</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;