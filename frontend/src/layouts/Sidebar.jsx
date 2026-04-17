import {
  BellRing,
  BookCopy,
  ClipboardList,
  LayoutDashboard,
  Link2,
  PanelLeftClose,
  UserCircle2,
  Wrench,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { fetchProfile } from "../api/campusApi";
import { cn } from "../utils/cn";
import { dashboardRouteForRole, normalizeRole } from "../utils/roles";

const roleNavItems = {
  STUDENT: [
    { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/bookings", label: "Bookings", icon: BookCopy },
    { to: "/tickets", label: "Tickets", icon: ClipboardList },
    { to: "/notifications", label: "Notifications", icon: BellRing },
    { to: "/profile", label: "Profile", icon: UserCircle2 },
  ],
  STAFF: [
    { to: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/bookings", label: "Bookings", icon: BookCopy },
    { to: "/tickets", label: "Tickets", icon: ClipboardList },
    { to: "/notifications", label: "Notifications", icon: BellRing },
    { to: "/profile", label: "Profile", icon: UserCircle2 },
  ],
  TECHNICIAN: [
    { to: "/technician/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tickets", label: "Tickets", icon: ClipboardList },
    { to: "/bookings", label: "Bookings", icon: BookCopy },
    { to: "/notifications", label: "Notifications", icon: BellRing },
    { to: "/profile", label: "Profile", icon: UserCircle2 },
  ],
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/resources", label: "Resources", icon: Wrench },
    { to: "/bookings", label: "Bookings", icon: BookCopy },
    { to: "/tickets", label: "Tickets", icon: ClipboardList },
    { to: "/admin/link-requests", label: "Link Requests", icon: Link2 },
    { to: "/users", label: "Users", icon: UsersRound },
    { to: "/notifications", label: "Notifications", icon: BellRing },
    { to: "/profile", label: "Profile", icon: UserCircle2 },
  ],
};

function Sidebar({ isMobileOpen, onClose, onCollapse, isCollapsed }) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      try {
        const response = await fetchProfile();
        if (!mounted) return;
        setRole(normalizeRole(response?.data?.role) ?? "STUDENT");
      } catch (error) {
        if (!mounted) return;
        setRole("STUDENT");
      }
    }

    loadRole();
    return () => {
      mounted = false;
    };
  }, []);

  const navItems = useMemo(() => {
    if (!role) return [];
    return roleNavItems[role] ?? roleNavItems.STUDENT;
  }, [role]);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden border-r border-[color:var(--border)] bg-[color:var(--bg-soft)]/90 backdrop-blur-lg lg:block",
          isCollapsed ? "w-[88px]" : "w-[268px]"
        )}
      >
        <SidebarBody
          navItems={navItems}
          role={role}
          isCollapsed={isCollapsed}
          onCollapse={onCollapse}
        />
      </aside>

      <div className={cn("fixed inset-0 z-[90] bg-slate-950/55 lg:hidden", isMobileOpen ? "block" : "hidden")} onClick={onClose} />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[95] w-[280px] border-r border-[color:var(--border)] bg-[color:var(--bg-soft)]/95 p-4 backdrop-blur-xl transition-transform duration-300 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarBody navItems={navItems} role={role} isMobile onClose={onClose} />
      </aside>
    </>
  );
}

function SidebarBody({ navItems, role, isCollapsed = false, isMobile = false, onClose, onCollapse }) {
  const roleLabel = role ? `${role} Access` : "Loading Access";
  const roleHomeRoute = role ? dashboardRouteForRole(role) : "/dashboard";

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-7 flex items-center justify-between">
        <div className={cn("overflow-hidden transition-all", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Smart Campus</p>
          <h1 className="mt-1 text-lg font-bold">Operations Hub</h1>
        </div>
        {isMobile ? (
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)]"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] transition hover:bg-white/70 dark:hover:bg-white/5"
            onClick={onCollapse}
          >
            <PanelLeftClose className={cn("h-4 w-4 transition", isCollapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <nav className="space-y-2">
        {!navItems.length ? (
          <div className="rounded-xl border border-[color:var(--border)] bg-white/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)] dark:bg-[color:var(--bg-soft)]/70">
            Loading menu...
          </div>
        ) : null}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/15 text-[color:var(--text)] shadow-sm"
                  : "text-[color:var(--text-muted)] hover:bg-black/5 hover:text-[color:var(--text)] dark:hover:bg-white/5",
                isCollapsed && !isMobile && "justify-center px-2"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className={cn("transition-all", isCollapsed && !isMobile && "w-0 overflow-hidden opacity-0")}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-[color:var(--border)] bg-white/60 p-4 dark:bg-white/5">
        <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[color:var(--text-muted)]">{roleLabel}</p>
        <NavLink to={roleHomeRoute} className="mt-2 block text-sm font-semibold hover:underline">
          Go to role dashboard
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;
