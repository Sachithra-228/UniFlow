import { Mail, MapPin, Phone } from "lucide-react";

function ContactPage() {
  return (
    <div className="px-4 pb-16 pt-6">
      <div className="mx-auto max-w-6xl">
        <header className="animate-reveal mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Contact</p>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">Let’s plan your campus operations rollout.</h1>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="surface-card animate-reveal rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white">Reach out</h2>
            <div className="mt-5 grid gap-3 text-sm text-blue-100/90">
              <p className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2"><Mail className="h-4 w-4" /> ops@smartcampus.io</p>
              <p className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2"><Phone className="h-4 w-4" /> +94 11 234 5678</p>
              <p className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2"><MapPin className="h-4 w-4" /> Colombo, Sri Lanka</p>
            </div>
          </section>

          <section className="surface-card animate-reveal rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur-md" style={{ animationDelay: "120ms" }}>
            <h2 className="text-xl font-bold text-white">Implementation Focus</h2>
            <ul className="mt-4 space-y-3 text-sm text-blue-100/90">
              <li className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Resource data migration and setup</li>
              <li className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Role and permission policy mapping</li>
              <li className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Booking approval lifecycle training</li>
              <li className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Ticket and notification process onboarding</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;

