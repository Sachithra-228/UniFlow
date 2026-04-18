import { CalendarClock, CheckCircle2, Hourglass, Plus, Users, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createCampusEvent,
  fetchCampusEvents,
  fetchEventEnrollments,
  fetchMyEventEnrollments,
  fetchProfile,
  requestEventEnrollment,
  reviewEventEnrollment,
  updateCampusEventStatus,
} from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import Modal from "../components/common/Modal";
import { useToast } from "../hooks/useToast";
import { formatDateTime, titleCase } from "../utils/format";
import { normalizeRole } from "../utils/roles";

const initialEventForm = {
  title: "",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
  enrollmentDeadline: "",
  capacity: 30,
};

function isMissingEventsEndpoint(error) {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || "").toLowerCase();
  return status === 404 && (message.includes("resource not found") || message.includes("not found"));
}

function EnrollmentsPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("STUDENT");
  const [events, setEvents] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [eventsFeatureUnavailable, setEventsFeatureUnavailable] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [submitting, setSubmitting] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [manageModalEvent, setManageModalEvent] = useState(null);
  const [manageEnrollments, setManageEnrollments] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const { addToast } = useToast();

  const canManageEvents = role === "STAFF" || role === "ADMIN";
  const isStudent = role === "STUDENT";

  async function loadData() {
    setLoading(true);
    try {
      const profileResponse = await fetchProfile();
      const resolvedRole = normalizeRole(profileResponse?.data?.role) ?? "STUDENT";
      setRole(resolvedRole);
      setEventsFeatureUnavailable(false);

      const [eventResult, enrollmentResult] = await Promise.allSettled([
        fetchCampusEvents({ page: 0, size: 400 }, { mineOnly: resolvedRole === "STAFF" }),
        fetchMyEventEnrollments({ page: 0, size: 400 }),
      ]);

      if (eventResult.status === "fulfilled") {
        setEvents(eventResult.value.items);
      } else if (isMissingEventsEndpoint(eventResult.reason)) {
        setEventsFeatureUnavailable(true);
        setEvents([]);
      } else {
        throw eventResult.reason;
      }

      if (enrollmentResult.status === "fulfilled") {
        setMyEnrollments(enrollmentResult.value.items);
      } else if (isMissingEventsEndpoint(enrollmentResult.reason)) {
        setEventsFeatureUnavailable(true);
        setMyEnrollments([]);
      } else {
        throw enrollmentResult.reason;
      }

      if (
        (eventResult.status === "rejected" && isMissingEventsEndpoint(eventResult.reason)) ||
        (enrollmentResult.status === "rejected" && isMissingEventsEndpoint(enrollmentResult.reason))
      ) {
        addToast({
          type: "info",
          title: "Enrollments endpoint unavailable",
          message: "Running backend is missing /api/events endpoints. Restart backend using latest code.",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Enrollments unavailable",
        message: error?.response?.data?.message || "Unable to load event enrollments right now.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const enrollmentByEventId = useMemo(() => {
    const map = new Map();
    myEnrollments.forEach((item) => {
      map.set(Number(item.eventId), item);
    });
    return map;
  }, [myEnrollments]);

  const upcomingEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [events]);

  async function handleCreateEvent(event) {
    event.preventDefault();
    if (!eventForm.title.trim() || !eventForm.location.trim() || !eventForm.startsAt || !eventForm.endsAt) {
      addToast({
        type: "error",
        title: "Validation failed",
        message: "Title, location, start time, and end time are required.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...eventForm,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        location: eventForm.location.trim(),
        enrollmentDeadline: eventForm.enrollmentDeadline || null,
        capacity: Number(eventForm.capacity),
      };

      const response = await createCampusEvent(payload);
      setEvents((current) => [response.data, ...current]);
      setCreateModalOpen(false);
      setEventForm(initialEventForm);
      addToast({
        type: "success",
        title: "Event created",
        message: "Workshop/event has been published for enrollments.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Create failed",
        message: error?.response?.data?.message || "Unable to create event.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestEnrollment(eventItem) {
    const key = `enroll-${eventItem.id}`;
    setBusyKey(key);
    try {
      await requestEventEnrollment(eventItem.id, {});
      await loadData();
      addToast({
        type: "success",
        title: "Enrollment requested",
        message: "Your request has been sent to staff for approval.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Request failed",
        message: error?.response?.data?.message || "Unable to request enrollment.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleUpdateEventStatus(eventId, status) {
    const key = `event-status-${eventId}`;
    setBusyKey(key);
    try {
      const response = await updateCampusEventStatus(eventId, { status });
      setEvents((current) => current.map((item) => (item.id === eventId ? response.data : item)));
      addToast({
        type: "success",
        title: "Event updated",
        message: `Event marked as ${titleCase(status)}.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        message: error?.response?.data?.message || "Unable to update event.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function openManageModal(eventItem) {
    setManageModalEvent(eventItem);
    setManageLoading(true);
    try {
      const response = await fetchEventEnrollments(eventItem.id);
      setManageEnrollments(response.items);
    } catch (error) {
      addToast({
        type: "error",
        title: "Requests unavailable",
        message: error?.response?.data?.message || "Unable to load enrollment requests.",
      });
    } finally {
      setManageLoading(false);
    }
  }

  async function handleReviewEnrollment(eventId, enrollmentId, status) {
    const key = `review-${enrollmentId}-${status}`;
    setBusyKey(key);
    try {
      await reviewEventEnrollment(eventId, enrollmentId, { status, note: "" });
      const response = await fetchEventEnrollments(eventId);
      setManageEnrollments(response.items);
      await loadData();
      addToast({
        type: "success",
        title: "Request reviewed",
        message: `Enrollment ${titleCase(status)} successfully.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Review failed",
        message: error?.response?.data?.message || "Unable to review enrollment request.",
      });
    } finally {
      setBusyKey("");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {eventsFeatureUnavailable ? (
        <Card className="border border-amber-300/60 bg-amber-100/75 p-4 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-100">
          <p className="text-sm font-semibold">Enrollments API is unavailable on the running backend.</p>
          <p className="mt-1 text-xs">Restart backend with latest code so `/api/events` endpoints are loaded.</p>
        </Card>
      ) : null}

      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Campus Engagement
            </p>
            <h2 className="mt-2 text-2xl font-bold">Event & Workshop Enrollments</h2>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              {canManageEvents
                ? "Create events, monitor seat usage, and approve student participation requests."
                : "Discover workshops, send enrollment requests, and track your participation status."}
            </p>
          </div>
          {canManageEvents ? (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          ) : null}
        </div>
      </Card>

      {upcomingEvents.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No events available"
            description={canManageEvents ? "Create your first event to start enrollments." : "Staff have not published events yet."}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {upcomingEvents.map((eventItem) => {
            const myEnrollment = enrollmentByEventId.get(Number(eventItem.id));
            const myStatus = myEnrollment?.status || eventItem.myEnrollmentStatus || null;
            const seatsRemaining = Number(eventItem.seatsRemaining ?? 0);
            const canRequest =
              isStudent &&
              eventItem.status === "OPEN" &&
              seatsRemaining > 0 &&
              myStatus !== "PENDING" &&
              myStatus !== "APPROVED" &&
              new Date(eventItem.startsAt).getTime() > Date.now();

            return (
              <article
                key={eventItem.id}
                className="rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-violet-300/35 via-cyan-200/28 to-emerald-100/75 p-4 dark:from-violet-900/38 dark:via-cyan-900/26 dark:to-[color:var(--bg-soft)]/88"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{eventItem.title}</p>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">{eventItem.location}</p>
                  </div>
                  <Badge value={eventItem.status} />
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Start:</span> {formatDateTime(eventItem.startsAt)}
                  </p>
                  <p>
                    <span className="font-semibold">End:</span> {formatDateTime(eventItem.endsAt)}
                  </p>
                  <p>
                    <span className="font-semibold">Enrollment deadline:</span>{" "}
                    {eventItem.enrollmentDeadline ? formatDateTime(eventItem.enrollmentDeadline) : "Not specified"}
                  </p>
                  <p className="text-[color:var(--text-muted)]">
                    {eventItem.approvedCount}/{eventItem.capacity} seats filled · {seatsRemaining} seats left
                  </p>
                  {eventItem.description ? <p className="line-clamp-3 text-xs text-[color:var(--text-muted)]">{eventItem.description}</p> : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[color:var(--border)] pt-3">
                  {myStatus ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] bg-white/70 px-2 py-1 text-xs font-semibold dark:bg-[color:var(--bg-soft)]/70">
                      <Hourglass className="h-3.5 w-3.5" />
                      My status: {titleCase(myStatus)}
                    </span>
                  ) : null}

                  {isStudent ? (
                    <Button
                      size="sm"
                      onClick={() => handleRequestEnrollment(eventItem)}
                      disabled={!canRequest}
                      loading={busyKey === `enroll-${eventItem.id}`}
                    >
                      Request Enrollment
                    </Button>
                  ) : null}

                  {canManageEvents ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => openManageModal(eventItem)}>
                        <Users className="h-4 w-4" />
                        Requests
                      </Button>
                      {eventItem.status === "OPEN" ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busyKey === `event-status-${eventItem.id}`}
                            onClick={() => handleUpdateEventStatus(eventItem.id, "COMPLETED")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busyKey === `event-status-${eventItem.id}`}
                            onClick={() => handleUpdateEventStatus(eventItem.id, "CANCELLED")}
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={busyKey === `event-status-${eventItem.id}`}
                          onClick={() => handleUpdateEventStatus(eventItem.id, "OPEN")}
                        >
                          Reopen
                        </Button>
                      )}
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isStudent ? (
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[color:var(--brand)]" />
            <h3 className="text-lg font-semibold">My Enrollment Requests</h3>
          </div>
          {!myEnrollments.length ? (
            <EmptyState title="No requests yet" description="Request an event to start participating." />
          ) : (
            <div className="space-y-2">
              {myEnrollments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[color:var(--border)] bg-white/70 px-3 py-2 dark:bg-[color:var(--bg-soft)]/75"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{item.eventTitle}</p>
                    <Badge value={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                    {formatDateTime(item.eventStartsAt)} · {item.eventLocation}
                  </p>
                  {item.reviewNote ? (
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">Staff note: {item.reviewNote}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Event / Workshop"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button form="create-event-form" type="submit" loading={submitting}>
              Publish Event
            </Button>
          </div>
        }
      >
        <form id="create-event-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateEvent}>
          <FormField label="Title">
            <input
              value={eventForm.title}
              onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
              placeholder="AI Design Workshop"
            />
          </FormField>
          <FormField label="Location">
            <input
              value={eventForm.location}
              onChange={(event) => setEventForm((current) => ({ ...current, location: event.target.value }))}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
              placeholder="Innovation Lab 2"
            />
          </FormField>
          <FormField label="Starts At">
            <input
              type="datetime-local"
              value={eventForm.startsAt}
              onChange={(event) => setEventForm((current) => ({ ...current, startsAt: event.target.value }))}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
          </FormField>
          <FormField label="Ends At">
            <input
              type="datetime-local"
              value={eventForm.endsAt}
              onChange={(event) => setEventForm((current) => ({ ...current, endsAt: event.target.value }))}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
          </FormField>
          <FormField label="Enrollment Deadline">
            <input
              type="datetime-local"
              value={eventForm.enrollmentDeadline}
              onChange={(event) => setEventForm((current) => ({ ...current, enrollmentDeadline: event.target.value }))}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
          </FormField>
          <FormField label="Seat Capacity">
            <input
              type="number"
              min={1}
              value={eventForm.capacity}
              onChange={(event) => setEventForm((current) => ({ ...current, capacity: event.target.value }))}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
          </FormField>
          <FormField label="Description" className="md:col-span-2">
            <textarea
              rows={4}
              value={eventForm.description}
              onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
              placeholder="What students will learn in this workshop"
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(manageModalEvent)}
        onClose={() => setManageModalEvent(null)}
        title={manageModalEvent ? `Enrollment Requests - ${manageModalEvent.title}` : "Enrollment Requests"}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setManageModalEvent(null)}>
              Close
            </Button>
          </div>
        }
      >
        {manageLoading ? (
          <LoadingSkeleton className="h-44 rounded-xl" />
        ) : !manageEnrollments.length ? (
          <EmptyState title="No requests yet" description="Student requests will appear here." />
        ) : (
          <div className="space-y-3">
            {manageEnrollments.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-3 dark:bg-[color:var(--bg-soft)]/75"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.studentName}</p>
                    <p className="text-xs text-[color:var(--text-muted)]">{item.studentEmail}</p>
                  </div>
                  <Badge value={item.status} />
                </div>
                {item.requestMessage ? (
                  <p className="mt-2 text-xs text-[color:var(--text-muted)]">Request: {item.requestMessage}</p>
                ) : null}
                {item.reviewNote ? (
                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">Review: {item.reviewNote}</p>
                ) : null}

                {item.status === "PENDING" ? (
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      size="sm"
                      loading={busyKey === `review-${item.id}-APPROVED`}
                      onClick={() => handleReviewEnrollment(item.eventId, item.id, "APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busyKey === `review-${item.id}-REJECTED`}
                      onClick={() => handleReviewEnrollment(item.eventId, item.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function FormField({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export default EnrollmentsPage;
