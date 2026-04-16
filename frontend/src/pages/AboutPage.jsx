function AboutPage() {
  return (
    <div className="px-4 pb-16 pt-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-card animate-reveal rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">About</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 md:text-5xl dark:text-white">Campus Pulse is built for operational clarity.</h1>
          <p className="mt-5 text-slate-600 dark:text-blue-100/90">
            Smart Campus helps universities coordinate people, spaces, and support workflows through one reliable platform.
          </p>
          <p className="mt-3 text-slate-600 dark:text-blue-100/85">
            The system combines resource inventory, booking governance, maintenance execution, and notification pipelines with role-aware
            access controls.
          </p>
        </section>

        <section
          className="surface-card animate-reveal rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md dark:shadow-none"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Core Principles</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-blue-100/88">
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/15 dark:bg-white/10">Real-time visibility over campus operations.</li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/15 dark:bg-white/10">Reliable approvals and conflict-safe scheduling.</li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/15 dark:bg-white/10">Actionable insights for faster decision-making.</li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/15 dark:bg-white/10">Clear ownership for every incident and request.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
