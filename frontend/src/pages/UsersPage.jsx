import { Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchUsers } from "../api/campusApi";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const { addToast } = useToast();

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const response = await fetchUsers({ page: 0, size: 300 });
        setUsers(response.items);
      } catch {
        addToast({
          type: "error",
          title: "Users unavailable",
          message: "Failed to load user directory from backend.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [addToast]);

  const roles = useMemo(() => {
    const roleSet = new Set(users.map((user) => user.role).filter(Boolean));
    return ["ALL", ...roleSet];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = [user.name, user.email].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 dark:bg-[color:var(--bg-soft)]/80">
            <Search className="h-4 w-4 text-[color:var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users by name or email"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]/70"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role === "ALL" ? "All Roles" : role}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-[150px] rounded-2xl" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your search or role filters." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => (
              <article key={user.id} className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 dark:bg-[color:var(--bg-soft)]/80">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-xl bg-[color:var(--brand-soft)] p-2">
                    <UserRound className="h-4 w-4 text-[color:var(--brand)]" />
                  </span>
                  <Badge value={user.role} />
                </div>
                <p className="font-semibold">{user.name}</p>
                <p className="mt-1 text-sm text-[color:var(--text-muted)]">{user.email}</p>
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[color:var(--text-muted)]">Provider:</span>
                  <Badge value={user.provider ?? "local"} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default UsersPage;
