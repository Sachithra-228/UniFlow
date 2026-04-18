import { BellRing, LogOut, Menu, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchMyNotifications, fetchProfile, getLogoutUrl } from "../api/campusApi";
import ThemeToggle from "../components/common/ThemeToggle";
import { PAGE_TITLES } from "../utils/constants";
import { normalizeRole } from "../utils/roles";

const GLOBAL_SHORTCUTS = {
  STUDENT: [
    { label: "Dashboard", path: "/student/dashboard", keywords: ["home", "overview", "student"] },
    { label: "Bookings", path: "/bookings", keywords: ["reservations", "schedule"] },
    { label: "Tickets", path: "/tickets", keywords: ["issues", "support", "maintenance"] },
    { label: "Notifications", path: "/notifications", keywords: ["alerts", "updates"] },
    { label: "Profile", path: "/profile", keywords: ["account", "identity"] },
  ],
  STAFF: [
    { label: "Dashboard", path: "/staff/dashboard", keywords: ["home", "overview", "staff"] },
    { label: "Bookings", path: "/bookings", keywords: ["reservations", "schedule"] },
    { label: "Tickets", path: "/tickets", keywords: ["issues", "support", "maintenance"] },
    { label: "Notifications", path: "/notifications", keywords: ["alerts", "updates"] },
    { label: "Profile", path: "/profile", keywords: ["account", "identity"] },
  ],
  TECHNICIAN: [
    { label: "Dashboard", path: "/technician/dashboard", keywords: ["home", "overview", "technician"] },
    { label: "Assigned Tickets", path: "/tickets?view=assigned", keywords: ["queue", "issues", "support"] },
    { label: "Bookings", path: "/bookings", keywords: ["reservations", "schedule"] },
    { label: "Notifications", path: "/notifications", keywords: ["alerts", "updates"] },
    { label: "Profile", path: "/profile", keywords: ["account", "identity"] },
  ],
  ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard", keywords: ["home", "overview", "admin"] },
    { label: "Resources", path: "/resources", keywords: ["inventory", "assets"] },
    { label: "Bookings", path: "/bookings", keywords: ["reservations", "schedule"] },
    { label: "Tickets", path: "/tickets", keywords: ["issues", "support", "maintenance"] },
    { label: "Link Requests", path: "/admin/link-requests", keywords: ["account", "approval"] },
    { label: "Users", path: "/users", keywords: ["people", "directory"] },
    { label: "Notifications", path: "/notifications", keywords: ["alerts", "updates"] },
    { label: "Profile", path: "/profile", keywords: ["account", "identity"] },
  ],
};

