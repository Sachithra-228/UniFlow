import { BellRing, CheckCheck, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyNotifications,
  fetchProfile,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";
import { formatDateTime } from "../utils/format";
import { dashboardRouteForRole, normalizeRole } from "../utils/roles";

function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [role, setRole] = useState("STUDENT");
  const [busyKey, setBusyKey] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileResponse, notificationsResponse] = await Promise.all([
          fetchProfile(),
          fetchMyNotifications({ page: 0, size: 100 }),
        ]);
        setRole(normalizeRole(profileResponse?.data?.role) ?? "STUDENT");
        setNotifications(notificationsResponse.items);
      } catch (error) {
        addToast({
          type: "error",
          title: "Notifications unavailable",
          message: error?.response?.data?.message || "Failed to load notifications.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readStatus).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notifications.filter((notification) => {
      const category = inferNotificationCategory(notification);
      const filterMatches =
        activeFilter === "ALL"
          ? true
          : activeFilter === "UNREAD"
            ? !notification.readStatus
            : category === activeFilter;

      if (!filterMatches) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        notification.message,
        notification.type,
        notification.readStatus ? "read" : "unread",
        category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [notifications, activeFilter, searchQuery]);

  async function handleMarkRead(id) {
    setBusyKey(`read-${id}`);
    try {
      const response = await markNotificationRead(id);
      setNotifications((current) =>
        current.map((notification) => (notification.id === id ? response.data : notification))
      );
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        message: error?.response?.data?.message || "Failed to mark notification as read.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleMarkAllRead() {
    setBusyKey("read-all");
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, readStatus: true })));
      addToast({
        type: "success",
        title: "Notifications updated",
        message: "All notifications have been marked as read.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        message: error?.response?.data?.message || "Failed to mark all notifications as read.",
      });
    } finally {
      setBusyKey("");
    }
  }

  const roleHome = dashboardRouteForRole(role);
  const readCount = notifications.length - unreadCount;

  return (
    <div className="relative space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-44 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <Card className="relative overflow-hidden border-[color:var(--border)] bg-gradient-to-r from-[color:var(--brand-soft)]/35 via-white/90 to-transparent p-6 md:p-7 dark:via-[color:var(--bg-soft)]/85">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[color:var(--brand)]/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Notifications
            </p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl lg:text-[2.6rem]">
              Role Notifications Center
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-[color:var(--text-muted)] md:text-base">
              Track ticket and booking activity updates for your account.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm font-semibold shadow-sm dark:bg-[color:var(--bg-soft)]/80">
              Unread: {unreadCount}
            </span>
            <Button
              variant="secondary"
              onClick={handleMarkAllRead}
              loading={busyKey === "read-all"}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 md:grid-cols-3">
          <SummaryPill label="Total" value={notifications.length} tone="default" />
          <SummaryPill label="Unread" value={unreadCount} tone="warn" />
          <SummaryPill label="Read" value={readCount} tone="success" />
        </div>
      </Card>

      {loading ? (
        <Card className="p-5">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No notifications yet"
            description="Notifications will appear here when ticket and booking events occur."
          />
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "ALL", label: "All" },
                  { key: "UNREAD", label: "Unread" },
                  { key: "TICKET", label: "Ticket" },
                  { key: "BOOKING", label: "Booking" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setActiveFilter(option.key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                      activeFilter === option.key
                        ? "border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]"
                        : "border-[color:var(--border)] bg-white/70 text-[color:var(--text-muted)] hover:bg-white dark:bg-[color:var(--bg-soft)]/80 dark:hover:bg-[color:var(--bg-soft)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="flex w-full items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 shadow-sm lg:max-w-sm dark:bg-[color:var(--bg-soft)]/80">
                <BellRing className="h-4 w-4 text-[color:var(--text-muted)]" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search notifications"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                />
              </label>
            </div>
          </Card>

          {filteredNotifications.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                title="No matching notifications"
                description="Try a different filter or search keyword."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border p-4 transition-all duration-200 hover:shadow-md ${
                notification.readStatus
                  ? "border-[color:var(--border)] bg-white/75 dark:bg-[color:var(--bg-soft)]/80"
                  : "border-cyan-200 bg-cyan-50/45 dark:border-cyan-900/40 dark:bg-cyan-950/20"
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <BellRing className="h-4 w-4 text-[color:var(--brand)]" />
                    <Badge value={notification.type} />
                    <Badge value={notification.readStatus ? "RESOLVED" : "OPEN"} />
                    {!notification.readStatus ? (
                      <span className="rounded-full border border-cyan-300 bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-800 dark:border-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-base font-semibold leading-snug">{notification.message}</p>
                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">{formatDateTime(notification.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.readStatus ? (
                    <Button
                      size="sm"
                      className="bg-[color:var(--brand)] text-white"
                      onClick={() => handleMarkRead(notification.id)}
                      loading={busyKey === `read-${notification.id}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark read
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                      Read
                    </span>
                  )}
                </div>
              </div>
            </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            to={roleHome}
            className="rounded-xl border border-[color:var(--border)] bg-white/75 px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:bg-[color:var(--bg-soft)]/80 dark:hover:bg-[color:var(--bg-soft)]"
          >
            Back to role dashboard
          </Link>
          <Link
            to="/tickets"
            className="rounded-xl border border-[color:var(--border)] bg-white/75 px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:bg-[color:var(--bg-soft)]/80 dark:hover:bg-[color:var(--bg-soft)]"
          >
            Open ticket workspace
          </Link>
        </div>
      </Card>
    </div>
  );
}

function inferNotificationCategory(notification) {
  const message = String(notification?.message || "").toLowerCase();
  if (message.includes("ticket")) {
    return "TICKET";
  }
  if (message.includes("booking") || message.includes("reservation")) {
    return "BOOKING";
  }
  return "OTHER";
}

function SummaryPill({ label, value, tone = "default" }) {
  const toneClasses = {
    default: "border-[color:var(--border)] bg-white/80 text-[color:var(--text)] dark:bg-[color:var(--bg-soft)]/80",
    warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  };

  return (
    <div className={`rounded-xl border px-3 py-2 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

export default NotificationsPage;

