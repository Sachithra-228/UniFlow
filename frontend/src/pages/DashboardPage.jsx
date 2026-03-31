import { Building2, CalendarClock, CircleCheckBig, UsersRound, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchBookings, fetchResources, fetchUsers } from "../api/campusApi";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import StatCard from "../components/common/StatCard";
import { useToast } from "../hooks/useToast";
import { formatDateTime, titleCase } from "../utils/format";

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [usersData, resourcesData, bookingsData] = await Promise.all([
          fetchUsers({ page: 0, size: 100 }),
          fetchResources({ page: 0, size: 100 }),
          fetchBookings({ page: 0, size: 100 }),
        ]);

        setUsers(usersData.items);
        setResources(resourcesData.items);
        setBookings(bookingsData.items);

        if (usersData.isFallback || resourcesData.isFallback || bookingsData.isFallback) {
          addToast({
            type: "info",
            title: "Offline fallback data",
            message: "Backend was unreachable briefly. You are viewing mock data.",
          });
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Unable to load dashboard",
          message: "Please verify backend availability and try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const activeResources = useMemo(
    () => resources.filter((resource) => ["AVAILABLE", "IN_USE"].includes(resource.status)).length,
    [resources]
  );

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5),
    [bookings]
  );

  const categoryData = useMemo(() => {
    const grouped = resources.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([type, count]) => ({
      type,
      count,
      ratio: resources.length ? (count / resources.length) * 100 : 0,
    }));
  }, [resources]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <LoadingSkeleton key={index} className="h-[136px] rounded-2xl" />)
        ) : (
          <>
            <StatCard title="Total Users" value={users.length} subtitle="Campus identities indexed" icon={UsersRound} />
            <StatCard title="Total Resources" value={resources.length} subtitle="Across labs, rooms, equipment" icon={Building2} accent="from-sky-500/20 to-indigo-500/20" />
            <StatCard title="Total Bookings" value={bookings.length} subtitle="Reservation records tracked" icon={CalendarClock} accent="from-amber-500/25 to-orange-500/20" />
            <StatCard title="Active Resources" value={activeResources} subtitle="Ready or currently in use" icon={CircleCheckBig} accent="from-emerald-500/25 to-teal-500/20" />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Bookings</h3>
            <Link to="/bookings" className="text-sm font-semibold text-[color:var(--brand)] hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <LoadingSkeleton key={index} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <EmptyState title="No bookings yet" description="Create your first booking to start activity tracking for resource usage." />
          ) : (
            <div className="fine-scrollbar overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                  <tr>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Resource</th>
                    <th className="pb-3">Window</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="py-3 font-semibold">{booking.userName}</td>
                      <td className="py-3">{booking.resourceName}</td>
                      <td className="py-3 text-xs text-[color:var(--text-muted)]">{formatDateTime(booking.startTime)}</td>
                      <td className="py-3">
                        <Badge value={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 text-lg font-semibold">Resource Categories</h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="h-10 rounded-xl" />
                ))}
              </div>
            ) : categoryData.length ? (
              <div className="space-y-4">
                {categoryData.map((item) => (
                  <div key={item.type}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <p className="font-semibold">{titleCase(item.type)}</p>
                      <p className="text-[color:var(--text-muted)]">{item.count}</p>
                    </div>
                    <div className="h-2 rounded-full bg-slate-300/45 dark:bg-slate-700/60">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                        style={{ width: `${Math.max(item.ratio, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No resources grouped yet" description="Add resources to visualize category distribution." />
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
            <div className="space-y-3 text-sm">
              <QuickAction to="/resources" icon={Wrench} title="Create Resource" subtitle="Register rooms, labs, and equipment." />
              <QuickAction to="/bookings" icon={CalendarClock} title="New Booking" subtitle="Submit reservation requests with timestamps." />
              <QuickAction to="/users" icon={UsersRound} title="User Directory" subtitle="Inspect role and provider details." />
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, subtitle }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-white/65 p-3 transition hover:bg-white dark:bg-[color:var(--bg-soft)]/70 dark:hover:bg-[color:var(--bg-soft)]">
      <span className="rounded-lg bg-[color:var(--brand-soft)] p-2 text-[color:var(--brand)]">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-[color:var(--text-muted)]">{subtitle}</p>
      </span>
    </Link>
  );
}

export default DashboardPage;
