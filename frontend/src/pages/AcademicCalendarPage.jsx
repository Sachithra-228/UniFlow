import { CalendarDays, CalendarPlus, Download, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchBookings, fetchCampusEvents, fetchMyEventEnrollments, fetchProfile } from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";
import { formatDateTime } from "../utils/format";
import { normalizeRole } from "../utils/roles";

function isMissingEventsEndpoint(error) {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || "").toLowerCase();
  return status === 404 && (message.includes("resource not found") || message.includes("not found"));
}

function AcademicCalendarPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [eventsFeatureUnavailable, setEventsFeatureUnavailable] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadCalendarData() {
      setLoading(true);
      try {
        const profileResponse = await fetchProfile();
        const role = normalizeRole(profileResponse?.data?.role) ?? "STUDENT";
        setEventsFeatureUnavailable(false);

        const [bookingResult, eventResult, enrollmentResult] = await Promise.allSettled([
          fetchBookings({ page: 0, size: 400 }),
          fetchCampusEvents({ page: 0, size: 400 }, { mineOnly: role === "STAFF" }),
          fetchMyEventEnrollments({ page: 0, size: 400 }),
        ]);

        if (bookingResult.status === "fulfilled") {
          setBookings(bookingResult.value.items);
        } else {
          throw bookingResult.reason;
        }

        if (eventResult.status === "fulfilled") {
          setEvents(eventResult.value.items);
        } else if (isMissingEventsEndpoint(eventResult.reason)) {
          setEventsFeatureUnavailable(true);
          setEvents([]);
        } else {
          throw eventResult.reason;
        }

        if (enrollmentResult.status === "fulfilled") {
          setEnrollments(enrollmentResult.value.items);
        } else if (isMissingEventsEndpoint(enrollmentResult.reason)) {
          setEventsFeatureUnavailable(true);
          setEnrollments([]);
        } else {
          throw enrollmentResult.reason;
        }

        if (
          (eventResult.status === "rejected" && isMissingEventsEndpoint(eventResult.reason)) ||
          (enrollmentResult.status === "rejected" && isMissingEventsEndpoint(enrollmentResult.reason))
        ) {
          addToast({
            type: "info",
            title: "Calendar partially available",
            message: "Bookings loaded. Events/enrollments need backend restart with latest /api/events endpoints.",
          });
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Calendar unavailable",
          message: error?.response?.data?.message || "Unable to load academic calendar data.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadCalendarData();
  }, []);

  const items = useMemo(() => {
    const enrollmentByEventId = new Map();
    enrollments.forEach((item) => {
      enrollmentByEventId.set(Number(item.eventId), item.status);
    });

    const bookingItems = bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      type: "BOOKING",
      title: `Booking · ${booking.resourceName}`,
      details: booking.purpose || "Campus resource booking",
      location: booking.resourceName || "Campus resource",
      start: booking.startTime,
      end: booking.endTime,
      status: booking.status,
    }));

    const enrolledEventItems = enrollments
      .filter((enrollment) => enrollment.status === "APPROVED")
      .map((enrollment) => ({
        id: `event-${enrollment.id}`,
        type: "EVENT",
        title: `Event · ${enrollment.eventTitle}`,
        details: `Enrollment approved · ${enrollment.status}`,
        location: enrollment.eventLocation || "Campus",
        start: enrollment.eventStartsAt,
        end: enrollment.eventEndsAt,
        status: enrollment.status,
      }));

    const deadlineItems = events
      .filter((event) => event.enrollmentDeadline)
      .filter((event) => event.status === "OPEN")
      .filter((event) => enrollmentByEventId.get(Number(event.id)) !== "APPROVED")
      .map((event) => ({
        id: `deadline-${event.id}`,
        type: "DEADLINE",
        title: `Deadline · ${event.title}`,
        details: "Enrollment deadline",
        location: event.location || "Campus",
        start: event.enrollmentDeadline,
        end: event.enrollmentDeadline,
        status: event.status,
      }));

    return [...bookingItems, ...enrolledEventItems, ...deadlineItems].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [bookings, events, enrollments]);

  const groupedByDay = useMemo(() => {
    const grouped = new Map();
    items.forEach((item) => {
      const dateKey = new Date(item.start).toISOString().slice(0, 10);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey).push(item);
    });
    return Array.from(grouped.entries());
  }, [items]);

  function toGoogleCalendarDate(rawDate) {
    return new Date(rawDate).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function buildGoogleCalendarUrl(item) {
    const start = new Date(item.start);
    const endCandidate = new Date(item.end);
    const end = Number.isNaN(endCandidate.getTime())
      ? new Date(start.getTime() + 60 * 60 * 1000)
      : endCandidate;

    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", item.title);
    url.searchParams.set("details", item.details || "");
    url.searchParams.set("location", item.location || "");
    url.searchParams.set("dates", `${toGoogleCalendarDate(start)}/${toGoogleCalendarDate(end)}`);
    return url.toString();
  }

  function escapeIcsText(text) {
    return String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  function downloadIcs() {
    if (!items.length) {
      addToast({ type: "info", title: "No calendar items", message: "Nothing to export right now." });
      return;
    }

    const dtStamp = toGoogleCalendarDate(new Date());
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//UNIFLOW//ACADEMIC CALENDAR//EN",
      "CALSCALE:GREGORIAN",
      ...items.flatMap((item) => {
        const start = new Date(item.start);
        const endCandidate = new Date(item.end);
        const end = Number.isNaN(endCandidate.getTime())
          ? new Date(start.getTime() + 60 * 60 * 1000)
          : endCandidate;

        return [
          "BEGIN:VEVENT",
          `UID:${item.id}@uniflow.local`,
          `DTSTAMP:${dtStamp}`,
          `DTSTART:${toGoogleCalendarDate(start)}`,
          `DTEND:${toGoogleCalendarDate(end)}`,
          `SUMMARY:${escapeIcsText(item.title)}`,
          `DESCRIPTION:${escapeIcsText(item.details || "")}`,
          `LOCATION:${escapeIcsText(item.location || "")}`,
          "END:VEVENT",
        ];
      }),
      "END:VCALENDAR",
    ];

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "academic-calendar.ics";
    anchor.click();
    window.URL.revokeObjectURL(url);
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
          <p className="text-sm font-semibold">Events endpoints are unavailable on the running backend.</p>
          <p className="mt-1 text-xs">Calendar is showing bookings only. Restart backend with latest code to include events/enrollments.</p>
        </Card>
      ) : null}

      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Unified Timeline
            </p>
            <h2 className="mt-2 text-2xl font-bold">My Academic Calendar</h2>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Bookings, approved event enrollments, and enrollment deadlines in one timeline.
            </p>
          </div>
          <Button onClick={downloadIcs}>
            <Download className="h-4 w-4" />
            Export .ics (Google Calendar)
          </Button>
        </div>
      </Card>

      {!items.length ? (
        <Card className="p-6">
          <EmptyState
            title="No calendar items"
            description="Your bookings, enrollments, and deadlines will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedByDay.map(([day, dayItems]) => (
            <Card key={day} className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[color:var(--brand)]" />
                <h3 className="text-lg font-semibold">{new Date(day).toLocaleDateString()}</h3>
              </div>

              <div className="space-y-3">
                {dayItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[color:var(--border)] bg-gradient-to-br from-cyan-300/26 via-blue-200/20 to-violet-100/55 p-3 dark:from-cyan-900/30 dark:via-blue-900/22 dark:to-[color:var(--bg-soft)]/88"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                          {formatDateTime(item.start)}{item.end ? ` - ${formatDateTime(item.end)}` : ""}
                        </p>
                      </div>
                      <Badge value={item.type} />
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--text-muted)]">{item.details}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--text-muted)]">
                        <Timer className="h-3.5 w-3.5" />
                        {item.location}
                      </span>
                      <a
                        href={buildGoogleCalendarUrl(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Add to Google
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AcademicCalendarPage;
