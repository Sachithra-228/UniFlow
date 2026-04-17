import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchProfile } from "../../api/campusApi";

function ProtectedRoute({ children, allowedRoles }) {
  const [status, setStatus] = useState("loading");
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    async function validateAccess() {
      try {
        const response = await fetchProfile();
        const role = response?.data?.role;
        const roleAllowed =
          !Array.isArray(allowedRoles) ||
          allowedRoles.length === 0 ||
          (typeof role === "string" && allowedRoles.includes(role.toUpperCase()));

        if (mounted) {
          setStatus(roleAllowed ? "allowed" : "forbidden");
        }
      } catch (error) {
        if (!mounted) return;

        if (error?.response?.status === 401 || error?.response?.status === 403) {
          setStatus("unauthorized");
          return;
        }

        // Keep app usable when backend is temporarily unreachable.
        setStatus("allowed");
      }
    }

    validateAccess();
    return () => {
      mounted = false;
    };
  }, [allowedRoles]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <p className="text-sm font-semibold text-[color:var(--text-muted)]">Checking access...</p>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (status === "forbidden") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
