import axios from "axios";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createBooking,
  fetchBookings,
  fetchProfile,
  fetchResources,
  fetchUsers,
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

  function handleInput(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  const canModerateBookings = role === "ADMIN" || role === "STAFF";

  async function handleStatusUpdate(bookingId, status) {
    setUpdatingBookingId(bookingId);
    try {
      const response = await updateBookingStatus(bookingId, { status });
      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? response.data : booking))
      );
      addToast({
        type: "success",
        title: "Booking updated",
        message: `Booking marked as ${titleCase(status)}.`,
      });
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
    const resolvedUserId = canModerateBookings
      ? Number(form.userId)
      : Number(currentUser?.id);

    if (!resolvedUserId || !form.resourceId || !form.startTime || !form.endTime || !form.purpose.trim()) {
      addToast({ type: "error", title: "Validation error", message: "Complete all fields before submitting." });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        userId: resolvedUserId,
        resourceId: Number(form.resourceId),
      };

      const response = await createBooking(payload);
      setBookings((current) => [response.data, ...current]);
      setForm(
        canModerateBookings
          ? initialForm
          : { ...initialForm, userId: currentUser?.id ? String(currentUser.id) : "" }
      );
      setOpenModal(false);
      addToast({
        type: "success",
        title: "Booking submitted",
        message: response.isFallback ? "Saved in local fallback mode." : "Booking request created successfully.",
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
        title: "Booking failed",
        message: error?.response?.data?.message || "Could not create booking request.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 dark:bg-[color:var(--bg-soft)]/80">
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
              className="rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
            >
              <option value="ALL">All Status</option>
              {BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={() => setOpenModal(true)}>
            <Plus className="h-4 w-4" />
            Create Booking
          </Button>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState title="No booking records" description="Bookings will appear here when users reserve rooms, labs, or equipment." />
        ) : (
          <div className="fine-scrollbar overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                <tr>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Resource</th>
                  <th className="pb-3">Start</th>
                  <th className="pb-3">End</th>
                  <th className="pb-3">Purpose</th>
                  <th className="pb-3">Status</th>
                  {canModerateBookings ? <th className="pb-3">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {filteredBookings.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-semibold">{item.userName}</td>
                    <td className="py-3">{item.resourceName}</td>
                    <td className="py-3 text-xs">{formatDateTime(item.startTime)}</td>
                    <td className="py-3 text-xs">{formatDateTime(item.endTime)}</td>
                    <td className="py-3 text-xs text-[color:var(--text-muted)]">{item.purpose}</td>
                    <td className="py-3">
                      <Badge value={item.status} />
                    </td>
                    {canModerateBookings ? (
                      <td className="py-3">
                        {item.status === "PENDING" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              loading={updatingBookingId === item.id}
                              onClick={() => handleStatusUpdate(item.id, "APPROVED")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={updatingBookingId === item.id}
                              onClick={() => handleStatusUpdate(item.id, "REJECTED")}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-[color:var(--text-muted)]">No action</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Create Booking Request"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button form="booking-form" type="submit" loading={submitting}>
              Submit Booking
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
          </FormField>

          <FormField label="Start Time">
            <input
              type="datetime-local"
              name="startTime"
              value={form.startTime}
              onChange={handleInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
          </FormField>

          <FormField label="End Time">
            <input
              type="datetime-local"
              name="endTime"
              value={form.endTime}
              onChange={handleInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
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

export default BookingsPage;
