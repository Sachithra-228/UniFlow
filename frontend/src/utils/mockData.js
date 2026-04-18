const now = new Date();
const twoHours = 2 * 60 * 60 * 1000;

let mockUsers = [
  {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    role: "STUDENT",
    provider: "google",
    providerId: "mock-001",
  },
  {
    id: 2,
    name: "Admin User",
    email: "admin@smartcampus.edu",
    role: "ADMIN",
    provider: "local",
    providerId: "local-admin",
  },
];

let mockResources = [
  {
    id: 1,
    name: "Innovation Lab 2A",
    type: "LAB",
    capacity: 30,
    location: "Engineering Block - L2",
    status: "AVAILABLE",
    createdAt: now.toISOString(),
  },
  {
    id: 2,
    name: "Seminar Hall West",
    type: "ROOM",
    capacity: 120,
    location: "Admin Complex - Ground",
    status: "IN_USE",
    createdAt: now.toISOString(),
  },
  {
    id: 3,
    name: "AR/VR Rig Set",
    type: "EQUIPMENT",
    capacity: 4,
    location: "Media Center",
    status: "MAINTENANCE",
    createdAt: now.toISOString(),
  },
];

let mockBookings = [
  {
    id: 1,
    userId: 1,
    userName: "Test User",
    resourceId: 1,
    resourceName: "Innovation Lab 2A",
    startTime: new Date(now.getTime() + twoHours).toISOString(),
    endTime: new Date(now.getTime() + twoHours * 2).toISOString(),
    status: "APPROVED",
    purpose: "Robotics sprint demo rehearsal",
  },
];

const mockProfile = {
  id: 1,
  email: "test@example.com",
  name: "Demo OAuth User",
  role: "USER",
  provider: "google",
  providerId: "mock-google-subject",
};

export function getMockUsers() {
  return [...mockUsers];
}

export function getMockResources() {
  return [...mockResources];
}

export function getMockBookings() {
  return [...mockBookings];
}

export function getMockProfile() {
  return { ...mockProfile };
}

export function addMockResource(payload) {
  const newResource = {
    ...payload,
    id: mockResources.length ? Math.max(...mockResources.map((item) => item.id)) + 1 : 1,
    createdAt: new Date().toISOString(),
  };
  mockResources = [newResource, ...mockResources];
  return newResource;
}

export function addMockBooking(payload) {
  const user = mockUsers.find((item) => item.id === Number(payload.userId));
  const resource = mockResources.find((item) => item.id === Number(payload.resourceId));

  const newBooking = {
    ...payload,
    id: mockBookings.length ? Math.max(...mockBookings.map((item) => item.id)) + 1 : 1,
    userId: Number(payload.userId),
    resourceId: Number(payload.resourceId),
    userName: user?.name ?? "Unknown User",
    resourceName: resource?.name ?? "Unknown Resource",
    status: "PENDING",
  };

  mockBookings = [newBooking, ...mockBookings];
  return newBooking;
}

export function updateMockBooking(id, payload) {
  const bookingId = Number(id);
  const user = mockUsers.find((item) => item.id === Number(payload.userId));
  const resource = mockResources.find((item) => item.id === Number(payload.resourceId));

  let updatedBooking = null;
  mockBookings = mockBookings.map((booking) => {
    if (booking.id !== bookingId) {
      return booking;
    }

    updatedBooking = {
      ...booking,
      ...payload,
      userId: Number(payload.userId),
      resourceId: Number(payload.resourceId),
      userName: user?.name ?? booking.userName,
      resourceName: resource?.name ?? booking.resourceName,
    };
    return updatedBooking;
  });

  return updatedBooking;
}

export function deleteMockBooking(id) {
  const bookingId = Number(id);
  const before = mockBookings.length;
  mockBookings = mockBookings.filter((booking) => booking.id !== bookingId);
  return before !== mockBookings.length;
}