function buildSearchIndex(shortcut) {
  return [shortcut.label, PAGE_TITLES[shortcut.path.split("?")[0]], ...(shortcut.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function Topbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[location.pathname] ?? "Smart Campus Operations Hub";
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState("STUDENT");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadUnreadCount() {
      try {
        const response = await fetchMyNotifications({ page: 0, size: 1 }, { unreadOnly: true });
        if (!mounted) return;
        setUnreadCount(response.totalElements ?? 0);
      } catch {
        if (!mounted) return;
        setUnreadCount(0);
      }
    }
    loadUnreadCount();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      try {
        const response = await fetchProfile();
        if (!mounted) return;
        setRole(normalizeRole(response?.data?.role) ?? "STUDENT");
      } catch {
        if (!mounted) return;
        setRole("STUDENT");
      }
    }

    loadRole();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSearchQuery("");
    setShowResults(false);
  }, [location.pathname]);

  const availableShortcuts = useMemo(() => GLOBAL_SHORTCUTS[role] ?? GLOBAL_SHORTCUTS.STUDENT, [role]);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const queryWords = useMemo(() => normalizedQuery.split(/\s+/).filter(Boolean), [normalizedQuery]);
  const matchedShortcuts = useMemo(() => {
    if (!normalizedQuery) {
      return availableShortcuts.slice(0, 5).map((shortcut) => ({
        ...shortcut,
        matchedTerms: [],
        isCurrentPage: location.pathname === shortcut.path.split("?")[0],
      }));
    }

    return availableShortcuts
      .map((shortcut) => {
        const searchableText = buildSearchIndex(shortcut);
        const matchedTerms = queryWords.filter((word) => searchableText.includes(word));
        return {
          ...shortcut,
          matchedTerms,
          isCurrentPage: location.pathname === shortcut.path.split("?")[0],
          score: matchedTerms.length + (searchableText.includes(normalizedQuery) ? 2 : 0),
        };
      })
      .filter((shortcut) => shortcut.matchedTerms.length > 0)
      .sort((left, right) => right.score - left.score);
  }, [availableShortcuts, location.pathname, normalizedQuery, queryWords]);

  function handleLogout() {
    window.location.href = getLogoutUrl();
  }

  function handleShortcutSelect(path) {
    navigate(path);
    setSearchQuery("");
    setShowResults(false);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    if (!matchedShortcuts.length) return;
    handleShortcutSelect(matchedShortcuts[0].path);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-200/45 bg-[linear-gradient(90deg,rgba(248,255,251,0.9)_0%,rgba(226,244,255,0.86)_100%)] px-4 py-3 backdrop-blur-lg dark:border-[color:var(--border)] dark:bg-[color:var(--bg)]/80 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white/70 lg:hidden dark:bg-[color:var(--bg-soft)]"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-[color:var(--text-muted)]">Campus Pulse</p>
          <h2 className="truncate bg-gradient-to-r from-[color:var(--navy-deep)] via-[color:var(--brand)] to-[color:var(--accent)] bg-clip-text text-lg font-bold text-transparent dark:bg-none dark:text-[color:var(--text)] dark:[-webkit-text-fill-color:unset]">{title}</h2>
        </div>

        <div className="relative hidden w-full max-w-sm md:block">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 rounded-2xl border border-emerald-200/70 bg-white/75 px-3 py-2 shadow-[0_10px_30px_rgba(18,58,120,0.08)] dark:border-[color:var(--border)] dark:bg-[color:var(--bg-soft)]/85 dark:shadow-none"
          >
            <Search className="h-4 w-4 text-[color:var(--accent)] dark:text-[color:var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => {
                window.setTimeout(() => {
                  setShowResults(false);
                }, 150);
              }}
              placeholder="Search pages and shortcuts..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]/75"
            />
          </form>

          {showResults ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-emerald-200/65 bg-white/95 p-2 shadow-[0_22px_50px_rgba(18,58,120,0.16)] backdrop-blur dark:border-[color:var(--border)] dark:bg-[color:var(--bg-soft)]/95 dark:shadow-none">
              {matchedShortcuts.length ? (
                matchedShortcuts.slice(0, 5).map((shortcut) => (
                  <button
                    key={shortcut.path}
                    type="button"
                    onClick={() => handleShortcutSelect(shortcut.path)}
                    className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[color:var(--accent-soft)] dark:hover:bg-[color:var(--brand-soft)]"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">{shortcut.label}</span>
                        {shortcut.isCurrentPage ? (
                          <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--accent)] dark:bg-[color:var(--brand-soft)] dark:text-[color:var(--brand)]">
                            Current
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs text-[color:var(--text-muted)]">
                        {PAGE_TITLES[shortcut.path.split("?")[0]] ?? shortcut.path}
                      </span>
                      {shortcut.matchedTerms.length ? (
                        <span className="mt-1 block text-[11px] text-[color:var(--text-muted)]">
                          Matched: {shortcut.matchedTerms.join(", ")}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-[color:var(--text-muted)]">{shortcut.path}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-[color:var(--text-muted)]">No matching pages found.</p>
              )}
            </div>
          ) : null}
        </div>

        <ThemeToggle />

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="relative inline-flex items-center gap-2 rounded-2xl border border-emerald-200/70 bg-white/80 px-3 py-2 text-sm font-semibold text-[color:var(--brand)] shadow-[0_10px_24px_rgba(18,58,120,0.08)] dark:border-[color:var(--border)] dark:bg-[color:var(--bg-soft)]/80 dark:shadow-none"
        >
          <BellRing className="h-4 w-4" />
          <span className="hidden md:inline">Notifications</span>
          {unreadCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="hidden items-center gap-2 rounded-2xl border border-emerald-200/70 bg-white/80 px-3 py-2 text-sm font-semibold text-[color:var(--brand)] shadow-[0_10px_24px_rgba(18,58,120,0.08)] md:inline-flex dark:border-[color:var(--border)] dark:bg-[color:var(--bg-soft)]/80 dark:shadow-none"
        >
          <ShieldCheck className="h-4 w-4" />
          Profile
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200/80 bg-white/80 px-3 py-2 text-sm font-semibold text-rose-700 shadow-[0_10px_24px_rgba(190,18,60,0.08)] dark:border-[color:var(--border)] dark:bg-[color:var(--bg-soft)]/80 dark:text-rose-300 dark:shadow-none"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
