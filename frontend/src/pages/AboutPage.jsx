function AboutPage() {
  return (
    <div className="px-4 pb-16 pt-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-card animate-reveal rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">About</p>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">Campus Pulse is built for operational clarity.</h1>
          <p className="mt-5 text-blue-100/90">
            Smart Campus helps universities coordinate people, spaces, and support workflows through one reliable platform.
          </p>
          <p className="mt-3 text-blue-100/85">
            The system combines resource inventory, booking governance, maintenance execution, and notification pipelines with role-aware
            access controls.
          </p>
        </section>

        <section className="surface-card animate-reveal rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur-md" style={{ animationDelay: "120ms" }}>
          <h2 className="text-xl font-bold text-white">Core Principles</h2>
          <ul className="mt-4 space-y-3 text-sm text-blue-100/88">
            <li className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Real-time visibility over campus operations.</li>
            <li className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Reliable approvals and conflict-safe scheduling.</li>
            <li className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Actionable insights for faster decision-making.</li>
            <li className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Clear ownership for every incident and request.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;

