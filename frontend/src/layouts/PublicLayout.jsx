import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/public/PublicNavbar";

function PublicLayout() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="public-grid-bg pointer-events-none fixed inset-0 -z-20" />
      <div className="pointer-events-none fixed -left-20 top-12 -z-10 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl" />
      <div className="pointer-events-none fixed -right-16 top-36 -z-10 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-1/4 -z-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />

      <PublicNavbar />
      <main className="pt-28">
        <Outlet />
      </main>
    </div>
  );
}

export default PublicLayout;
