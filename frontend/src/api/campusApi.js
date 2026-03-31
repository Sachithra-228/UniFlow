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

export function getGoogleLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/google`;
}
