import { BellRing, Link2Off, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProfile } from "../api/campusApi";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { normalizeRole } from "../utils/roles";

const profileRoutes = {
  STUDENT: "/student/dashboard",
  STAFF: "/staff/dashboard",
  TECHNICIAN: "/technician/dashboard",
  ADMIN: "/admin/dashboard",
};

function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("STUDENT");

  useEffect(() => {
    let mounted = true;
    async function loadRole() {
      try {
        const response = await fetchProfile();
        if (!mounted) return;
        setRole(normalizeRole(response?.data?.role) ?? "STUDENT");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadRole();
    return () => {
      mounted = false;
    };
  }, []);

  const roleHome = useMemo(() => profileRoutes[role] ?? "/dashboard", [role]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="space-y-3">
          <LoadingSkeleton className="h-7 w-60 rounded-xl" />
          <LoadingSkeleton className="h-16 rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Notifications
        </p>
        <h2 className="mt-2 text-2xl font-bold">Role Notifications Center</h2>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          This section is prepared for role-specific alerts and activity updates.
        </p>
      </Card>

      <Card className="p-6">
        <EmptyState
          title="TODO: Notification API integration pending"
          description="Notification feed/read-status APIs are not implemented in the current backend. This page intentionally shows a clear stub."
          icon={Link2Off}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-[color:var(--brand)]" />
            <p className="font-semibold">Planned Notification Sources</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--text-muted)]">
            <li>- Booking approvals and rejections</li>
            <li>- Ticket assignment and status changes</li>
            <li>- Account link-request decisions</li>
          </ul>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
            TODO: connect once `/api/notifications` exists.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-[color:var(--brand)]" />
            <p className="font-semibold">Quick Navigation</p>
          </div>
          <div className="mt-3 grid gap-3">
            <Link
              to={roleHome}
              className="rounded-xl border border-[color:var(--border)] bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white dark:bg-[color:var(--bg-soft)]/80 dark:hover:bg-[color:var(--bg-soft)]"
            >
              Back to role dashboard
            </Link>
            <Link
              to="/profile"
              className="rounded-xl border border-[color:var(--border)] bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white dark:bg-[color:var(--bg-soft)]/80 dark:hover:bg-[color:var(--bg-soft)]"
            >
              Profile
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default NotificationsPage;

