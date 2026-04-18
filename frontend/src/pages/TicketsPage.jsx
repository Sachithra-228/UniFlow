import {
  CheckCircle2,
  ClipboardList,
  Filter,
  MessageSquare,
  Plus,
  ShieldCheck,
  UserCircle2,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  addTicketComment,
  addTicketResolutionNotes,
  assignTicket,
  createTicket,
  deleteTicketComment,
  fetchAdminTickets,
  fetchAssignedTickets,
  fetchMyTickets,
  fetchProfile,
  fetchResources,
  fetchUsers,
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

function TicketsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [resources, setResources] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [submittingCreate, setSubmittingCreate] = useState(false);
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

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets]);

  const summary = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
      rejected: tickets.filter((ticket) => ticket.status === "REJECTED").length,
    };
  }, [tickets]);

  const activeTicket = useMemo(() => {
    if (activeTicketId == null) return null;
    return tickets.find((ticket) => ticket.id === activeTicketId) || null;
  }, [tickets, activeTicketId]);

  const ticketViewProps = {
    onOpenTicketManage: handleOpenTicketManage,
  };

  function setTicket(updatedTicket) {
    setTickets((current) => current.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)));
  }

  function handleCreateFormChange(event) {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
  }

  function handleAttachmentChange(event) {
    const files = Array.from(event.target.files ?? []);
    setCreateForm((current) => ({ ...current, attachments: files.slice(0, 3) }));
  }

  function handleOpenTicketManage(ticketId) {
    setEditingComment(null);
    setActiveTicketId(ticketId);
  }

  function handleCloseTicketManage() {
    setEditingComment(null);
    setActiveTicketId(null);
  }

  async function handleCreateTicket(event) {
    event.preventDefault();

    if (!createForm.description.trim() || !createForm.preferredContactDetails.trim()) {
      addToast({
        type: "error",
        title: "Validation failed",
        message: "Description and preferred contact details are required.",
      });
      return;
    }

    if (!createForm.resourceId && !createForm.locationReference.trim()) {
      addToast({
        type: "error",
        title: "Validation failed",
        message: "Select a resource or provide location reference.",
      });
      return;
    }

    if ((createForm.attachments ?? []).length > 3) {
      addToast({
        type: "error",
        title: "Too many attachments",
        message: "Only up to 3 image attachments are allowed.",
      });
      return;
    }

    setSubmittingCreate(true);
    try {
      const formData = new FormData();
      if (createForm.resourceId) {
        formData.append("resourceId", createForm.resourceId);
      }
      if (createForm.locationReference.trim()) {
        formData.append("locationReference", createForm.locationReference.trim());
      }
      formData.append("category", createForm.category);
      formData.append("description", createForm.description.trim());
      formData.append("priority", createForm.priority);
      formData.append("preferredContactDetails", createForm.preferredContactDetails.trim());

      (createForm.attachments ?? []).forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await createTicket(formData);
      setTickets((current) => [response.data, ...current]);
      setCreateForm(initialCreateForm);
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
      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Tickets
            </p>
            <h2 className="mt-2 text-2xl font-bold">{titleCase(role || "user")} Ticket Workspace</h2>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Create, track, assign, resolve, and comment on operational tickets by role permissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setViewMode((prev) => (prev === "table" ? "cards" : "table"))}>
              <Filter className="h-4 w-4" />
              {viewMode === "table" ? "Card View" : "Table View"}
            </Button>
            {canCreateTicket ? (
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Ticket
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <SummaryCard icon={ClipboardList} label="Total" value={summary.total} />
        <SummaryCard icon={Wrench} label="Open" value={summary.open} />
        <SummaryCard icon={ShieldCheck} label="In Progress" value={summary.inProgress} />
        <SummaryCard icon={CheckCircle2} label="Resolved" value={summary.resolved} />
        <SummaryCard icon={UserCircle2} label="Rejected" value={summary.rejected} />
      </div>

      {sortedTickets.length === 0 ? (
        <Card className="p-6">
          <EmptyState title="No tickets found" description="Create tickets to start tracking operational incidents." />
        </Card>
      ) : viewMode === "table" ? (
        <Card className="p-4 md:p-5">
          <TicketsTable tickets={sortedTickets} {...ticketViewProps} />
        </Card>
      ) : (
        <TicketsCards tickets={sortedTickets} {...ticketViewProps} />
      )}

      <Modal
        isOpen={Boolean(activeTicket)}
        onClose={handleCloseTicketManage}
        title={activeTicket ? `Ticket #${activeTicket.id} Details` : "Ticket Details"}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleCloseTicketManage}>
              Close
            </Button>
          </div>
        }
      >
        {activeTicket ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 dark:bg-[color:var(--bg-soft)]/75">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                    Ticket Overview
                  </p>
                  <p className="mt-1 text-base font-semibold">{activeTicket.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge value={activeTicket.status} />
                    <Badge value={activeTicket.priority} />
                    <Badge value={activeTicket.category} />
                  </div>
                </div>
                <div className="text-right text-xs text-[color:var(--text-muted)]">
                  <p>Created: {formatDateTime(activeTicket.createdAt)}</p>
                  <p>Reporter: {activeTicket.createdByName || "-"}</p>
                  <p>Contact: {activeTicket.preferredContactDetails || "-"}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 dark:bg-[color:var(--bg-soft)]/75">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                  Context
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Assigned Technician:</span>{" "}
                    {activeTicket.assignedTechnicianName || "Unassigned"}
                  </p>
                  <p>
                    <span className="font-semibold">Resource:</span> {activeTicket.resourceName || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Location:</span> {activeTicket.locationReference || "-"}
                  </p>
                  {activeTicket.rejectionReason ? (
                    <p className="rounded-xl bg-rose-100/70 px-3 py-2 text-xs text-rose-800 dark:bg-rose-900/40 dark:text-rose-100">
                      Rejection Reason: {activeTicket.rejectionReason}
                    </p>
                  ) : null}
                  {activeTicket.resolutionNotes ? (
                    <p className="rounded-xl bg-emerald-100/70 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                      Resolution Notes: {activeTicket.resolutionNotes}
                    </p>
                  ) : null}
                </div>
              </div>

              {canAssignTechnician || canUpdateStatus || canAddResolution ? (
                <div className="space-y-3 rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 dark:bg-[color:var(--bg-soft)]/75">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                    Ticket Actions
                  </p>
                  <TicketActionPanels
                    ticket={activeTicket}
                    role={role}
                    canAssignTechnician={canAssignTechnician}
                    canUpdateStatus={canUpdateStatus}
                    canAddResolution={canAddResolution}
                    technicians={technicians}
                    assignByTicket={assignByTicket}
                    setAssignByTicket={setAssignByTicket}
                    statusByTicket={statusByTicket}
                    setStatusByTicket={setStatusByTicket}
                    rejectReasonByTicket={rejectReasonByTicket}
                    setRejectReasonByTicket={setRejectReasonByTicket}
                    resolutionByTicket={resolutionByTicket}
                    setResolutionByTicket={setResolutionByTicket}
                    busyKey={busyKey}
                    onAssignTechnician={handleAssignTechnician}
                    onStatusUpdate={handleStatusUpdate}
                    onResolutionSave={handleResolutionSave}
                  />
                </div>
              ) : null}
            </div>

            {activeTicket.attachments?.length ? (
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 dark:bg-[color:var(--bg-soft)]/75">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                  Attachments
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeTicket.attachments.map((attachment) => (
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

            <TicketCommentsPanel
              ticket={activeTicket}
              role={role}
              profile={profile}
              editingComment={editingComment}
              setEditingComment={setEditingComment}
              commentDraftByTicket={commentDraftByTicket}
              setCommentDraftByTicket={setCommentDraftByTicket}
              busyKey={busyKey}
              onAddComment={handleAddComment}
              onSaveEditedComment={handleSaveEditedComment}
              onDeleteComment={handleDeleteComment}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Ticket"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
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
          </FormField>

          <FormField label="Location (Optional)">
            <input
              name="locationReference"
              value={createForm.locationReference}
              onChange={handleCreateFormChange}
              placeholder="Building / floor / room"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
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
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

function TicketsTable({ tickets, onOpenTicketManage }) {
  return (
    <div className="fine-scrollbar overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
          <tr>
            <th className="pb-3">Ticket</th>
            <th className="pb-3">Reporter</th>
            <th className="pb-3">Summary</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Assigned</th>
            <th className="pb-3">Created</th>
            <th className="pb-3">Manage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--border)]">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => onOpenTicketManage(ticket.id)}
            >
              <td className="py-3 align-top">
                <p className="font-semibold">#{ticket.id}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge value={ticket.priority} />
                  <Badge value={ticket.category} />
                </div>
              </td>
              <td className="py-3 align-top">
                <p className="font-semibold">{ticket.createdByName || "-"}</p>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">{ticket.preferredContactDetails || "-"}</p>
              </td>
              <td className="py-3 align-top">
                <p className="max-w-[320px] text-xs">{ticket.description}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-[color:var(--text-muted)]">
                  {ticket.resourceName ? <span>Resource: {ticket.resourceName}</span> : null}
                  {ticket.locationReference ? <span>Location: {ticket.locationReference}</span> : null}
                </div>
              </td>
              <td className="py-3 align-top">
                <Badge value={ticket.status} />
              </td>
              <td className="py-3 align-top">
                {ticket.assignedTechnicianName ? (
                  <p className="text-xs">{ticket.assignedTechnicianName}</p>
                ) : (
                  <p className="text-xs text-[color:var(--text-muted)]">Unassigned</p>
                )}
              </td>
              <td className="py-3 align-top text-xs">{formatDateTime(ticket.createdAt)}</td>
              <td className="py-3 align-top">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenTicketManage(ticket.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--text)] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TicketsCards({ tickets, onOpenTicketManage }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tickets.map((ticket) => (
        <article
          key={ticket.id}
          className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-22px_rgba(15,23,42,0.55)] dark:bg-[color:var(--bg-soft)]/80"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Ticket #{ticket.id}</p>
            <Badge value={ticket.status} />
          </div>
          <p className="line-clamp-3 text-sm">{ticket.description}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            <Badge value={ticket.priority} />
            <Badge value={ticket.category} />
          </div>
          <div className="mt-3 space-y-1 text-xs text-[color:var(--text-muted)]">
            <p>By: {ticket.createdByName || "-"}</p>
            <p>Assigned: {ticket.assignedTechnicianName || "Unassigned"}</p>
            <p>Created: {formatDateTime(ticket.createdAt)}</p>
          </div>
          <div className="mt-4 border-t border-[color:var(--border)] pt-3">
            <button
              type="button"
              onClick={() => onOpenTicketManage(ticket.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--text)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              Open Ticket
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function TicketCommentsPanel({
  ticket,
  role,
  profile,
  editingComment,
  setEditingComment,
  commentDraftByTicket,
  setCommentDraftByTicket,
  busyKey,
  onAddComment,
  onSaveEditedComment,
  onDeleteComment,
}) {
  const canEditComment = (comment) =>
    normalizeRole(role) === "ADMIN" || Number(comment.authorId) === Number(profile?.id);

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 dark:bg-[color:var(--bg-soft)]/75">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Comments</p>
      <div className="mt-2 space-y-2">
        {(ticket.comments || []).map((comment) => {
          const isEditing = editingComment?.commentId === comment.id;
          return (
            <div
              key={comment.id}
              className="rounded-lg border border-[color:var(--border)] bg-white/80 p-2 text-xs dark:bg-[color:var(--bg-soft)]/80"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="font-semibold">
                  {comment.authorName} - {formatDateTime(comment.createdAt)}
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
                      onClick={() => onDeleteComment(ticket.id, comment.id)}
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
                    <Button size="sm" variant="secondary" onClick={() => setEditingComment(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      loading={busyKey === `comment-edit-${comment.id}`}
                      onClick={() => onSaveEditedComment(ticket.id, comment.id)}
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
          loading={busyKey === `comment-add-${ticket.id}`}
          onClick={() => onAddComment(ticket.id)}
        >
          <MessageSquare className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

function TicketActionPanels({
  ticket,
  role,
  canAssignTechnician,
  canUpdateStatus,
  canAddResolution,
  technicians,
  assignByTicket,
  setAssignByTicket,
  statusByTicket,
  setStatusByTicket,
  rejectReasonByTicket,
  setRejectReasonByTicket,
  resolutionByTicket,
  setResolutionByTicket,
  busyKey,
  onAssignTechnician,
  onStatusUpdate,
  onResolutionSave,
}) {
  return (
    <>
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
              onClick={() => onAssignTechnician(ticket.id)}
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
              {(role === "TECHNICIAN" ? ["IN_PROGRESS", "RESOLVED", "CLOSED"] : TICKET_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              loading={busyKey === `status-${ticket.id}`}
              onClick={() => onStatusUpdate(ticket)}
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
              onClick={() => onResolutionSave(ticket.id)}
            >
              Save Notes
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[color:var(--brand)]" />
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{label}</p>
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

