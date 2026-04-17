import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchProfile } from "../api/campusApi";
import { dashboardRouteForRole } from "../utils/roles";

function RoleDashboardRedirectPage() {
  const [targetRoute, setTargetRoute] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function resolveTarget() {
      try {
        const response = await fetchProfile();
        if (!mounted) return;
        setTargetRoute(dashboardRouteForRole(response?.data?.role));
      } catch (error) {
        if (!mounted) return;
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          setTargetRoute("/");
          return;
        }

        // Preserve fallback behavior when backend is temporarily unreachable.
        setTargetRoute("/student/dashboard");
      }
    }

    resolveTarget();
    return () => {
      mounted = false;
    };
  }, []);

  if (!targetRoute) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <p className="text-sm font-semibold text-[color:var(--text-muted)]">Routing to your dashboard...</p>
      </div>
    );
  }

  return <Navigate to={targetRoute} replace />;
}

export default RoleDashboardRedirectPage;

