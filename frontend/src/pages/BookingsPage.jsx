import axios from "axios";
import { Filter, Plus, QrCode, ScanLine, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createBooking,
  fetchBookingCheckInQr,
  fetchBookings,
  fetchProfile,
  fetchResources,
  fetchUsers,
  scanBookingCheckIn,
  updateBookingStatus,
} from "../api/campusApi";
import { API_BASE_URL } from "../api/client";
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

const BOOKING_CARD_PALETTE = [
  "bg-gradient-to-br from-blue-300/42 via-blue-200/32 to-blue-50/90 dark:from-blue-800/50 dark:via-blue-900/30 dark:to-[color:var(--bg-soft)]/90",
  "bg-gradient-to-br from-violet-300/40 via-violet-200/30 to-violet-50/90 dark:from-violet-800/48 dark:via-violet-900/28 dark:to-[color:var(--bg-soft)]/90",
  "bg-gradient-to-br from-fuchsia-300/40 via-fuchsia-200/30 to-fuchsia-50/90 dark:from-fuchsia-800/48 dark:via-fuchsia-900/28 dark:to-[color:var(--bg-soft)]/90",
  "bg-gradient-to-br from-teal-300/40 via-teal-200/30 to-teal-50/90 dark:from-teal-800/48 dark:via-teal-900/28 dark:to-[color:var(--bg-soft)]/90",
  "bg-gradient-to-br from-cyan-300/40 via-cyan-200/30 to-cyan-50/90 dark:from-cyan-800/48 dark:via-cyan-900/28 dark:to-[color:var(--bg-soft)]/90",
  "bg-gradient-to-br from-indigo-300/40 via-indigo-200/30 to-indigo-50/90 dark:from-indigo-800/48 dark:via-indigo-900/28 dark:to-[color:var(--bg-soft)]/90",
  "bg-gradient-to-br from-pink-300/40 via-pink-200/30 to-pink-50/90 dark:from-pink-800/48 dark:via-pink-900/28 dark:to-[color:var(--bg-soft)]/90",
  "bg-gradient-to-br from-emerald-300/40 via-emerald-200/30 to-emerald-50/90 dark:from-emerald-800/48 dark:via-emerald-900/28 dark:to-[color:var(--bg-soft)]/90",
];

