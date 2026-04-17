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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Notifications
            </p>
            <h2 className="mt-2 text-2xl font-bold">Role Notifications Center</h2>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Track ticket and booking activity updates for your account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-[color:var(--border)] bg-white/70 px-3 py-2 text-sm font-semibold dark:bg-[color:var(--bg-soft)]/80">
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
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <BellRing className="h-4 w-4 text-[color:var(--brand)]" />
                    <Badge value={notification.type} />
                    <Badge value={notification.readStatus ? "RESOLVED" : "OPEN"} />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{notification.message}</p>
                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">{formatDateTime(notification.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.readStatus ? (
                    <Button
                      size="sm"
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

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            to={roleHome}
            className="rounded-xl border border-[color:var(--border)] bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white dark:bg-[color:var(--bg-soft)]/80 dark:hover:bg-[color:var(--bg-soft)]"
          >
            Back to role dashboard
          </Link>
          <Link
            to="/tickets"
            className="rounded-xl border border-[color:var(--border)] bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white dark:bg-[color:var(--bg-soft)]/80 dark:hover:bg-[color:var(--bg-soft)]"
          >
            Open ticket workspace
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default NotificationsPage;

