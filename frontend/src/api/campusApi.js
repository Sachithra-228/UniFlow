import api, { API_BASE_URL } from "./client";
import {
  addMockBooking,
  addMockResource,
  getMockBookings,
  getMockProfile,
  getMockResources,
  getMockUsers,
} from "../utils/mockData";

function toPageShape(items, page = 0, size = 10) {
  return {
    items,
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size) || 1,
  };
}

function fromPagePayload(payload, fallbackSize = 10) {
  if (Array.isArray(payload)) {
    return toPageShape(payload, 0, fallbackSize);
  }

  return {
    items: payload?.content ?? [],
    page: payload?.number ?? 0,
    size: payload?.size ?? fallbackSize,
    totalElements: payload?.totalElements ?? 0,
    totalPages: payload?.totalPages ?? 1,
  };
}

function isServiceUnavailable(error) {
  return !error?.response || error.code === "ECONNABORTED" || error.code === "ERR_NETWORK";
}

function emitNotificationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("notifications:changed"));
  }
}

export async function fetchUsers(params = { page: 0, size: 10 }) {
  try {
    const response = await api.get("/api/users", { params });
    return { ...fromPagePayload(response.data, params.size), isFallback: false };
  } catch (error) {
    if (isServiceUnavailable(error)) {
      return { ...toPageShape(getMockUsers(), params.page ?? 0, params.size ?? 10), isFallback: true };
    }
    throw error;
  }
}

export async function inviteAdminUser(payload) {
  const response = await api.post("/api/admin/users/invite", payload);
  return { data: response.data };
}

export async function updateAdminUser(id, payload) {
  const response = await api.patch(`/api/admin/users/${id}`, payload);
  return { data: response.data };
}

export async function deleteAdminUser(id) {
  const response = await api.delete(`/api/admin/users/${id}`);
  return { data: response.data };
}

export async function fetchResources(params = { page: 0, size: 20 }) {
  try {
    const response = await api.get("/api/resources", { params });
    return { ...fromPagePayload(response.data, params.size), isFallback: false };
  } catch (error) {
    if (isServiceUnavailable(error)) {
      return { ...toPageShape(getMockResources(), params.page ?? 0, params.size ?? 20), isFallback: true };
    }
    throw error;
  }
}

export async function fetchBookings(params = { page: 0, size: 20 }) {
  try {
    const response = await api.get("/api/bookings", { params });
    return { ...fromPagePayload(response.data, params.size), isFallback: false };
  } catch (error) {
    if (isServiceUnavailable(error)) {
      return { ...toPageShape(getMockBookings(), params.page ?? 0, params.size ?? 20), isFallback: true };
    }
    throw error;
  }
}

export async function createResource(payload) {
  try {
    const response = await api.post("/api/resources", payload);
    return { data: response.data, isFallback: false };
  } catch (error) {
    if (isServiceUnavailable(error)) {
      return { data: addMockResource(payload), isFallback: true };
    }
    throw error;
  }
}

export async function updateResource(id, payload) {
  const response = await api.put(`/api/resources/${id}`, payload);
  return { data: response.data };
}

export async function deleteResource(id) {
  const response = await api.delete(`/api/resources/${id}`);
  return { data: response.data };
}

export async function createBooking(payload) {
  try {
    const response = await api.post("/api/bookings", payload);
    return { data: response.data, isFallback: false };
  } catch (error) {
    if (isServiceUnavailable(error)) {
      return { data: addMockBooking(payload), isFallback: true };
    }
    throw error;
  }
}

export async function fetchProfile() {
  try {
    const response = await api.get("/profile");
    return { data: response.data, isFallback: false };
  } catch (error) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      throw error;
    }
    if (isServiceUnavailable(error)) {
      return { data: getMockProfile(), isFallback: true };
    }
    throw error;
  }
}

export async function updateProfileName(payload) {
  const response = await api.patch("/profile", payload);
  return { data: response.data };
}

export async function updateBookingStatus(id, payload) {
  const response = await api.patch(`/api/bookings/${id}/status`, payload);
  return { data: response.data };
}

export async function fetchBookingCheckInQr(id) {
  const response = await api.get(`/api/bookings/${id}/check-in/qr`);
  return { data: response.data };
}

export async function scanBookingCheckIn(payload) {
  const response = await api.post("/api/bookings/check-in/scan", payload);
  return { data: response.data };
}

