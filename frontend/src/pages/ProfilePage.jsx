import { AlertTriangle, ArrowRight, Check, Clock3, KeyRound, Mail, PencilLine, ShieldCheck, UserCircle2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAdminLinkRequests,
  fetchAdminTickets,
  fetchBookings,
  fetchProfile,
  getGoogleLoginUrl,
  updateProfileName,
} from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";
import { formatDateTime } from "../utils/format";
import { normalizeRole } from "../utils/roles";

const ADMIN_TABS = [
  { key: "health", label: "Ops Health Score" },
  { key: "sla", label: "SLA Breach Predictor" },
  { key: "approvals", label: "Approval Inbox Ranking" },
];

const ACTIVE_TICKET_STATUSES = new Set(["OPEN", "IN_PROGRESS"]);

function getElapsedHours(timestamp) {
  if (!timestamp) return 0;
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, (Date.now() - time) / (1000 * 60 * 60));
}

function getHoursUntil(timestamp) {
  if (!timestamp) return Infinity;
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return Infinity;
  return (time - Date.now()) / (1000 * 60 * 60);
}

function computeOpsHealth(bookings, tickets, linkRequests) {
  const pendingBookings = bookings.filter((booking) => booking.status === "PENDING").length;
  const unresolvedTickets = tickets.filter((ticket) => ACTIVE_TICKET_STATUSES.has(ticket.status));
  const highPriorityOpen = unresolvedTickets.filter(
    (ticket) => ticket.priority === "CRITICAL" || ticket.priority === "HIGH"
  ).length;
  const unassignedOpen = unresolvedTickets.filter((ticket) => !ticket.assignedTechnicianId).length;
  const agingTickets = unresolvedTickets.filter((ticket) => getElapsedHours(ticket.createdAt) >= 48).length;
  const pendingLinkRequests = linkRequests.length;

  const rawPenalty =
    pendingBookings * 2 + pendingLinkRequests * 3 + highPriorityOpen * 5 + unassignedOpen * 3 + agingTickets * 2;
  const score = Math.max(0, 100 - Math.round(rawPenalty));

  let level = "Healthy";
  if (score < 85) level = "Stable";
  if (score < 70) level = "Watch";
  if (score < 50) level = "At Risk";

  return {
    score,
    level,
    breakdown: [
      { label: "Pending Bookings", value: pendingBookings },
      { label: "Pending Link Requests", value: pendingLinkRequests },
      { label: "High Priority Open Tickets", value: highPriorityOpen },
      { label: "Unassigned Open Tickets", value: unassignedOpen },
      { label: "Aging Tickets (48h+)", value: agingTickets },
    ],
  };
}

