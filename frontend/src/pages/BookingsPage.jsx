import axios from "axios";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createBooking,
  deleteBooking,
  fetchBookings,
  fetchProfile,
  fetchResources,
  fetchUsers,
  updateBooking,
  updateBookingStatus,
} from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import Modal from "../components/common/Modal";
import { useToast } from "../hooks/useToast";
import { BOOKING_STATUSES } from "../utils/constants";
import { formatDateTime, titleCase } from "../utils/format";
import { normalizeRole } from "../utils/roles";

const initialForm = {
  userId: "",
  resourceId: "",
  startTime: "",
  endTime: "",
  purpose: "",
};

function BookingsPage() {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState(initialForm);
  const [role, setRole] = useState("STUDENT");
  const { addToast } = useToast();

  useEffect(() => {
    const statusFromQuery = searchParams.get("status");
    const normalizedStatus = statusFromQuery ? statusFromQuery.toUpperCase() : "";
    const isKnownStatus = BOOKING_STATUSES.includes(normalizedStatus);

    if (isKnownStatus) {
      setStatusFilter(normalizedStatus);
      return;
    }

    if (statusFromQuery === null) {
      setStatusFilter("ALL");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bookingsData, usersData, resourcesData, profileData] = await Promise.all([
          fetchBookings({ page: 0, size: 300 }),
          fetchUsers({ page: 0, size: 300 }),
          fetchResources({ page: 0, size: 300 }),
          fetchProfile(),
        ]);

        const resolvedRole = normalizeRole(profileData?.data?.role) ?? "STUDENT";
        const profileUser = profileData?.data ?? null;

        setBookings(bookingsData.items);
        setResources(resourcesData.items);
        setRole(resolvedRole);
        setCurrentUser(profileUser);
        setUsers(
          resolvedRole === "ADMIN" || resolvedRole === "STAFF"
            ? usersData.items
            : profileUser
              ? [{ id: profileUser.id, name: profileUser.name, email: profileUser.email }]
              : []
        );

        if (resolvedRole !== "ADMIN" && resolvedRole !== "STAFF" && profileUser?.id) {
          setForm((current) => ({ ...current, userId: String(profileUser.id) }));
        }
      } catch {
        addToast({
          type: "error",
          title: "Bookings unavailable",
          message: "Unable to load booking records. Please retry.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      const text = [item.userName, item.resourceName, item.purpose ?? ""].join(" ").toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [bookings, query, statusFilter]);

  const bookingSummary = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((item) => item.status === "PENDING").length,
      approved: bookings.filter((item) => item.status === "APPROVED").length,
      rejected: bookings.filter((item) => item.status === "REJECTED").length,
    }),
    [bookings]
  );

  const canModerateBookings = role === "ADMIN" || role === "STAFF";

  function handleInput(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: undefined }));
  }

  function validateBookingForm(values) {
    const errors = {};
    const resolvedUserId = Number(values.userId);
    const resolvedResourceId = Number(values.resourceId);
    const trimmedPurpose = values.purpose.trim();

    if (!resolvedUserId) {
      errors.userId = "Select a user before submitting.";
    }

    if (!resolvedResourceId) {
      errors.resourceId = "Select a resource.";
    }

    const startDate = values.startTime ? new Date(values.startTime) : null;
    const endDate = values.endTime ? new Date(values.endTime) : null;

    if (!values.startTime) {
      errors.startTime = "Start time is required.";
    } else if (!startDate || Number.isNaN(startDate.getTime())) {
      errors.startTime = "Enter a valid start time.";
    }

    if (!values.endTime) {
      errors.endTime = "End time is required.";
    } else if (!endDate || Number.isNaN(endDate.getTime())) {
      errors.endTime = "Enter a valid end time.";
    }

    if (!errors.startTime && !errors.endTime && endDate <= startDate) {
      errors.endTime = "End time must be after the start time.";
    }

    if (!trimmedPurpose) {
      errors.purpose = "Purpose is required.";
    }

    return {
      errors,
      payload: {
        ...values,
        userId: resolvedUserId,
        resourceId: resolvedResourceId,
        purpose: trimmedPurpose,
      },
    };
  }

  function resetFormState() {
    setForm(
      canModerateBookings
        ? initialForm
        : { ...initialForm, userId: currentUser?.id ? String(currentUser.id) : "" }
    );
    setFormErrors({});
    setEditingBookingId(null);
  }

  function handleOpenCreateModal() {
    resetFormState();
    setOpenModal(true);
  }

  function canManageBooking(item) {
    return item.status === "PENDING";
  }

  function handleEditBooking(item) {
    if (!canManageBooking(item)) return;
    setEditingBookingId(item.id);
    setForm({
      userId: String(item.userId ?? ""),
      resourceId: String(item.resourceId ?? ""),
      startTime: normalizeDateLocalValue(item.startTime),
      endTime: normalizeDateLocalValue(item.endTime),
      purpose: item.purpose ?? "",
    });
    setFormErrors({});
    setOpenModal(true);
  }

  async function handleDeleteBooking(bookingId) {
    const confirmed = window.confirm("Delete this booking request?");
    if (!confirmed) return;

    setDeletingBookingId(bookingId);
    try {
      await deleteBooking(bookingId);
      setBookings((current) => current.filter((booking) => booking.id !== bookingId));
      addToast({ type: "success", title: "Booking deleted", message: "Booking removed successfully." });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setBookings((current) => current.filter((booking) => booking.id !== bookingId));
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

  async function handleStatusUpdate(bookingId, status) {
    setUpdatingBookingId(bookingId);
    try {
      const response = await updateBookingStatus(bookingId, { status });
      setBookings((current) => current.map((booking) => (booking.id === bookingId ? response.data : booking)));
      addToast({ type: "success", title: "Booking updated", message: `Booking marked as ${titleCase(status)}.` });
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        message: error?.response?.data?.message || "Unable to update booking status.",
      });
    } finally {
      setUpdatingBookingId(null);
    }
  }

  async function handleCreateBooking(event) {
    event.preventDefault();
    const activeEditingBookingId = editingBookingId;
    const { errors, payload } = validateBookingForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast({ type: "error", title: "Validation error", message: "Please fix the highlighted fields." });
      return;
    }

    setSubmitting(true);
    try {
      const response = activeEditingBookingId
        ? await updateBooking(activeEditingBookingId, payload)
        : await createBooking(payload);

      if (activeEditingBookingId) {
        setBookings((current) => current.map((booking) => (booking.id === activeEditingBookingId ? response.data : booking)));
      } else {
        setBookings((current) => [response.data, ...current]);
      }

      resetFormState();
      setOpenModal(false);
      addToast({
        type: "success",
        title: activeEditingBookingId ? "Booking updated" : "Booking submitted",
        message: activeEditingBookingId ? "Booking updated successfully." : "Booking request created successfully.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: activeEditingBookingId ? "Update failed" : "Booking failed",
        message: error?.response?.data?.message || "Could not save booking request.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const minDateTimeLocal = useMemo(() => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  }, []);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-[color:var(--border)] bg-gradient-to-r from-[color:var(--brand)]/10 via-[color:var(--brand-soft)]/30 to-transparent px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">Booking Intelligence</p>
              <h2 className="mt-1 text-xl font-bold">Resource Reservations</h2>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">Manage requests, monitor statuses, and update schedules quickly.</p>
            </div>
            <Button
              onClick={handleOpenCreateModal}
              className="bg-gradient-to-r from-[color:var(--brand)] to-blue-600 text-white shadow-md hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Create Booking
            </Button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-[color:var(--border)] bg-white/50 px-4 py-4 md:grid-cols-4 md:px-6 dark:bg-[color:var(--bg-soft)]/30">
          <SummaryPill label="Total" value={bookingSummary.total} />
          <SummaryPill label="Pending" value={bookingSummary.pending} tone="warn" />
          <SummaryPill label="Approved" value={bookingSummary.approved} tone="success" />
          <SummaryPill label="Rejected" value={bookingSummary.rejected} tone="danger" />
        </div>

        <div className="p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row">
              <label className="flex flex-1 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 shadow-sm dark:bg-[color:var(--bg-soft)]/80">
                <Search className="h-4 w-4 text-[color:var(--text-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by user, resource, purpose"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]/70"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm outline-none shadow-sm dark:bg-[color:var(--bg-soft)]/80"
              >
                <option value="ALL">All Status</option>
                {BOOKING_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {titleCase(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState title="No booking records" description="Bookings will appear here when users reserve rooms, labs, or equipment." />
        ) : (
          <>
            <div className="fine-scrollbar hidden overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/70 shadow-sm dark:bg-[color:var(--bg-soft)]/70 md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[color:var(--bg-soft)]/70 text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {filteredBookings.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-[color:var(--bg-soft)]/40">
                      <td className="px-4 py-3 font-semibold">{item.userName}</td>
                      <td className="px-4 py-3">{item.resourceName}</td>
                      <td className="px-4 py-3 text-xs">{formatDateTime(item.startTime)}</td>
                      <td className="px-4 py-3 text-xs">{formatDateTime(item.endTime)}</td>
                      <td className="px-4 py-3 text-xs text-[color:var(--text-muted)]">{item.purpose}</td>
                      <td className="px-4 py-3"><Badge value={item.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canManageBooking(item) ? (
                            <>
                              <button
                                type="button"
                                aria-label="Edit booking"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300"
                                onClick={() => handleEditBooking(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Delete booking"
                                disabled={deletingBookingId === item.id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                                onClick={() => handleDeleteBooking(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : null}

                          {canModerateBookings && item.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                loading={updatingBookingId === item.id}
                                className="bg-emerald-600 text-white hover:bg-emerald-500"
                                onClick={() => handleStatusUpdate(item.id, "APPROVED")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                loading={updatingBookingId === item.id}
                                className="bg-rose-600 text-white hover:bg-rose-500"
                                onClick={() => handleStatusUpdate(item.id, "REJECTED")}
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {filteredBookings.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4 shadow-sm dark:bg-[color:var(--bg-soft)]/80">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{item.resourceName}</p>
                      <p className="text-xs text-[color:var(--text-muted)]">{item.userName}</p>
                    </div>
                    <Badge value={item.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[color:var(--text-muted)]">Start</p>
                      <p className="font-semibold">{formatDateTime(item.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-[color:var(--text-muted)]">End</p>
                      <p className="font-semibold">{formatDateTime(item.endTime)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[color:var(--text-muted)]">Purpose</p>
                      <p className="font-semibold">{item.purpose}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {canManageBooking(item) ? (
                      <>
                        <button
                          type="button"
                          aria-label="Edit booking"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300"
                          onClick={() => handleEditBooking(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete booking"
                          disabled={deletingBookingId === item.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                          onClick={() => handleDeleteBooking(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}

                    {canModerateBookings && item.status === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          loading={updatingBookingId === item.id}
                          className="bg-emerald-600 text-white hover:bg-emerald-500"
                          onClick={() => handleStatusUpdate(item.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          loading={updatingBookingId === item.id}
                          className="bg-rose-600 text-white hover:bg-rose-500"
                          onClick={() => handleStatusUpdate(item.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          resetFormState();
        }}
        title={editingBookingId ? "Edit Booking Request" : "Create Booking Request"}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setOpenModal(false);
                resetFormState();
              }}
            >
              Cancel
            </Button>
            <Button
              form="booking-form"
              type="submit"
              loading={submitting}
              className="bg-gradient-to-r from-[color:var(--brand)] to-blue-600 text-white"
            >
              {editingBookingId ? "Save Changes" : "Submit Booking"}
            </Button>
          </div>
        }
      >
        <form id="booking-form" className="grid gap-4 lg:grid-cols-2" onSubmit={handleCreateBooking}>
          {canModerateBookings ? (
            <FormField label="User">
              <select
                name="userId"
                value={form.userId}
                onChange={handleInput}
                className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 pr-10 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {formErrors.userId ? <p className="mt-1 text-xs text-red-600">{formErrors.userId}</p> : null}
            </FormField>
          ) : (
            <FormField label="User">
              <input
                value={currentUser ? `${currentUser.name} (${currentUser.email})` : "Loading profile..."}
                readOnly
                className="w-full rounded-xl border border-[color:var(--border)] bg-white/60 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/60"
              />
            </FormField>
          )}

          <FormField label="Resource">
            <select
              name="resourceId"
              value={form.resourceId}
              onChange={handleInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 pr-10 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              <option value="">Select resource</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
            {formErrors.resourceId ? <p className="mt-1 text-xs text-red-600">{formErrors.resourceId}</p> : null}
          </FormField>

          <FormField label="Start Time">
            <input
              type="datetime-local"
              name="startTime"
              value={form.startTime}
              onChange={handleInput}
              min={minDateTimeLocal}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {formErrors.startTime ? <p className="mt-1 text-xs text-red-600">{formErrors.startTime}</p> : null}
          </FormField>

          <FormField label="End Time">
            <input
              type="datetime-local"
              name="endTime"
              value={form.endTime}
              onChange={handleInput}
              min={form.startTime || minDateTimeLocal}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {formErrors.endTime ? <p className="mt-1 text-xs text-red-600">{formErrors.endTime}</p> : null}
          </FormField>

          <FormField label="Purpose" className="lg:col-span-2">
            <textarea
              name="purpose"
              value={form.purpose}
              onChange={handleInput}
              rows={4}
              placeholder="Explain why this booking is required"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {formErrors.purpose ? <p className="mt-1 text-xs text-red-600">{formErrors.purpose}</p> : null}
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

function SummaryPill({ label, value, tone = "default" }) {
  const toneClasses = {
    default: "border-[color:var(--border)] bg-white/85 text-[color:var(--text)] dark:bg-[color:var(--bg-soft)]/80",
    warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    danger: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-300",
  };

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function normalizeDateLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

export default BookingsPage;
