export const APP_ROLES = ["STUDENT", "STAFF", "TECHNICIAN", "ADMIN"];

export function normalizeRole(role) {
  if (typeof role !== "string") return null;
  const normalized = role.trim().toUpperCase();
  if (normalized === "USER") return "STUDENT";
  return APP_ROLES.includes(normalized) ? normalized : null;
}

export function dashboardRouteForRole(role) {
  const normalizedRole = normalizeRole(role);
  switch (normalizedRole) {
    case "STUDENT":
      return "/student/dashboard";
    case "STAFF":
      return "/staff/dashboard";
    case "TECHNICIAN":
      return "/technician/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/";
  }
}

