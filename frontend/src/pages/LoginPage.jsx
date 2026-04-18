import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getGoogleLoginUrl } from "../api/campusApi";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import GoogleLogo from "../components/public/GoogleLogo";

function LoginPage() {
  const [showEmailHelp, setShowEmailHelp] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-14 pt-6">
      <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-muted)] hover:text-[color:var(--text)]">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <Card className="rounded-3xl p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[color:var(--text-muted)]">Authentication</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Sign in to Smart Campus</h1>
        <p className="mt-3 text-sm text-[color:var(--text-muted)]">
          Choose your preferred access method. Admin-created accounts can use invite-based email onboarding.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={() => (window.location.href = getGoogleLoginUrl())}>
            <GoogleLogo className="h-4 w-4" />
            Sign in with Google
          </Button>

          <Button size="lg" variant="secondary" onClick={() => setShowEmailHelp((current) => !current)}>
            <Mail className="h-4 w-4" />
            Sign in with Email
          </Button>
        </div>

        {showEmailHelp ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 text-sm dark:bg-white/[0.05]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[color:var(--brand)]" />
              <div className="space-y-1.5 text-[color:var(--text-muted)]">
                <p className="font-semibold text-[color:var(--text)]">Email access is invite-based</p>
                <p>1. Ask an admin to create your account from the Users page.</p>
                <p>2. Open the activation email and set your password.</p>
                <p>3. Use the same invited email for future access and account linking.</p>
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default LoginPage;
