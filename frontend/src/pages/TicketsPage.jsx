import {
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCircle2,
  Wrench,
} from "lucide-react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addTicketComment,
  addTicketResolutionNotes,
  assignTicket,
  createTicket,
  deleteTicket,
  deleteTicketComment,
  fetchAdminTickets,
  fetchAssignedTickets,
  fetchMyTickets,
  fetchProfile,
  fetchResources,
  fetchUsers,
  updateTicket,
  updateTicketComment,
  updateTicketStatus,
} from "../api/campusApi";
import { API_BASE_URL } from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import Modal from "../components/common/Modal";
import { useToast } from "../hooks/useToast";
import { formatDateTime, titleCase } from "../utils/format";
import { normalizeRole } from "../utils/roles";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "../utils/constants";

const initialCreateForm = {
  resourceId: "",
  locationReference: "",
  category: "HARDWARE",
  description: "",
  priority: "MEDIUM",
  preferredContactDetails: "",
  attachments: [],
};

const initialEditForm = {
  ticketId: null,
  resourceId: "",
  locationReference: "",
  category: "HARDWARE",
  description: "",
  priority: "MEDIUM",
  preferredContactDetails: "",
};

function TicketsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [resources, setResources] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createErrors, setCreateErrors] = useState({});
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editErrors, setEditErrors] = useState({});
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deletingTicketId, setDeletingTicketId] = useState(null);
  const [assignByTicket, setAssignByTicket] = useState({});
  const [statusByTicket, setStatusByTicket] = useState({});
  const [rejectReasonByTicket, setRejectReasonByTicket] = useState({});
  const [resolutionByTicket, setResolutionByTicket] = useState({});
  const [commentDraftByTicket, setCommentDraftByTicket] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [busyKey, setBusyKey] = useState("");
  const { addToast } = useToast();

  const canCreateTicket = role === "STUDENT" || role === "STAFF";
  const canAssignTechnician = role === "ADMIN";
  const canUpdateStatus = role === "TECHNICIAN" || role === "ADMIN";
  const canAddResolution = role === "TECHNICIAN" || role === "ADMIN";

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const profileResponse = await fetchProfile();
        const resolvedRole = normalizeRole(profileResponse?.data?.role) ?? "STUDENT";
        setProfile(profileResponse.data);
        setRole(resolvedRole);

        const requests = [fetchResources({ page: 0, size: 300 })];
        if (resolvedRole === "ADMIN") {
          requests.push(fetchAdminTickets({ page: 0, size: 300 }));
          requests.push(fetchUsers({ page: 0, size: 300 }));
        } else if (resolvedRole === "TECHNICIAN") {
          requests.push(fetchAssignedTickets({ page: 0, size: 300 }));
        } else {
          requests.push(fetchMyTickets({ page: 0, size: 300 }));
        }

        const responses = await Promise.all(requests);
        const resourceResponse = responses[0];
        const ticketResponse = responses[1];

        setResources(resourceResponse.items);
        setTickets(ticketResponse.items);

        if (resolvedRole === "ADMIN") {
          const usersResponse = responses[2];
          setTechnicians(usersResponse.items.filter((user) => normalizeRole(user.role) === "TECHNICIAN"));
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Ticket module unavailable",
          message: error?.response?.data?.message || "Failed to load ticket workflows.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast]);

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
        const haystack = [
          ticket.description,
          ticket.category,
          ticket.priority,
          ticket.status,
          ticket.resourceName,
          ticket.locationReference,
          ticket.createdByName,
          ticket.assignedTechnicianName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [query, statusFilter, tickets]);

  const summary = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
      rejected: tickets.filter((ticket) => ticket.status === "REJECTED").length,
    };
  }, [tickets]);

  function setTicket(updatedTicket) {
    setTickets((current) => current.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)));
  }

  function handleCreateFormChange(event) {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
    setCreateErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleAttachmentChange(event) {
    const files = Array.from(event.target.files ?? []);
    setCreateForm((current) => ({ ...current, attachments: files.slice(0, 3) }));
    setCreateErrors((current) => ({ ...current, attachments: undefined }));
  }

  function validateTicketForm(values, { includeAttachments }) {
    const errors = {};
    const description = values.description.trim();
    const preferredContactDetails = values.preferredContactDetails.trim();
    const locationReference = values.locationReference.trim();
    const resourceId = values.resourceId ? Number(values.resourceId) : null;

    if (!resourceId && !locationReference) {
      errors.locationReference = "Select a resource or provide location.";
      errors.resourceId = "Select a resource or provide location.";
    }

    if (resourceId && !resources.some((resource) => Number(resource.id) === resourceId)) {
      errors.resourceId = "Selected resource is unavailable.";
    }

    if (!description) {
      errors.description = "Description is required.";
    } else if (description.length < 10) {
      errors.description = "Description must be at least 10 characters.";
    } else if (description.length > 2000) {
      errors.description = "Description must be 2000 characters or fewer.";
    }

    if (!preferredContactDetails) {
      errors.preferredContactDetails = "Preferred contact details are required.";
    } else if (preferredContactDetails.length < 5) {
      errors.preferredContactDetails = "Preferred contact details must be at least 5 characters.";
    } else if (preferredContactDetails.length > 300) {
      errors.preferredContactDetails = "Preferred contact details must be 300 characters or fewer.";
    }

    if (locationReference.length > 255) {
      errors.locationReference = "Location must be 255 characters or fewer.";
    }

    if (includeAttachments && (values.attachments ?? []).length > 3) {
      errors.attachments = "Only up to 3 image attachments are allowed.";
    }

    return {
      errors,
      payload: {
        resourceId,
        locationReference,
        category: values.category,
        description,
        priority: values.priority,
        preferredContactDetails,
      },
    };
  }

  function canManageOwnTicket(ticket) {
    const isOwner = Number(ticket.createdById) === Number(profile?.id);
    const editableStatus =
      ticket.status === "OPEN" ||
      ticket.status === "IN_PROGRESS" ||
      ticket.status === "REJECTED";
    return (role === "STUDENT" || role === "STAFF") && isOwner && editableStatus;
  }

  function openEditTicketModal(ticket) {
    if (!canManageOwnTicket(ticket)) return;

    setEditForm({
      ticketId: ticket.id,
      resourceId: ticket.resourceId ? String(ticket.resourceId) : "",
      locationReference: ticket.locationReference ?? "",
      category: ticket.category,
      description: ticket.description,
      priority: ticket.priority,
      preferredContactDetails: ticket.preferredContactDetails,
    });
    setEditErrors({});
    setEditModalOpen(true);
  }

  function handleEditFormChange(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
    setEditErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSaveTicketChanges(event) {
    event.preventDefault();
    const activeTicketId = editForm.ticketId;
    if (!activeTicketId) return;

    // Refresh resources before save so we don't submit stale resource ids.
    let activeResources = resources;
    try {
      const resourcesResponse = await fetchResources({ page: 0, size: 300 });
      activeResources = resourcesResponse.items;
      setResources(resourcesResponse.items);
    } catch {
      // If refresh fails, continue with the latest known resource list.
    }

    const { errors, payload } = validateTicketForm(editForm, { includeAttachments: false });
    if (payload.resourceId && !activeResources.some((item) => Number(item.id) === Number(payload.resourceId))) {
      errors.resourceId = "Selected resource is unavailable. Please select another resource.";
    }
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast({ type: "error", title: "Validation failed", message: "Please fix the highlighted fields." });
      return;
    }

    setSubmittingEdit(true);
    try {
      const response = await updateTicket(activeTicketId, payload);
      setTicket(response.data);
      setEditModalOpen(false);
      setEditForm(initialEditForm);
      setEditErrors({});
      addToast({
        type: "success",
        title: "Ticket updated",
        message: "Ticket details were updated successfully.",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const apiMessage = String(error.response?.data?.message || "").toLowerCase();
        if (apiMessage.includes("resource")) {
          setEditErrors((current) => ({
            ...current,
            resourceId: "Selected resource no longer exists. Choose another resource.",
          }));
          addToast({
            type: "error",
            title: "Resource unavailable",
            message: "The selected resource was removed. Please choose another and save again.",
          });
          return;
        }

        if (apiMessage.includes("ticket")) {
          setTickets((current) => current.filter((ticket) => ticket.id !== activeTicketId));
          setEditModalOpen(false);
          setEditForm(initialEditForm);
          setEditErrors({});
          addToast({
            type: "info",
            title: "Ticket no longer exists",
            message: "This ticket was removed on the server and has been cleared from your list.",
          });
          return;
        }
      }

      addToast({
        type: "error",
        title: "Update failed",
        message: error?.response?.data?.message || "Could not update ticket.",
      });
    } finally {
      setSubmittingEdit(false);
    }
  }

  async function handleDeleteTicket(ticketId) {
    const confirmed = window.confirm("Delete this ticket?");
    if (!confirmed) return;

    setDeletingTicketId(ticketId);
    try {
      await deleteTicket(ticketId);
      setTickets((current) => current.filter((ticket) => ticket.id !== ticketId));
      addToast({
        type: "success",
        title: "Ticket deleted",
        message: "Ticket removed successfully.",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setTickets((current) => current.filter((ticket) => ticket.id !== ticketId));
        addToast({
          type: "info",
          title: "Ticket already removed",
          message: "This ticket no longer exists on the server and was removed from your list.",
        });
        return;
      }

      addToast({
        type: "error",
        title: "Delete failed",
        message: error?.response?.data?.message || "Could not delete ticket.",
      });
    } finally {
      setDeletingTicketId(null);
    }
  }

  async function handleCreateTicket(event) {
    event.preventDefault();

    const { errors, payload } = validateTicketForm(createForm, { includeAttachments: true });
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast({
        type: "error",
        title: "Validation failed",
        message: "Please fix the highlighted fields.",
      });
      return;
    }

    setSubmittingCreate(true);
    try {
      const formData = new FormData();
      if (payload.resourceId) {
        formData.append("resourceId", String(payload.resourceId));
      }
      if (payload.locationReference) {
        formData.append("locationReference", payload.locationReference);
      }
      formData.append("category", payload.category);
      formData.append("description", payload.description);
      formData.append("priority", payload.priority);
      formData.append("preferredContactDetails", payload.preferredContactDetails);

      (createForm.attachments ?? []).forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await createTicket(formData);
      setTickets((current) => [response.data, ...current]);
      setCreateForm(initialCreateForm);
      setCreateErrors({});
      setCreateModalOpen(false);
      addToast({
        type: "success",
        title: "Ticket created",
        message: "Your ticket has been submitted successfully.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Create ticket failed",
        message: error?.response?.data?.message || "Could not create ticket.",
      });
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleAssignTechnician(ticketId) {
    const technicianId = Number(assignByTicket[ticketId]);
    if (!Number.isFinite(technicianId)) {
      addToast({
        type: "error",
        title: "Technician required",
        message: "Select a technician before assigning.",
      });
      return;
    }

    const key = `assign-${ticketId}`;
    setBusyKey(key);
    try {
      const response = await assignTicket(ticketId, { technicianId });
      setTicket(response.data);
      addToast({
        type: "success",
        title: "Technician assigned",
        message: "Ticket assignment updated successfully.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Assign failed",
        message: error?.response?.data?.message || "Failed to assign technician.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleStatusUpdate(ticket, forcedStatus) {
    const status = forcedStatus || statusByTicket[ticket.id];
    if (!status) {
      addToast({
        type: "error",
        title: "Status required",
        message: "Select a status first.",
      });
      return;
    }

    const payload = { status };
    if (status === "REJECTED") {
      const reason = (rejectReasonByTicket[ticket.id] || "").trim();
      if (!reason) {
        addToast({
          type: "error",
          title: "Rejection reason required",
          message: "Provide a rejection reason to reject the ticket.",
        });
        return;
      }
      payload.rejectionReason = reason;
    }

    const key = `status-${ticket.id}`;
    setBusyKey(key);
    try {
      const response = await updateTicketStatus(ticket.id, payload);
      setTicket(response.data);
      addToast({
        type: "success",
        title: "Ticket updated",
        message: `Status changed to ${titleCase(status)}.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Status update failed",
        message: error?.response?.data?.message || "Failed to update ticket status.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleResolutionSave(ticketId) {
    const notes = (resolutionByTicket[ticketId] || "").trim();
    if (!notes) {
      addToast({
        type: "error",
        title: "Resolution notes required",
        message: "Add notes before saving resolution details.",
      });
      return;
    }

    const key = `resolution-${ticketId}`;
    setBusyKey(key);
    try {
      const response = await addTicketResolutionNotes(ticketId, { resolutionNotes: notes });
      setTicket(response.data);
      addToast({
        type: "success",
        title: "Resolution notes saved",
        message: "Resolution notes updated successfully.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Save failed",
        message: error?.response?.data?.message || "Failed to save resolution notes.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleAddComment(ticketId) {
    const comment = (commentDraftByTicket[ticketId] || "").trim();
    if (!comment) return;

    const key = `comment-add-${ticketId}`;
    setBusyKey(key);
    try {
      const response = await addTicketComment(ticketId, { comment });
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, comments: [...(ticket.comments || []), response.data], updatedAt: new Date().toISOString() }
            : ticket
        )
      );
      setCommentDraftByTicket((current) => ({ ...current, [ticketId]: "" }));
    } catch (error) {
      addToast({
        type: "error",
        title: "Comment failed",
        message: error?.response?.data?.message || "Unable to add comment.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleSaveEditedComment(ticketId, commentId) {
    const text = (editingComment?.text || "").trim();
    if (!text) return;

    const key = `comment-edit-${commentId}`;
    setBusyKey(key);
    try {
      const response = await updateTicketComment(ticketId, commentId, { comment: text });
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                comments: (ticket.comments || []).map((comment) =>
                  comment.id === commentId ? response.data : comment
                ),
              }
            : ticket
        )
      );
      setEditingComment(null);
    } catch (error) {
      addToast({
        type: "error",
        title: "Comment update failed",
        message: error?.response?.data?.message || "Unable to update comment.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleDeleteComment(ticketId, commentId) {
    const key = `comment-delete-${commentId}`;
    setBusyKey(key);
    try {
      await deleteTicketComment(ticketId, commentId);
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, comments: (ticket.comments || []).filter((comment) => comment.id !== commentId) }
            : ticket
        )
      );
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        message: error?.response?.data?.message || "Unable to delete comment.",
      });
    } finally {
      setBusyKey("");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-r from-[color:var(--brand)]/12 via-[color:var(--brand-soft)]/25 to-transparent p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">
              Tickets
            </p>
            <h2 className="mt-2 text-2xl font-bold">{titleCase(role || "user")} Ticket Workspace</h2>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Create, track, assign, resolve, and comment on operational tickets by role permissions.
            </p>
          </div>
          {canCreateTicket ? (
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-[color:var(--brand)] to-blue-600 text-white shadow-md hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Create Ticket
            </Button>
          ) : null}
        </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <SummaryCard icon={ClipboardList} label="Total" value={summary.total} tone="default" />
        <SummaryCard icon={Wrench} label="Open" value={summary.open} tone="warn" />
        <SummaryCard icon={ShieldCheck} label="In Progress" value={summary.inProgress} tone="info" />
        <SummaryCard icon={CheckCircle2} label="Resolved" value={summary.resolved} tone="success" />
        <SummaryCard icon={UserCircle2} label="Rejected" value={summary.rejected} tone="danger" />
      </div>

      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 shadow-sm dark:bg-[color:var(--bg-soft)]/80">
            <Search className="h-4 w-4 text-[color:var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tickets by description, category, status, user..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]/70"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-sm outline-none shadow-sm dark:bg-[color:var(--bg-soft)]/80"
          >
            <option value="ALL">All Status</option>
            {TICKET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {filteredTickets.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No tickets found"
            description="Create tickets or adjust your filters to view matching records."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const canEditComment = (comment) =>
              normalizeRole(role) === "ADMIN" || Number(comment.authorId) === Number(profile?.id);

            return (
              <Card key={ticket.id} className="border border-[color:var(--border)]/80 bg-white/75 p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-[color:var(--bg-soft)]/75">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">Ticket #{ticket.id}</p>
                      <Badge value={ticket.status} />
                      <Badge value={ticket.priority} />
                      <Badge value={ticket.category} />
                      {canManageOwnTicket(ticket) ? (
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Edit ticket"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300"
                            onClick={() => openEditTicketModal(ticket)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete ticket"
                            disabled={deletingTicketId === ticket.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                            onClick={() => handleDeleteTicket(ticket.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <p className="text-sm">{ticket.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-[color:var(--text-muted)]">
                      <span>Created: {formatDateTime(ticket.createdAt)}</span>
                      <span>By: {ticket.createdByName}</span>
                      <span>Contact: {ticket.preferredContactDetails}</span>
                      {ticket.resourceName ? <span>Resource: {ticket.resourceName}</span> : null}
                      {ticket.locationReference ? <span>Location: {ticket.locationReference}</span> : null}
                      {ticket.assignedTechnicianName ? <span>Technician: {ticket.assignedTechnicianName}</span> : null}
                    </div>
                    {ticket.rejectionReason ? (
                      <p className="rounded-xl bg-rose-100/70 px-3 py-2 text-xs text-rose-800 dark:bg-rose-900/40 dark:text-rose-100">
                        Rejection Reason: {ticket.rejectionReason}
                      </p>
                    ) : null}
                    {ticket.resolutionNotes ? (
                      <p className="rounded-xl bg-emerald-100/70 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                        Resolution Notes: {ticket.resolutionNotes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex min-w-[300px] flex-col gap-3">
                    {canAssignTechnician ? (
                      <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3 dark:bg-[color:var(--bg-soft)]/75">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                          Assign Technician
                        </p>
                        <div className="flex gap-2">
                          <select
                            value={assignByTicket[ticket.id] || ""}
                            onChange={(event) =>
                              setAssignByTicket((current) => ({ ...current, [ticket.id]: event.target.value }))
                            }
                            className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-xs outline-none dark:bg-[color:var(--bg-soft)]"
                          >
                            <option value="">Select technician</option>
                            {technicians.map((technician) => (
                              <option key={technician.id} value={technician.id}>
                                {technician.name} ({technician.email})
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            loading={busyKey === `assign-${ticket.id}`}
                            onClick={() => handleAssignTechnician(ticket.id)}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {canUpdateStatus ? (
                      <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3 dark:bg-[color:var(--bg-soft)]/75">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                          Update Status
                        </p>
                        <div className="flex gap-2">
                          <select
                            value={statusByTicket[ticket.id] || ""}
                            onChange={(event) =>
                              setStatusByTicket((current) => ({ ...current, [ticket.id]: event.target.value }))
                            }
                            className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-xs outline-none dark:bg-[color:var(--bg-soft)]"
                          >
                            <option value="">Select status</option>
                            {(role === "TECHNICIAN"
                              ? ["IN_PROGRESS", "RESOLVED", "CLOSED"]
                              : TICKET_STATUSES
                            ).map((status) => (
                              <option key={status} value={status}>
                                {titleCase(status)}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            loading={busyKey === `status-${ticket.id}`}
                            onClick={() => handleStatusUpdate(ticket)}
                          >
                            Save
                          </Button>
                        </div>
                        {(statusByTicket[ticket.id] || "") === "REJECTED" && role === "ADMIN" ? (
                          <textarea
                            rows={2}
                            value={rejectReasonByTicket[ticket.id] || ""}
                            onChange={(event) =>
                              setRejectReasonByTicket((current) => ({
                                ...current,
                                [ticket.id]: event.target.value,
                              }))
                            }
                            placeholder="Rejection reason (required)"
                            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-xs outline-none dark:bg-[color:var(--bg-soft)]"
                          />
                        ) : null}
                      </div>
                    ) : null}

                    {canAddResolution ? (
                      <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3 dark:bg-[color:var(--bg-soft)]/75">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                          Resolution Notes
                        </p>
                        <textarea
                          rows={2}
                          value={resolutionByTicket[ticket.id] ?? ticket.resolutionNotes ?? ""}
                          onChange={(event) =>
                            setResolutionByTicket((current) => ({ ...current, [ticket.id]: event.target.value }))
                          }
                          placeholder="Add resolution details"
                          className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-xs outline-none dark:bg-[color:var(--bg-soft)]"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            loading={busyKey === `resolution-${ticket.id}`}
                            onClick={() => handleResolutionSave(ticket.id)}
                          >
                            Save Notes
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {ticket.attachments?.length ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                      Attachments
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={`${API_BASE_URL}${attachment.downloadUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-xs font-semibold hover:underline dark:bg-[color:var(--bg-soft)]/80"
                        >
                          {attachment.originalFileName}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-white/60 p-3 dark:bg-[color:var(--bg-soft)]/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                    Comments
                  </p>
                  <div className="mt-2 space-y-2">
                    {(ticket.comments || []).map((comment) => {
                      const isEditing = editingComment?.commentId === comment.id;
                      return (
                        <div key={comment.id} className="rounded-lg border border-[color:var(--border)] bg-white/80 p-2 text-xs dark:bg-[color:var(--bg-soft)]/80">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <p className="font-semibold">
                              {comment.authorName} · {formatDateTime(comment.createdAt)}
                            </p>
                            {canEditComment(comment) ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="text-[color:var(--brand)] hover:underline"
                                  onClick={() =>
                                    setEditingComment({
                                      ticketId: ticket.id,
                                      commentId: comment.id,
                                      text: comment.comment,
                                    })
                                  }
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="text-rose-700 hover:underline dark:text-rose-300"
                                  onClick={() => handleDeleteComment(ticket.id, comment.id)}
                                  disabled={busyKey === `comment-delete-${comment.id}`}
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                value={editingComment.text}
                                onChange={(event) =>
                                  setEditingComment((current) =>
                                    current ? { ...current, text: event.target.value } : current
                                  )
                                }
                                className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-xs outline-none dark:bg-[color:var(--bg-soft)]"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setEditingComment(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  loading={busyKey === `comment-edit-${comment.id}`}
                                  onClick={() => handleSaveEditedComment(ticket.id, comment.id)}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p>{comment.comment}</p>
                          )}
                        </div>
                      );
                    })}

                    {!(ticket.comments || []).length ? (
                      <p className="text-xs text-[color:var(--text-muted)]">No comments yet.</p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <textarea
                      rows={2}
                      value={commentDraftByTicket[ticket.id] || ""}
                      onChange={(event) =>
                        setCommentDraftByTicket((current) => ({ ...current, [ticket.id]: event.target.value }))
                      }
                      placeholder="Add a comment..."
                      className="w-full rounded-xl border border-[color:var(--border)] bg-white/80 px-3 py-2 text-xs outline-none dark:bg-[color:var(--bg-soft)]"
                    />
                    <Button
                      size="sm"
                      className="bg-[color:var(--brand)] text-white hover:brightness-110"
                      loading={busyKey === `comment-add-${ticket.id}`}
                      onClick={() => handleAddComment(ticket.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateErrors({});
        }}
        title="Create Ticket"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCreateModalOpen(false);
                setCreateErrors({});
              }}
            >
              Cancel
            </Button>
            <Button form="create-ticket-form" type="submit" loading={submittingCreate}>
              Submit Ticket
            </Button>
          </div>
        }
      >
        <form id="create-ticket-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateTicket}>
          <FormField label="Resource (Optional)">
            <select
              name="resourceId"
              value={createForm.resourceId}
              onChange={handleCreateFormChange}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              <option value="">No resource selected</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
            {createErrors.resourceId ? (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{createErrors.resourceId}</p>
            ) : null}
          </FormField>

          <FormField label="Location (Optional)">
            <input
              name="locationReference"
              value={createForm.locationReference}
              onChange={handleCreateFormChange}
              placeholder="Building / floor / room"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {createErrors.locationReference ? (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{createErrors.locationReference}</p>
            ) : null}
          </FormField>

          <FormField label="Category">
            <select
              name="category"
              value={createForm.category}
              onChange={handleCreateFormChange}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              {TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {titleCase(category)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Priority">
            <select
              name="priority"
              value={createForm.priority}
              onChange={handleCreateFormChange}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {titleCase(priority)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Preferred Contact Details">
            <input
              name="preferredContactDetails"
              value={createForm.preferredContactDetails}
              onChange={handleCreateFormChange}
              placeholder="Phone/email with preferred time"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {createErrors.preferredContactDetails ? (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{createErrors.preferredContactDetails}</p>
            ) : null}
          </FormField>

          <FormField label="Image Attachments (Up to 3)">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleAttachmentChange}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--brand-soft)] file:px-3 file:py-1.5 file:text-xs file:font-semibold dark:bg-[color:var(--bg-soft)]/70"
            />
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              {(createForm.attachments || []).length} selected
            </p>
            {createErrors.attachments ? (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{createErrors.attachments}</p>
            ) : null}
          </FormField>

          <FormField label="Description" className="md:col-span-2">
            <textarea
              name="description"
              rows={5}
              value={createForm.description}
              onChange={handleCreateFormChange}
              placeholder="Describe the issue in detail"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {createErrors.description ? (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{createErrors.description}</p>
            ) : null}
          </FormField>
        </form>
      </Modal>

      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditForm(initialEditForm);
          setEditErrors({});
        }}
        title="Edit Ticket"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditModalOpen(false);
                setEditForm(initialEditForm);
                setEditErrors({});
              }}
            >
              Cancel
            </Button>
            <Button form="edit-ticket-form" type="submit" loading={submittingEdit}>
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="edit-ticket-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveTicketChanges}>
          <FormField label="Resource (Optional)">
            <select
              name="resourceId"
              value={editForm.resourceId}
              onChange={handleEditFormChange}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              <option value="">No resource selected</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
            {editErrors.resourceId ? (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{editErrors.resourceId}</p>
            ) : null}
          </FormField>

          <FormField label="Location (Optional)">
            <input
              name="locationReference"
              value={editForm.locationReference}
              onChange={handleEditFormChange}
              placeholder="Building / floor / room"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {editErrors.locationReference ? (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{editErrors.locationReference}</p>
            ) : null}
          </FormField>

          <FormField label="Category">
            <select
              name="category"
              value={editForm.category}
              onChange={handleEditFormChange}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              {TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {titleCase(category)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Priority">
            <select
              name="priority"
              value={editForm.priority}
              onChange={handleEditFormChange}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {titleCase(priority)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Preferred Contact Details">
            <input
              name="preferredContactDetails"
              value={editForm.preferredContactDetails}
              onChange={handleEditFormChange}
              placeholder="Phone/email with preferred time"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {editErrors.preferredContactDetails ? (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{editErrors.preferredContactDetails}</p>
            ) : null}
          </FormField>

          <FormField label="Description" className="md:col-span-2">
            <textarea
              name="description"
              rows={5}
              value={editForm.description}
              onChange={handleEditFormChange}
              placeholder="Describe the issue in detail"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
            {editErrors.description ? (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{editErrors.description}</p>
            ) : null}
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone = "default" }) {
  const toneClasses = {
    default: "border-[color:var(--border)] bg-white/80 text-[color:var(--text)] dark:bg-[color:var(--bg-soft)]/80",
    info: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    warn: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    danger: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
  };

  return (
    <Card className={`border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
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

export default TicketsPage;

