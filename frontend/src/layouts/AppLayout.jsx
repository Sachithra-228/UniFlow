import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar
        isMobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isCollapsed={collapsed}
        onCollapse={() => setCollapsed((prev) => !prev)}
      />

      <div className={collapsed ? "lg:pl-[88px]" : "lg:pl-[268px]"}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        <main className="page-fade-in p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
