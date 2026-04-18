import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/public/PublicNavbar";

function PublicLayout() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <PublicNavbar />
      <main className="pt-28">
        <Outlet />
      </main>
    </div>
  );
}

export default PublicLayout;
