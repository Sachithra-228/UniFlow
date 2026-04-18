import { Copy, KeyRound, Mail, Pencil, RefreshCw, ShieldCheck, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchProfile, getGoogleLoginUrl, updateProfile } from "../api/campusApi";
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
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadProfile(showLoader = true) {
      if (showLoader) {
        setLoading(true);
      }
      setNeedsAuth(false);
      try {
        const response = await fetchProfile();
        setProfile(response.data);
        setNameDraft(response.data?.name ?? "");
        setEditingName(false);
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
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    loadProfile();
  }, [addToast]);

  async function handleRefreshProfile() {
    setRefreshingProfile(true);
    try {
      const response = await fetchProfile();
      setProfile(response.data);
      setNameDraft(response.data?.name ?? "");
      setEditingName(false);
      setIsFallback(response.isFallback);
      addToast({ type: "info", title: "Profile refreshed", message: "Latest profile details loaded." });
    } catch (error) {
      addToast({
        type: "error",
        title: "Refresh failed",
        message: error?.response?.data?.message || "Could not refresh profile.",
      });
    } finally {
      setRefreshingProfile(false);
    }
  }

  async function handleSaveName() {
    const normalized = nameDraft.trim();
    if (normalized.length < 2 || normalized.length > 80) {
      addToast({
        type: "error",
        title: "Invalid name",
        message: "Name must be between 2 and 80 characters.",
      });
      return;
    }

    setSavingProfile(true);
    try {
      const response = await updateProfile({ name: normalized });
      setProfile(response.data);
      setNameDraft(response.data?.name ?? normalized);
      setEditingName(false);
      addToast({ type: "success", title: "Profile updated", message: "Display name updated successfully." });
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        message: error?.response?.data?.message || "Could not update your profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCopyProviderId() {
    if (!profile?.providerId) return;
    try {
      await navigator.clipboard.writeText(String(profile.providerId));
      addToast({ type: "success", title: "Copied", message: "Provider ID copied to clipboard." });
    } catch {
      addToast({ type: "error", title: "Copy failed", message: "Could not copy provider ID." });
    }
  }

  if (loading) {
    return (
      <Card className="max-w-4xl p-6 md:p-8">
        <div className="space-y-5">
          <LoadingSkeleton className="h-8 w-64 rounded-xl" />
          <LoadingSkeleton className="h-20 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (needsAuth) {
    return (
      <Card className="max-w-4xl p-6 md:p-8">
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
    <Card className="relative max-w-4xl overflow-hidden border-[color:var(--border)] p-6 md:p-8">
      <div className="pointer-events-none absolute -left-24 top-20 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[color:var(--brand)]/12 blur-3xl" />

      <div className="relative space-y-6">
        <div className="rounded-2xl border border-[color:var(--border)] bg-gradient-to-r from-[color:var(--brand-soft)]/50 via-white/80 to-transparent p-5 dark:from-[color:var(--brand-soft)]/20 dark:via-[color:var(--bg-soft)]/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
            <span className="rounded-2xl bg-[color:var(--brand-soft)] p-4 shadow-sm">
              <UserCircle2 className="h-9 w-9 text-[color:var(--brand)]" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Authenticated Identity</p>
              {editingName ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    maxLength={80}
                    className="h-10 w-[min(360px,80vw)] rounded-xl border border-[color:var(--border)] bg-white/85 px-3 text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 dark:bg-[color:var(--bg-soft)]/85"
                  />
                  <Button size="sm" onClick={handleSaveName} loading={savingProfile}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingName(false);
                      setNameDraft(profile?.name ?? "");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <h3 className="mt-1 text-2xl font-bold md:text-4xl">{profile?.name}</h3>
              )}
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">Identity and access details linked via your login provider</p>
            </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditingName(true)} disabled={editingName || isFallback}>
                <Pencil className="h-4 w-4" />
                Edit name
              </Button>
              <Button size="sm" variant="secondary" onClick={handleRefreshProfile} loading={refreshingProfile}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCopyProviderId}>
                <Copy className="h-4 w-4" />
                Copy ID
              </Button>
            </div>
          </div>

          {isFallback ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-100/70 px-3 py-2 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-900/35 dark:text-amber-100">
              Showing fallback profile data because backend profile service is unavailable.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ProfileField icon={Mail} label="Email" value={profile?.email} helper="Primary identity email" />
          <ProfileField icon={ShieldCheck} label="Role" value={<Badge value={profile?.role} />} helper="Access level for this workspace" />
          <ProfileField icon={ShieldCheck} label="Provider" value={<Badge value={profile?.provider} />} helper="Authentication provider" />
          <ProfileField icon={KeyRound} label="Provider ID" value={profile?.providerId} helper="Unique provider identifier" mono />
        </div>
      </div>
    </Card>
  );
}

function ProfileField({ icon: Icon, label, value, helper, mono = false }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 px-4 py-3 shadow-sm transition hover:shadow-md dark:bg-[color:var(--bg-soft)]/80">
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className={`text-sm font-semibold ${mono ? "font-mono break-all" : ""}`}>{value}</div>
      {helper ? <p className="mt-1 text-xs text-[color:var(--text-muted)]">{helper}</p> : null}
    </div>
  );
}

export default ProfilePage;