function getBookingCardStyle(item) {
  const index = Math.abs(Number(item?.id) || 0) % BOOKING_CARD_PALETTE.length;
  return BOOKING_CARD_PALETTE[index];
}

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
  const [viewMode, setViewMode] = useState("table");
  const [scanPayload, setScanPayload] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrBooking, setQrBooking] = useState(null);
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

  const canModerateBookings = role === "ADMIN" || role === "STAFF";
  const canScanCheckIn = canModerateBookings;

  const filteredBookings = useMemo(() => {
    const scopedBookings =
      canModerateBookings || !currentUser?.id
        ? bookings
        : bookings.filter((item) => Number(item.userId) === Number(currentUser.id));

    return scopedBookings.filter((item) => {
      const text = [item.userName, item.resourceName, item.purpose ?? ""].join(" ").toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [bookings, canModerateBookings, currentUser?.id, query, statusFilter]);

  function handleInput(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function canShowQr(item) {
    if (item.status !== "APPROVED") return false;
    if (canModerateBookings) return true;
    if (!currentUser?.id) return false;
    return Number(item.userId) === Number(currentUser.id);
  }

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

  async function handleOpenQr(item) {
    setQrModalOpen(true);
    setQrBooking(item);
    setQrData(null);
    setQrLoading(true);

    try {
      const response = await fetchBookingCheckInQr(item.id);
      setQrData(response.data);
    } catch (error) {
      const status = error?.response?.status;
      const messageFromApi = error?.response?.data?.message;
      const notUpdatedBackend =
        status === 404 && (messageFromApi === "Resource not found" || messageFromApi === "Not Found");

      setQrModalOpen(false);
      addToast({
        type: "error",
        title: "QR unavailable",
        message: notUpdatedBackend
          ? `QR endpoint is missing on API ${API_BASE_URL}. Restart backend with latest code or update VITE_API_BASE_URL.`
          : messageFromApi || "Unable to load booking QR code.",
      });
    } finally {
      setQrLoading(false);
    }
  }

  async function handleScanCheckIn(event) {
    event.preventDefault();
    const payload = scanPayload.trim();
    if (!payload) {
      addToast({ type: "error", title: "Validation error", message: "Enter scanned QR payload before submitting." });
      return;
    }

    setScanLoading(true);
    try {
      const response = await scanBookingCheckIn({ qrPayload: payload });
      const result = response.data;
      setBookings((current) =>
        current.map((booking) => (booking.id === result.booking.id ? result.booking : booking))
      );
      setScanPayload("");

      addToast({
        type: "success",
        title: result.alreadyCheckedIn ? "Attendance already marked" : "Attendance marked",
        message: result.alreadyCheckedIn
          ? "This booking has already been checked in."
          : `Checked in ${result.booking.userName} for ${result.booking.resourceName}.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Scan failed",
        message: error?.response?.data?.message || "Unable to process check-in QR.",
      });
    } finally {
      setScanLoading(false);
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
                placeholder={canModerateBookings ? "Search by user, resource, purpose" : "Search by resource or purpose"}
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

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setViewMode((prev) => (prev === "table" ? "cards" : "table"))}>
              <Filter className="h-4 w-4" />
              {viewMode === "table" ? "Card View" : "Table View"}
            </Button>
            <Button onClick={() => setOpenModal(true)}>
              <Plus className="h-4 w-4" />
              Create Booking
            </Button>
          </div>
        </div>
      </Card>

      {canScanCheckIn ? (
        <Card className="p-4 md:p-5">
          <form className="flex flex-col gap-3 md:flex-row md:items-end" onSubmit={handleScanCheckIn}>
            <FormField label="QR Scanner Input" className="flex-1">
              <input
                value={scanPayload}
                onChange={(event) => setScanPayload(event.target.value)}
                placeholder="Paste scanned QR payload (example: SCBK-CHECKIN:...)"
                className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
              />
            </FormField>
            <Button type="submit" loading={scanLoading}>
              <ScanLine className="h-4 w-4" />
              Scan & Mark Attendance
            </Button>
          </form>
        </Card>
      ) : null}

      <Card className="p-4 md:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState title="No booking records" description="Bookings will appear here when users reserve rooms, labs, or equipment." />
        ) : viewMode === "table" ? (
          <BookingsTable
            bookings={filteredBookings}
            canModerateBookings={canModerateBookings}
            updatingBookingId={updatingBookingId}
            canShowQr={canShowQr}
            onShowQr={handleOpenQr}
            onStatusUpdate={handleStatusUpdate}
          />
        ) : (
          <BookingsCards
            bookings={filteredBookings}
            canModerateBookings={canModerateBookings}
            updatingBookingId={updatingBookingId}
            canShowQr={canShowQr}
            onShowQr={handleOpenQr}
            onStatusUpdate={handleStatusUpdate}
          />
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

      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={qrBooking ? `Booking #${qrBooking.id} Check-in QR` : "Check-in QR"}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setQrModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {qrLoading ? (
          <LoadingSkeleton className="h-64 rounded-xl" />
        ) : qrData ? (
          <div className="space-y-3">
            <div className="flex justify-center rounded-2xl border border-[color:var(--border)] bg-white p-3">
              <img src={qrData.qrImageDataUri} alt="Booking check-in QR code" className="h-64 w-64 max-w-full object-contain" />
            </div>
            <p className="text-xs text-[color:var(--text-muted)] break-all">
              Payload: <span className="font-semibold text-[color:var(--text)]">{qrData.qrPayload}</span>
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              Valid window: {formatDateTime(qrData.validFrom)} to {formatDateTime(qrData.validUntil)}
            </p>
          </div>
        ) : (
          <EmptyState title="QR not available" description="Could not load QR code for this booking." />
        )}
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

function BookingsTable({ bookings, canModerateBookings, updatingBookingId, canShowQr, onShowQr, onStatusUpdate }) {
  return (
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
          {bookings.map((item) => (
            <tr key={item.id}>
              <td className="py-3 font-semibold">{item.userName}</td>
              <td className="py-3">{item.resourceName}</td>
              <td className="py-3 text-xs">{formatDateTime(item.startTime)}</td>
              <td className="py-3 text-xs">{formatDateTime(item.endTime)}</td>
              <td className="py-3 text-xs text-[color:var(--text-muted)]">{item.purpose}</td>
              <td className="py-3">
                <Badge value={item.status} />
                {item.checkedInAt ? (
                  <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                    Checked in: {formatDateTime(item.checkedInAt)}
                  </p>
                ) : null}
                {canShowQr(item) ? (
                  <button
                    type="button"
                    onClick={() => onShowQr(item)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--brand)] hover:underline"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Show QR
                  </button>
                ) : null}
              </td>
              {canModerateBookings ? (
                <td className="py-3">
                  {item.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        loading={updatingBookingId === item.id}
                        onClick={() => onStatusUpdate(item.id, "APPROVED")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={updatingBookingId === item.id}
                        onClick={() => onStatusUpdate(item.id, "REJECTED")}
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
  );
}

function BookingsCards({ bookings, canModerateBookings, updatingBookingId, canShowQr, onShowQr, onStatusUpdate }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {bookings.map((item) => {
        const cardBg = getBookingCardStyle(item);
        return (
          <article key={item.id} className={`rounded-2xl border border-[color:var(--border)] p-4 ${cardBg}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold">{item.userName}</p>
                <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">{item.resourceName}</p>
              </div>
              <Badge value={item.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p className="text-[color:var(--text-muted)]">
                Start: <span className="font-semibold text-[color:var(--text)]">{formatDateTime(item.startTime)}</span>
              </p>
              <p className="text-[color:var(--text-muted)]">
                End: <span className="font-semibold text-[color:var(--text)]">{formatDateTime(item.endTime)}</span>
              </p>
              <p className="text-[color:var(--text-muted)]">
                Purpose: <span className="font-semibold text-[color:var(--text)]">{item.purpose}</span>
              </p>
              {item.checkedInAt ? (
                <p className="text-emerald-700 dark:text-emerald-300">
                  Attendance: <span className="font-semibold">Checked in at {formatDateTime(item.checkedInAt)}</span>
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-[color:var(--border)] pt-3">
              {canShowQr(item) ? (
                <Button size="sm" variant="secondary" onClick={() => onShowQr(item)}>
                  <QrCode className="h-4 w-4" />
                  Show QR
                </Button>
              ) : null}
            </div>

            {canModerateBookings ? (
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-[color:var(--border)] pt-3">
                {item.status === "PENDING" ? (
                  <>
                    <Button
                      size="sm"
                      loading={updatingBookingId === item.id}
                      onClick={() => onStatusUpdate(item.id, "APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={updatingBookingId === item.id}
                      onClick={() => onStatusUpdate(item.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-[color:var(--text-muted)]">No action</span>
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export default BookingsPage;
