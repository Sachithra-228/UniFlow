import axios from "axios";
import { BellRing, CalendarClock, ClipboardList, Pencil, Trash2, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { deleteBooking, fetchBookings, fetchMyTickets, fetchProfile, fetchResources, updateBooking } from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import Modal from "../components/common/Modal";
import { useToast } from "../hooks/useToast";
import { formatDateTime } from "../utils/format";
import { normalizeRole } from "../utils/roles";

const initialEditForm = {
  resourceId: "",
  startTime: "",
  endTime: "",
  purpose: "",
};

function StudentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [role, setRole] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [savingBooking, setSavingBooking] = useState(false);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editErrors, setEditErrors] = useState({});
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileResponse, bookingsResponse, ticketsResponse, resourcesResponse] = await Promise.all([
          fetchProfile(),
          fetchBookings({ page: 0, size: 300 }),
          fetchMyTickets({ page: 0, size: 300 }),
          fetchResources({ page: 0, size: 300 }),
        ]);

        setProfile(profileResponse.data);
        setRole(normalizeRole(profileResponse.data?.role));
        setBookings(bookingsResponse.items);
        setResources(resourcesResponse.items);
        setTickets(ticketsResponse.items);

        if (bookingsResponse.isFallback || profileResponse.isFallback || ticketsResponse.isFallback || resourcesResponse.isFallback) {
          addToast({
            type: "info",
            title: "Fallback mode active",
            message: "Some dashboard data is using local fallback values.",
          });
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Student dashboard unavailable",
          message: error?.response?.data?.message || "Failed to load student dashboard data.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const myBookings = useMemo(() => {
    const profileId = Number(profile?.id);
    if (!Number.isFinite(profileId)) return [];

    return bookings
      .filter((booking) => Number(booking.userId) === profileId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [bookings, profile?.id]);

  const upcomingBookings = useMemo(() => {
    const now = Date.now();
    return myBookings.filter((booking) => new Date(booking.startTime).getTime() >= now);
  }, [myBookings]);

  const ticketSummary = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    }),
    [tickets]
  );

  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort(
          (a, b) =>
            new Date(b.updatedAt ?? b.createdAt ?? 0).getTime()
            - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
        )
        .slice(0, 4),
    [tickets]
  );

  const minDateTimeLocal = useMemo(() => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  }, []);

  function normalizeDateLocalValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  }

  function canManageBooking(booking) {
    const profileId = Number(profile?.id);
    return Number(booking.userId) === profileId && booking.status === "PENDING";
  }

  function validateEditForm(values) {
    const errors = {};
    const profileId = Number(profile?.id);
    const selectedResourceId = Number(values.resourceId);
    const purpose = values.purpose.trim();
    const start = values.startTime ? new Date(values.startTime) : null;
    const end = values.endTime ? new Date(values.endTime) : null;
    const now = Date.now();

    if (!selectedResourceId) {
      errors.resourceId = "Select a resource.";
    } else if (!resources.some((item) => Number(item.id) === selectedResourceId)) {
      errors.resourceId = "Selected resource is unavailable.";
    }

    if (!profileId) {
      errors.profile = "Your profile is unavailable. Refresh and try again.";
    }

    if (!values.startTime) {
      errors.startTime = "Start time is required.";
    } else if (!start || Number.isNaN(start.getTime())) {
      errors.startTime = "Enter a valid start time.";
    } else if (start.getTime() < now - 60 * 1000) {
      errors.startTime = "Start time must be now or later.";
    }

    if (!values.endTime) {
      errors.endTime = "End time is required.";
    } else if (!end || Number.isNaN(end.getTime())) {
      errors.endTime = "Enter a valid end time.";
    } else if (start && end <= start) {
      errors.endTime = "End time must be after start time.";
    }

    if (!purpose) {
      errors.purpose = "Purpose is required.";
    } else if (purpose.length < 5) {
      errors.purpose = "Purpose must be at least 5 characters.";
    } else if (purpose.length > 500) {
      errors.purpose = "Purpose must be 500 characters or fewer.";
    }

    return {
      errors,
      payload: {
        userId: profileId,
        resourceId: selectedResourceId,
        startTime: values.startTime,
        endTime: values.endTime,
        purpose,
      },
    };
  }

  function handleEditInput(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
    setEditErrors((current) => ({ ...current, [name]: undefined }));
  }

  function openEditModal(booking) {
    if (!canManageBooking(booking)) return;

    const matchedResource = resources.find((item) => Number(item.id) === Number(booking.resourceId))
      ?? resources.find((item) => item.name === booking.resourceName)
      ?? null;

    setEditingBookingId(booking.id);
    setEditForm({
      resourceId: String(matchedResource?.id ?? booking.resourceId ?? ""),
      startTime: normalizeDateLocalValue(booking.startTime),
      endTime: normalizeDateLocalValue(booking.endTime),
      purpose: booking.purpose ?? "",
    });
    setEditErrors({
      resourceId: matchedResource ? undefined : "This booking references an unavailable resource. Select another.",
    });
    setEditModalOpen(true);
  }

  async function handleSaveChanges(event) {
    event.preventDefault();
    const activeBookingId = editingBookingId;
    if (!activeBookingId) return;

    const { errors, payload } = validateEditForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast({ type: "error", title: "Validation error", message: "Please fix the highlighted fields." });
      return;
    }

    setSavingBooking(true);
    try {
      const response = await updateBooking(activeBookingId, payload);
      setBookings((current) =>
        current.map((booking) => (booking.id === activeBookingId ? response.data : booking))
      );
      setEditModalOpen(false);
      setEditingBookingId(null);
      setEditForm(initialEditForm);
      setEditErrors({});
      addToast({
        type: "success",
        title: "Booking updated",
        message: response.isFallback ? "Updated in local fallback mode." : "Booking request updated successfully.",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        addToast({
          type: "error",
          title: "Booking conflict",
          message: "Selected resource is already booked in this time window.",
        });
        return;
      }

      addToast({
        type: "error",
        title: "Update failed",
        message: error?.response?.data?.message || "Could not update booking.",
      });
    } finally {
      setSavingBooking(false);
    }
  }

  async function handleDeleteBooking(bookingId) {
    const confirmed = window.confirm("Delete this booking request?");
    if (!confirmed) return;

    setDeletingBookingId(bookingId);
    try {
      const response = await deleteBooking(bookingId);
      setBookings((current) => current.filter((booking) => booking.id !== bookingId));
      addToast({
        type: "success",
        title: "Booking deleted",
        message: response.isFallback ? "Deleted in local fallback mode." : "Booking removed successfully.",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setBookings((current) => current.filter((booking) => booking.id !== bookingId));
        addToast({
          type: "info",
          title: "Booking already removed",
          message: "This booking no longer exists on the server and was removed from the list.",
        });
        return;
      }

      addToast({
        type: "error",
        title: "Delete failed",
        message: error?.response?.data?.message || "Could not delete booking.",
      });
    } finally {
      setDeletingBookingId(null);
    }
  }

  if (role && role !== "STUDENT") {
    return <Navigate to="/dashboard" replace />;
  }

  // Welcome message based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="relative mx-auto max-w-[1240px] space-y-6 overflow-hidden animate-fadeIn">
      <div className="pointer-events-none absolute -left-28 -top-20 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-44 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Welcome Section */}
      <Card className="relative overflow-hidden border-[color:var(--border)] bg-gradient-to-r from-[color:var(--brand)]/10 via-sky-500/5 to-transparent p-5 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[color:var(--brand)]/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">
              Student Workspace
            </p>
            <h2 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
              {getGreeting()}, {profile?.firstName || profile?.name || "Student"}!
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--text-muted)] md:text-base">
              Welcome back to your learning hub. View your reservations, track support tickets,
              and manage your campus activities all in one place.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-semibold text-sky-700 dark:border-sky-800/70 dark:bg-sky-950/30 dark:text-sky-300">
                {myBookings.length} Bookings
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-semibold text-violet-700 dark:border-violet-800/70 dark:bg-violet-950/30 dark:text-violet-300">
                {ticketSummary.total} Tickets
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-300">
                {upcomingBookings.length} Upcoming
              </span>
            </div>
          </div>
          <div className="hidden rounded-2xl border border-[color:var(--border)] bg-white/70 px-4 py-3 text-right shadow-sm backdrop-blur lg:block dark:bg-[color:var(--bg-soft)]/70">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">Campus Pulse</p>
            <p className="mt-1 text-lg font-bold">Student Operations Hub</p>
            <p className="text-xs text-[color:var(--text-muted)]">Everything you need, one workspace</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-[112px] rounded-2xl" />
          ))
        ) : (
          <>
            <MetricCard
              title="My Bookings"
              value={myBookings.length}
              icon={CalendarClock}
              trend={myBookings.length > 0 ? "+ active" : "No bookings"}
              tone="blue"
              to="/bookings"
            />
            <MetricCard
              title="Upcoming"
              value={upcomingBookings.length}
              icon={CalendarClock}
              trend={upcomingBookings.length > 0 ? "Next 7 days" : "No upcoming"}
              tone="teal"
              to="/bookings"
            />
            <MetricCard
              title="My Tickets"
              value={ticketSummary.total}
              icon={ClipboardList}
              trend={`${ticketSummary.resolved} resolved`}
              tone="violet"
              to="/tickets"
            />
            <MetricCard
              title="Open Tickets"
              value={ticketSummary.open + ticketSummary.inProgress}
              icon={BellRing}
              trend="Need attention"
              alert={ticketSummary.open + ticketSummary.inProgress > 0}
              tone="rose"
              to="/tickets"
            />
          </>
        )}
      </div>

      {/* Bookings Section */}
      <Card className="border-[color:var(--border)] bg-white/85 p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:bg-[color:var(--bg-soft)]/70">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-[color:var(--brand)]" />
              My Bookings
            </h3>
            <p className="text-xs text-[color:var(--text-muted)] mt-1">
              Your upcoming and recent reservations
            </p>
          </div>
          <Link 
            to="/bookings" 
            className="text-sm font-semibold text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] transition-colors flex items-center gap-1 group whitespace-nowrap"
          >
            Open bookings
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : myBookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Create a booking request to start using campus resources. Click the button below to get started."
            action={
              <Link
                to="/bookings/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[color:var(--brand)] text-white rounded-lg hover:bg-[color:var(--brand-dark)] transition-colors"
              >
                <CalendarClock className="h-4 w-4" />
                Create Booking
              </Link>
            }
          />
        ) : (
          <>
            <div className="fine-scrollbar hidden overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/70 md:block dark:bg-[color:var(--bg-soft)]/70">
              <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)] border-b border-[color:var(--border)]">
                <tr>
                  <th className="pb-3 pl-2">Resource</th>
                  <th className="pb-3">Start</th>
                  <th className="pb-3">End</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {myBookings.slice(0, 6).map((booking) => (
                  <tr 
                    key={booking.id}
                    className="group transition-colors hover:bg-[color:var(--bg-soft)]/45"
                  >
                    <td className="py-3 pl-2 font-semibold group-hover:text-[color:var(--brand)] transition-colors">
                      {booking.resourceName}
                    </td>
                    <td className="py-3 text-xs text-[color:var(--text-muted)]">
                      {formatDateTime(booking.startTime)}
                    </td>
                    <td className="py-3 text-xs text-[color:var(--text-muted)]">
                      {formatDateTime(booking.endTime)}
                    </td>
                    <td className="py-3">
                      <Badge value={booking.status} />
                    </td>
                    <td className="py-3">
                      {canManageBooking(booking) ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Edit booking"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--border)] text-[color:var(--text-muted)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
                            onClick={() => openEditModal(booking)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete booking"
                            disabled={deletingBookingId === booking.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--border)] text-[color:var(--text-muted)] transition hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => handleDeleteBooking(booking.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[color:var(--text-muted)]">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <div className="space-y-3 md:hidden">
              {myBookings.slice(0, 6).map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4 shadow-sm dark:bg-[color:var(--bg-soft)]/80">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{booking.resourceName}</p>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">{booking.purpose || "No purpose"}</p>
                    </div>
                    <Badge value={booking.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[color:var(--text-muted)]">Start</p>
                      <p className="font-semibold">{formatDateTime(booking.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-[color:var(--text-muted)]">End</p>
                      <p className="font-semibold">{formatDateTime(booking.endTime)}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    {canManageBooking(booking) ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Edit booking"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300"
                          onClick={() => openEditModal(booking)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete booking"
                          disabled={deletingBookingId === booking.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                          onClick={() => handleDeleteBooking(booking.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[color:var(--text-muted)]">No action</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {myBookings.length > 6 ? (
              <div className="mt-4 text-center">
                <Link to="/bookings" className="text-sm text-[color:var(--brand)] hover:underline">
                  View all {myBookings.length} bookings →
                </Link>
              </div>
            ) : null}
          </>
        )}
      </Card>

      <Card className="border-[color:var(--border)] bg-white/85 p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:bg-[color:var(--bg-soft)]/70">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[color:var(--brand)]" />
              Recent Tickets
            </h3>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              Latest support requests and their current statuses.
            </p>
          </div>
          <Link
            to="/tickets"
            className="text-sm font-semibold text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] transition-colors"
          >
            Open tickets →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : recentTickets.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            description="Create a ticket to track maintenance or support requests."
          />
        ) : (
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border border-[color:var(--border)] bg-white/70 px-4 py-3 dark:bg-[color:var(--bg-soft)]/75"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">Ticket #{ticket.id}</p>
                  <div className="flex items-center gap-2">
                    <Badge value={ticket.status} />
                    <Badge value={ticket.priority} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-[color:var(--text-muted)] line-clamp-2">{ticket.description}</p>
                <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                  Updated: {formatDateTime(ticket.updatedAt ?? ticket.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          to="/bookings"
          icon={CalendarClock}
          title="My Bookings"
          subtitle="Create and monitor resource booking requests."
          color="blue"
        />
        <QuickAction
          to="/tickets"
          icon={ClipboardList}
          title="My Tickets"
          subtitle="Create and track your support ticket workflow."
          color="purple"
        />
        <QuickAction
          to="/notifications"
          icon={BellRing}
          title="Notifications"
          subtitle="Review platform alerts and activity notifications."
          color="orange"
        />
        <QuickAction
          to="/profile"
          icon={UserCircle2}
          title="My Profile"
          subtitle="Review your role, provider, and identity details."
          color="green"
        />
      </div>

      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingBookingId(null);
          setEditForm(initialEditForm);
          setEditErrors({});
        }}
        title="Edit Booking Request"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditModalOpen(false);
                setEditingBookingId(null);
                setEditForm(initialEditForm);
                setEditErrors({});
              }}
            >
              Cancel
            </Button>
            <Button form="student-booking-edit-form" type="submit" loading={savingBooking}>
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="student-booking-edit-form" className="grid gap-4 lg:grid-cols-2" onSubmit={handleSaveChanges}>
          <FormField label="Resource">
            <select
              name="resourceId"
              value={editForm.resourceId}
              onChange={handleEditInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 pr-10 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              <option value="">Select resource</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
            {editErrors.resourceId ? (
              <p className="mt-1 text-xs text-red-600">{editErrors.resourceId}</p>
            ) : null}
          </FormField>

          <div className="hidden lg:block" />

          <FormField label="Start Time">
            <input
              type="datetime-local"
              name="startTime"
              value={editForm.startTime}
              onChange={handleEditInput}
              min={minDateTimeLocal}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {editErrors.startTime ? (
              <p className="mt-1 text-xs text-red-600">{editErrors.startTime}</p>
            ) : null}
          </FormField>

          <FormField label="End Time">
            <input
              type="datetime-local"
              name="endTime"
              value={editForm.endTime}
              onChange={handleEditInput}
              min={editForm.startTime || minDateTimeLocal}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {editErrors.endTime ? (
              <p className="mt-1 text-xs text-red-600">{editErrors.endTime}</p>
            ) : null}
          </FormField>

          <FormField label="Purpose" className="lg:col-span-2">
            <textarea
              name="purpose"
              value={editForm.purpose}
              onChange={handleEditInput}
              rows={4}
              placeholder="Explain why this booking is required"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {editErrors.purpose ? (
              <p className="mt-1 text-xs text-red-600">{editErrors.purpose}</p>
            ) : null}
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

function FormField({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ title, value, icon: Icon, trend, alert, tone = "blue", to }) {
  const toneStyles = {
    blue: {
      card: "border-sky-200/70 bg-gradient-to-br from-sky-50 to-white dark:border-sky-900/40 dark:from-sky-950/20 dark:to-[color:var(--bg-soft)]",
      icon: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
      trend: "text-sky-700 dark:text-sky-300",
    },
    teal: {
      card: "border-cyan-200/70 bg-gradient-to-br from-cyan-50 to-white dark:border-cyan-900/40 dark:from-cyan-950/20 dark:to-[color:var(--bg-soft)]",
      icon: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
      trend: "text-cyan-700 dark:text-cyan-300",
    },
    violet: {
      card: "border-violet-200/70 bg-gradient-to-br from-violet-50 to-white dark:border-violet-900/40 dark:from-violet-950/20 dark:to-[color:var(--bg-soft)]",
      icon: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
      trend: "text-violet-700 dark:text-violet-300",
    },
    rose: {
      card: "border-rose-200/70 bg-gradient-to-br from-rose-50 to-white dark:border-rose-900/40 dark:from-rose-950/20 dark:to-[color:var(--bg-soft)]",
      icon: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
      trend: "text-rose-700 dark:text-rose-300",
    },
  };

  const resolvedTone = alert ? "rose" : tone;
  const palette = toneStyles[resolvedTone] || toneStyles.blue;

  const content = (
    <Card className={`border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${palette.card}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-semibold ${alert ? palette.trend : "text-[color:var(--text-muted)]"}`}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`rounded-xl p-2 ${palette.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

function QuickAction({ to, icon: Icon, title, subtitle, color }) {
  const colorClasses = {
    blue: 'hover:border-blue-300 dark:hover:border-blue-700',
    purple: 'hover:border-purple-300 dark:hover:border-purple-700',
    orange: 'hover:border-orange-300 dark:hover:border-orange-700',
    green: 'hover:border-green-300 dark:hover:border-green-700',
  };

  const iconBgColors = {
    blue: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
    green: 'bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400',
  };

  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-[color:var(--bg-soft)]/75 ${colorClasses[color]}`}
    >
      <span className={`rounded-lg p-2 transition-transform group-hover:scale-110 ${iconBgColors[color]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">
        <p className="font-semibold group-hover:text-[color:var(--brand)] transition-colors">
          {title}
        </p>
        <p className="text-xs text-[color:var(--text-muted)]">{subtitle}</p>
      </span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[color:var(--text-muted)]">
        →
      </span>
    </Link>
  );
}

export default StudentDashboardPage;