function computeSlaRisks(tickets) {
  const priorityWeight = {
    CRITICAL: 45,
    HIGH: 32,
    MEDIUM: 20,
    LOW: 12,
  };

  return tickets
    .filter((ticket) => ACTIVE_TICKET_STATUSES.has(ticket.status))
    .map((ticket) => {
      const ageHours = getElapsedHours(ticket.createdAt);
      const assigned = Boolean(ticket.assignedTechnicianId);
      const score = Math.min(
        100,
        Math.round(
          (priorityWeight[ticket.priority] ?? 12) +
            Math.min(30, (ageHours / 72) * 30) +
            (assigned ? 0 : 20) +
            (ticket.status === "OPEN" ? 8 : 0)
        )
      );

      const reasons = [];
      if ((ticket.priority === "CRITICAL" || ticket.priority === "HIGH") && score >= 40) reasons.push("high priority");
      if (!assigned) reasons.push("unassigned");
      if (ageHours >= 24) reasons.push("aging");
      if (ticket.status === "OPEN") reasons.push("not started");

      return {
        id: ticket.id,
        score,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        createdByName: ticket.createdByName,
        assignedTechnicianName: ticket.assignedTechnicianName,
        resourceName: ticket.resourceName,
        reasons: reasons.length ? reasons : ["monitor"],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function computeApprovalRanking(bookings, linkRequests) {
  const bookingItems = bookings
    .filter((booking) => booking.status === "PENDING")
    .map((booking) => {
      const waitHours = getElapsedHours(booking.createdAt);
      const startsInHours = getHoursUntil(booking.startTime);
      const urgency = startsInHours <= 24 ? 50 : startsInHours <= 72 ? 34 : startsInHours <= 168 ? 20 : 10;
      const score = Math.round(waitHours * 1.2 + urgency + 12);
      return {
        id: `booking-${booking.id}`,
        kind: "BOOKING",
        score,
        title: `Booking #${booking.id}`,
        subtitle: `${booking.userName} - ${booking.resourceName}`,
        meta: `Starts: ${formatDateTime(booking.startTime)}`,
        route: "/bookings?status=PENDING",
      };
    });

  const linkRequestItems = linkRequests.map((request) => {
    const waitHours = getElapsedHours(request.createdAt);
    const score = Math.round(waitHours * 1.4 + 25);
    return {
      id: `link-${request.id}`,
      kind: "LINK_REQUEST",
      score,
      title: `Link Request #${request.id}`,
      subtitle: request.requestedGoogleEmail,
      meta: `Requested: ${formatDateTime(request.createdAt)}`,
      route: "/admin/link-requests",
    };
  });

  return [...bookingItems, ...linkRequestItems].sort((a, b) => b.score - a.score).slice(0, 12);
}

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [adminTab, setAdminTab] = useState("health");
  const [adminInsightsLoading, setAdminInsightsLoading] = useState(false);
  const [opsHealth, setOpsHealth] = useState(null);
  const [slaRisks, setSlaRisks] = useState([]);
  const [approvalRanking, setApprovalRanking] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    let mounted = true;

    async function loadAdminInsights() {
      setAdminInsightsLoading(true);
      try {
        const [bookingsResult, ticketsResult, linkRequestsResult] = await Promise.allSettled([
          fetchBookings({ page: 0, size: 400 }),
          fetchAdminTickets({ page: 0, size: 400 }),
          fetchAdminLinkRequests("PENDING"),
        ]);

        if (!mounted) return;

        const bookings = bookingsResult.status === "fulfilled" ? bookingsResult.value.items : [];
        const tickets = ticketsResult.status === "fulfilled" ? ticketsResult.value.items : [];
        const linkRequests = linkRequestsResult.status === "fulfilled" ? linkRequestsResult.value.items : [];

        setOpsHealth(computeOpsHealth(bookings, tickets, linkRequests));
        setSlaRisks(computeSlaRisks(tickets));
        setApprovalRanking(computeApprovalRanking(bookings, linkRequests));

        const failures = [bookingsResult, ticketsResult, linkRequestsResult].filter((x) => x.status === "rejected").length;
        if (failures > 0) {
          addToast({
            type: "info",
            title: "Partial admin insights",
            message: "Some admin data sources were unavailable. Showing best available results.",
          });
        }
      } catch {
        if (!mounted) return;
        addToast({
          type: "error",
          title: "Admin insights unavailable",
          message: "Unable to load admin insights right now.",
        });
      } finally {
        if (mounted) setAdminInsightsLoading(false);
      }
    }

    async function loadProfile() {
      setLoading(true);
      setNeedsAuth(false);
      try {
        const response = await fetchProfile();
        if (!mounted) return;

        const resolvedProfile = response.data;
        setProfile(resolvedProfile);
        setEditedName(resolvedProfile?.name ?? "");
        setIsFallback(response.isFallback);

        if (normalizeRole(resolvedProfile?.role) === "ADMIN") {
          await loadAdminInsights();
        } else {
          setOpsHealth(null);
          setSlaRisks([]);
          setApprovalRanking([]);
        }
      } catch (error) {
        if (!mounted) return;

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
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [addToast]);

  const isAdmin = useMemo(() => normalizeRole(profile?.role) === "ADMIN", [profile]);

  async function handleSaveName() {
    const nextName = editedName.trim();
    if (!nextName) {
      addToast({
        type: "warning",
        title: "Name required",
        message: "Please enter your name before saving.",
      });
      return;
    }

    if (nextName.length > 120) {
      addToast({
        type: "warning",
        title: "Name too long",
        message: "Name must be 120 characters or fewer.",
      });
      return;
    }

    try {
      setIsSavingName(true);
      const response = await updateProfileName({ name: nextName });
      setProfile(response.data);
      setEditedName(response.data?.name ?? nextName);
      setIsEditingName(false);
      addToast({
        type: "success",
        title: "Profile updated",
        message: "Your display name was updated.",
      });
    } catch {
      addToast({
        type: "error",
        title: "Update failed",
        message: "Unable to update your name right now.",
      });
    } finally {
      setIsSavingName(false);
    }
  }

  function handleCancelNameEdit() {
    setEditedName(profile?.name ?? "");
    setIsEditingName(false);
  }

  if (loading) {
    return (
      <Card className="w-full p-6">
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
      <Card className="w-full p-6">
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
    <div className="space-y-6">
      <Card className="relative w-full overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-4">
            <span className="rounded-2xl bg-[color:var(--brand-soft)] p-4">
              <UserCircle2 className="h-8 w-8 text-[color:var(--brand)]" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Authenticated Identity</p>
              {isEditingName ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(event) => setEditedName(event.target.value)}
                    maxLength={120}
                    className="h-10 min-w-[240px] rounded-xl border border-[color:var(--border)] bg-white px-3 text-base font-semibold outline-none transition focus:border-[color:var(--brand)] dark:bg-[color:var(--bg-soft)]"
                    placeholder="Enter your name"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="inline-flex h-10 items-center gap-1 rounded-xl border border-emerald-400/60 bg-emerald-500/15 px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-100"
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelNameEdit}
                    disabled={isSavingName}
                    className="inline-flex h-10 items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 text-sm font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[color:var(--bg-soft)]"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold">{profile?.name}</h3>
                  {!isFallback ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 text-sm font-semibold text-[color:var(--text-muted)] transition hover:bg-white hover:text-[color:var(--text)] dark:hover:bg-[color:var(--bg-soft)]"
                    >
                      <PencilLine className="h-4 w-4" />
                      Edit name
                    </button>
                  ) : null}
                </div>
              )}
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
        </div>
      </Card>

      {isAdmin ? (
        <Card className="w-full p-6 md:p-8">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Admin Insights</p>
              <h3 className="mt-1 text-2xl font-bold">Operational Intelligence Tabs</h3>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
              {ADMIN_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAdminTab(tab.key)}
                  className={[
                    "w-full rounded-xl border px-3 py-2 text-center text-sm font-semibold transition",
                    adminTab === tab.key
                      ? "border-cyan-400 bg-cyan-500/15 text-cyan-800 dark:text-cyan-100"
                      : "border-[color:var(--border)] bg-white/70 text-[color:var(--text-muted)] hover:bg-white dark:bg-[color:var(--bg-soft)]/80 dark:hover:bg-[color:var(--bg-soft)]",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {adminInsightsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : adminTab === "health" ? (
              <OpsHealthPanel data={opsHealth} />
            ) : adminTab === "sla" ? (
              <SlaPredictorPanel items={slaRisks} />
            ) : (
              <ApprovalRankingPanel items={approvalRanking} />
            )}
          </div>
        </Card>
      ) : null}
    </div>
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

function OpsHealthPanel({ data }) {
  if (!data) {
    return <EmptyState title="No health metrics" description="Ops health data is currently unavailable." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/75 p-5 dark:bg-[color:var(--bg-soft)]/80">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">Campus Ops Score</p>
        <p className="mt-2 text-5xl font-black text-[color:var(--text)]">{data.score}</p>
        <div className="mt-3">
          <Badge value={data.level} />
        </div>
        <p className="mt-3 text-xs text-[color:var(--text-muted)]">Calculated from queue pressure, high-risk incidents, and unresolved workload.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.breakdown.map((item) => (
          <div key={item.label} className="rounded-xl border border-[color:var(--border)] bg-white/70 px-4 py-3 dark:bg-[color:var(--bg-soft)]/80">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{item.label}</p>
            <p className="mt-2 text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlaPredictorPanel({ items }) {
  if (!items.length) {
    return <EmptyState title="No active SLA risks" description="No open or in-progress tickets are currently at risk." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4 dark:bg-[color:var(--bg-soft)]/80">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold">Ticket #{item.id}</p>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                {item.createdByName || "Unknown user"}
                {item.resourceName ? ` - ${item.resourceName}` : ""}
              </p>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                Age: {Math.round(getElapsedHours(item.createdAt))}h - Reasons: {item.reasons.join(", ")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge value={item.priority} />
              <Badge value={item.status} />
              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2 py-1 text-xs font-bold text-rose-700 dark:text-rose-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                Risk {item.score}
              </span>
              <Link to="/tickets" className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2 py-1 text-xs font-semibold hover:bg-white dark:hover:bg-[color:var(--bg-soft)]">
                Open
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApprovalRankingPanel({ items }) {
  if (!items.length) {
    return <EmptyState title="No pending approvals" description="No booking or account-link approvals are waiting right now." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4 dark:bg-[color:var(--bg-soft)]/80">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold">#{index + 1} {item.title}</p>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">{item.subtitle}</p>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">{item.meta}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge value={item.kind === "BOOKING" ? "Booking" : "Link Request"} />
              <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/15 px-2 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-200">
                <Clock3 className="h-3.5 w-3.5" />
                Priority {item.score}
              </span>
              <Link to={item.route} className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2 py-1 text-xs font-semibold hover:bg-white dark:hover:bg-[color:var(--bg-soft)]">
                Review
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProfilePage;
