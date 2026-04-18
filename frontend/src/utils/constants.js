export const RESOURCE_TYPES = ["ROOM", "LAB", "EQUIPMENT"];
export const RESOURCE_STATUSES = ["AVAILABLE", "IN_USE", "MAINTENANCE", "INACTIVE"];
export const BOOKING_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];
export const TICKET_CATEGORIES = ["HARDWARE", "SOFTWARE", "NETWORK", "FACILITY", "OTHER"];
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
export const CAMPUS_EVENT_STATUSES = ["OPEN", "COMPLETED", "CANCELLED"];
export const EVENT_ENROLLMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export const PAGE_TITLES = {
  "/dashboard": "Campus Command Center",
  "/student/dashboard": "Student Operations Hub",
  "/staff/dashboard": "Staff Operations Hub",
  "/technician/dashboard": "Technician Operations Hub",
  "/technician/sla": "Technician SLA Monitor",
  "/technician/queue": "Technician Priority Queue",
  "/technician/visits": "Technician Field Visits",
  "/admin/dashboard": "Admin Operations Hub",
  "/resources": "Resource Atlas",
  "/bookings": "Booking Intelligence",
  "/enrollments": "Campus Enrollments",
  "/calendar": "Academic Calendar",
  "/tickets": "Ticket Operations",
  "/notifications": "Notifications Center",
  "/admin/link-requests": "Account Link Requests",
  "/users": "Campus People Directory",
  "/profile": "Identity & Access Profile",
};