export function getGoogleLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/google`;
}

export async function logoutUser() {
  try {
    const response = await api.post("/api/auth/logout");
    return { data: response.data };
  } catch (error) {
    // Treat already-expired or already-cleared sessions as logged out.
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { data: null };
    }
    throw error;
  }
}

export async function fetchAdminLinkRequests(status) {
  const params = status ? { status } : {};
  const response = await api.get("/api/admin/link-requests", { params });
  const items = Array.isArray(response.data) ? response.data : [];
  return { items };
}

export async function approveAdminLinkRequest(id, payload) {
  const response = await api.post(`/api/admin/link-requests/${id}/approve`, payload);
  return { data: response.data };
}

export async function rejectAdminLinkRequest(id, payload) {
  const response = await api.post(`/api/admin/link-requests/${id}/reject`, payload);
  return { data: response.data };
}

export async function fetchMyTickets(params = { page: 0, size: 20 }) {
  const response = await api.get("/api/tickets/my", { params });
  return { ...fromPagePayload(response.data, params.size), isFallback: false };
}

export async function fetchAssignedTickets(params = { page: 0, size: 20 }) {
  const response = await api.get("/api/tickets/assigned", { params });
  return { ...fromPagePayload(response.data, params.size), isFallback: false };
}

export async function fetchAssignedTicketVisits() {
  const response = await api.get("/api/tickets/assigned/visits");
  const items = Array.isArray(response.data) ? response.data : [];
  return { items };
}

export async function addTicketVisitEvent(ticketId, payload) {
  const response = await api.post(`/api/tickets/${ticketId}/visits`, payload);
  return { data: response.data };
}

export async function fetchAdminTickets(params = { page: 0, size: 20 }, status) {
  const query = { ...params };
  if (status) query.status = status;
  const response = await api.get("/api/admin/tickets", { params: query });
  return { ...fromPagePayload(response.data, params.size), isFallback: false };
}

export async function createTicket(formData) {
  const response = await api.post("/api/tickets", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return { data: response.data };
}

export async function assignTicket(ticketId, payload) {
  const response = await api.patch(`/api/admin/tickets/${ticketId}/assign`, payload);
  return { data: response.data };
}

export async function updateTicketStatus(ticketId, payload) {
  const response = await api.patch(`/api/tickets/${ticketId}/status`, payload);
  return { data: response.data };
}

export async function addTicketResolutionNotes(ticketId, payload) {
  const response = await api.patch(`/api/tickets/${ticketId}/resolution`, payload);
  return { data: response.data };
}

export async function addTicketComment(ticketId, payload) {
  const response = await api.post(`/api/tickets/${ticketId}/comments`, payload);
  return { data: response.data };
}

export async function updateTicketComment(ticketId, commentId, payload) {
  const response = await api.put(`/api/tickets/${ticketId}/comments/${commentId}`, payload);
  return { data: response.data };
}

export async function deleteTicketComment(ticketId, commentId) {
  await api.delete(`/api/tickets/${ticketId}/comments/${commentId}`);
}

export async function fetchMyNotifications(params = { page: 0, size: 50 }, options = {}) {
  const query = { ...params };
  if (options.unreadOnly) {
    query.unreadOnly = true;
  }
  const response = await api.get("/api/notifications/my", { params: query });
  return { ...fromPagePayload(response.data, params.size), isFallback: false };
}

export async function fetchUnreadNotificationCount() {
  const response = await api.get("/api/notifications/my/unread-count");
  return { count: Number(response?.data?.count ?? 0) };
}

export async function fetchCampusEvents(params = { page: 0, size: 50 }, options = {}) {
  const query = { ...params };
  if (options.mineOnly) {
    query.mineOnly = true;
  }
  const response = await api.get("/api/events", { params: query });
  return { ...fromPagePayload(response.data, params.size), isFallback: false };
}

export async function createCampusEvent(payload) {
  const response = await api.post("/api/events", payload);
  return { data: response.data };
}

export async function updateCampusEventStatus(eventId, payload) {
  const response = await api.patch(`/api/events/${eventId}/status`, payload);
  return { data: response.data };
}

export async function requestEventEnrollment(eventId, payload = {}) {
  const response = await api.post(`/api/events/${eventId}/enrollments`, payload);
  return { data: response.data };
}

export async function fetchMyEventEnrollments(params = { page: 0, size: 100 }) {
  const response = await api.get("/api/events/enrollments/my", { params });
  return { ...fromPagePayload(response.data, params.size), isFallback: false };
}

export async function fetchEventEnrollments(eventId) {
  const response = await api.get(`/api/events/${eventId}/enrollments`);
  const items = Array.isArray(response.data) ? response.data : [];
  return { items };
}

export async function reviewEventEnrollment(eventId, enrollmentId, payload) {
  const response = await api.patch(`/api/events/${eventId}/enrollments/${enrollmentId}/status`, payload);
  return { data: response.data };
}

export async function markNotificationRead(id) {
  const response = await api.patch(`/api/notifications/${id}/read`);
  emitNotificationsChanged();
  return { data: response.data };
}

export async function markAllNotificationsRead() {
  const response = await api.patch("/api/notifications/read-all");
  emitNotificationsChanged();
  return { data: response.data };
}
