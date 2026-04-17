import { BellRing, Menu, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchMyNotifications } from "../api/campusApi";
import ThemeToggle from "../components/common/ThemeToggle";
import { PAGE_TITLES } from "../utils/constants";

function Topbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[location.pathname] ?? "Smart Campus Operations Hub";
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--bg)]/80 px-4 py-3 backdrop-blur-lg md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white/70 lg:hidden dark:bg-[color:var(--bg-soft)]"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Campus Pulse</p>
          <h2 className="truncate text-lg font-bold">{title}</h2>
        </div>

        <div className="hidden w-full max-w-sm items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 md:flex dark:bg-[color:var(--bg-soft)]/85">
          <Search className="h-4 w-4 text-[color:var(--text-muted)]" />
          <input
            type="text"
            readOnly
            value=""
            placeholder="Global search, command palette..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]/75"
          />
        </div>

        <ThemeToggle />

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="relative inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm font-semibold dark:bg-[color:var(--bg-soft)]/80"
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
          className="hidden items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm font-semibold md:inline-flex dark:bg-[color:var(--bg-soft)]/80"
        >
          <ShieldCheck className="h-4 w-4" />
          Profile
        </button>
      </div>
    </header>
  );
}

export default Topbar;
