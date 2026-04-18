import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useUnreadNotificationsCount } from "../hooks/useUnreadNotificationsCount";

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const unreadCount = useUnreadNotificationsCount();

  return (
    <div className="min-h-screen">
      <Sidebar
        isMobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isCollapsed={collapsed}
        onCollapse={() => setCollapsed((prev) => !prev)}
        unreadCount={unreadCount}
      />

      <div className={collapsed ? "lg:pl-[88px]" : "lg:pl-[268px]"}>
        <Topbar onMenuClick={() => setMobileOpen(true)} unreadCount={unreadCount} />

        <main className="page-fade-in p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
