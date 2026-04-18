import { KeyRound, LogOut, Mail, ShieldCheck, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchProfile, getGoogleLoginUrl, getLogoutUrl } from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setNeedsAuth(false);
      try {
        const response = await fetchProfile();
        setProfile(response.data);
        setIsFallback(response.isFallback);
      } catch (error) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          setNeedsAuth(true);
          return;
        }

        addToast({
          type: "error",
          title: "Profile unavailable",
          message: "Could not retrieve OAuth profile details.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [addToast]);

  function handleLogout() {
    window.location.href = getLogoutUrl();
  }

  if (loading) {
    return (
      <Card className="max-w-3xl p-6">
        <div className="space-y-4">
          <LoadingSkeleton className="h-8 w-56 rounded-xl" />
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-12 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (needsAuth) {
    return (
      <Card className="max-w-3xl p-6">
        <EmptyState
          title="Login required for profile access"
          description="Authenticate via Google OAuth to view and sync your account with Smart Campus Operations Hub."
          action={
            <Button onClick={() => (window.location.href = getGoogleLoginUrl())}>
              <ShieldCheck className="h-4 w-4" />
              Continue with Google
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="relative max-w-3xl overflow-hidden p-6 md:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-4">
          <span className="rounded-2xl bg-[color:var(--brand-soft)] p-4">
            <UserCircle2 className="h-8 w-8 text-[color:var(--brand)]" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Authenticated Identity</p>
            <h3 className="mt-1 text-2xl font-bold">{profile?.name}</h3>
          </div>
        </div>

        {isFallback ? (
          <p className="mt-4 rounded-xl bg-amber-100/70 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/35 dark:text-amber-100">
            Showing fallback profile data because backend profile service is unavailable.
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ProfileField icon={Mail} label="Email" value={profile?.email} />
          <ProfileField icon={ShieldCheck} label="Role" value={<Badge value={profile?.role} />} />
          <ProfileField icon={ShieldCheck} label="Provider" value={<Badge value={profile?.provider} />} />
          <ProfileField icon={KeyRound} label="Provider ID" value={profile?.providerId} />
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ProfileField({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white/70 px-4 py-3 dark:bg-[color:var(--bg-soft)]/80">
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export default ProfilePage;
