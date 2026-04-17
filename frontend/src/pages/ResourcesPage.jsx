import { Filter, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createResource, deleteResource, fetchResources, updateResource } from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import Modal from "../components/common/Modal";
import { useToast } from "../hooks/useToast";
import { RESOURCE_STATUSES, RESOURCE_TYPES } from "../utils/constants";
import { formatDateTime, titleCase } from "../utils/format";

const initialForm = {
  name: "",
  type: "ROOM",
  capacity: "",
  location: "",
  status: "AVAILABLE",
};

function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [resourceModalMode, setResourceModalMode] = useState("create");
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetchResources({ page: 0, size: 300 });
        setResources(response.items);
        if (response.isFallback) {
          addToast({
            type: "info",
            title: "Fallback mode enabled",
            message: "Showing local demo resources while backend is unavailable.",
          });
        }
      } catch {
        addToast({ type: "error", title: "Resource load failed", message: "Could not fetch resource data." });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [addToast]);

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchesQuery = [item.name, item.location].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [resources, query, typeFilter, statusFilter]);

  function handleInput(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreateModal() {
    setResourceModalMode("create");
    setEditingResourceId(null);
    setForm(initialForm);
    setOpenModal(true);
  }

  function openEditModalForResource(resource) {
    setResourceModalMode("edit");
    setEditingResourceId(resource.id);
    setForm({
      name: resource.name ?? "",
      type: resource.type ?? "ROOM",
      capacity: String(resource.capacity ?? ""),
      location: resource.location ?? "",
      status: resource.status ?? "AVAILABLE",
    });
    setOpenModal(true);
  }

  function openDeleteModalForResource(resource) {
    setDeleteTarget(resource);
    setOpenDeleteModal(true);
  }

  async function handleSaveResource(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      addToast({ type: "error", title: "Validation error", message: "Name and location are required." });
      return;
    }

    if (!Number.isFinite(Number(form.capacity)) || Number(form.capacity) < 1) {
      addToast({ type: "error", title: "Validation error", message: "Capacity must be at least 1." });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
      };

      if (resourceModalMode === "edit" && editingResourceId) {
        const response = await updateResource(editingResourceId, payload);
        setResources((current) => current.map((item) => (item.id === editingResourceId ? response.data : item)));
        addToast({
          type: "success",
          title: "Resource updated",
          message: "Resource details were updated successfully.",
        });
      } else {
        const response = await createResource(payload);
        setResources((current) => [response.data, ...current]);
        addToast({
          type: "success",
          title: "Resource created",
          message: response.isFallback ? "Saved in mock fallback data." : "Resource is now available in inventory.",
        });
      }

      setOpenModal(false);
      setForm(initialForm);
      setEditingResourceId(null);
      setResourceModalMode("create");
    } catch (error) {
      addToast({
        type: "error",
        title: resourceModalMode === "edit" ? "Update failed" : "Create failed",
        message: error?.response?.data?.message || `Unable to ${resourceModalMode === "edit" ? "update" : "create"} resource.`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteResource() {
    if (!deleteTarget?.id) return;

    setDeleteSubmitting(true);
    try {
      await deleteResource(deleteTarget.id);
      setResources((current) => current.filter((resource) => resource.id !== deleteTarget.id));
      addToast({
        type: "success",
        title: "Resource deleted",
        message: `${deleteTarget.name} was removed.`,
      });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        message: error?.response?.data?.message || "Could not delete resource.",
      });
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-[1.2fr_auto_auto]">
            <label className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/70 px-3 py-2 dark:bg-[color:var(--bg-soft)]/80">
              <Search className="h-4 w-4 text-[color:var(--text-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or location"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]/70"
              />
            </label>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-xl border border-[color:var(--border)] bg-white/70 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
            >
              <option value="ALL">All Types</option>
              {RESOURCE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {titleCase(item)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-[color:var(--border)] bg-white/70 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
            >
              <option value="ALL">All Status</option>
              {RESOURCE_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {titleCase(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setViewMode((prev) => (prev === "table" ? "cards" : "table"))}>
              <Filter className="h-4 w-4" />
              {viewMode === "table" ? "Card View" : "Table View"}
            </Button>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Add Resource
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <EmptyState
            title="No resources found"
            description="Try changing filters or add new campus resources to populate this view."
            action={
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Create Resource
              </Button>
            }
          />
        ) : viewMode === "table" ? (
          <ResourceTable
            resources={filteredResources}
            onEdit={openEditModalForResource}
            onDelete={openDeleteModalForResource}
          />
        ) : (
          <ResourceCards
            resources={filteredResources}
            onEdit={openEditModalForResource}
            onDelete={openDeleteModalForResource}
          />
        )}
      </Card>

      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title={resourceModalMode === "edit" ? "Update Campus Resource" : "Add Campus Resource"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button form="resource-form" type="submit" loading={submitting}>
              {resourceModalMode === "edit" ? "Save Changes" : "Save Resource"}
            </Button>
          </div>
        }
      >
        <form id="resource-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveResource}>
          <FormField label="Resource Name">
            <input
              name="name"
              value={form.name}
              onChange={handleInput}
              placeholder="E.g. Seminar Hall East"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
          </FormField>

          <FormField label="Type">
            <select
              name="type"
              value={form.type}
              onChange={handleInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              {RESOURCE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {titleCase(item)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Capacity">
            <input
              type="number"
              name="capacity"
              value={form.capacity}
              onChange={handleInput}
              min={1}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
          </FormField>

          <FormField label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            >
              {RESOURCE_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {titleCase(item)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Location" className="md:col-span-2">
            <input
              name="location"
              value={form.location}
              onChange={handleInput}
              placeholder="Building / Block / Floor"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/70"
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        title="Delete Resource"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteResource} loading={deleteSubmitting}>
              Delete Resource
            </Button>
          </div>
        )}
      >
        <p className="text-sm text-[color:var(--text-muted)]">
          Delete resource <span className="font-semibold text-[color:var(--text)]">{deleteTarget?.name}</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function ResourceTable({ resources, onEdit, onDelete }) {
  return (
    <div className="fine-scrollbar overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
          <tr>
            <th className="pb-3">Name</th>
            <th className="pb-3">Type</th>
            <th className="pb-3">Capacity</th>
            <th className="pb-3">Location</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Created</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--border)]">
          {resources.map((item) => (
            <tr key={item.id}>
              <td className="py-3 font-semibold">{item.name}</td>
              <td className="py-3">
                <Badge value={item.type} />
              </td>
              <td className="py-3">{item.capacity}</td>
              <td className="py-3">{item.location}</td>
              <td className="py-3">
                <Badge value={item.status} />
              </td>
              <td className="py-3 text-xs text-[color:var(--text-muted)]">{formatDateTime(item.createdAt)}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--text)] hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-300 dark:hover:bg-rose-400/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResourceCards({ resources, onEdit, onDelete }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {resources.map((item) => (
        <article key={item.id} className="rounded-2xl border border-[color:var(--border)] bg-white/65 p-4 dark:bg-[color:var(--bg-soft)]/75">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-semibold">{item.name}</h4>
            <Badge value={item.status} />
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-[color:var(--text-muted)]">
              Type: <span className="font-semibold text-[color:var(--text)]">{titleCase(item.type)}</span>
            </p>
            <p className="text-[color:var(--text-muted)]">
              Capacity: <span className="font-semibold text-[color:var(--text)]">{item.capacity}</span>
            </p>
            <p className="text-[color:var(--text-muted)]">
              Location: <span className="font-semibold text-[color:var(--text)]">{item.location}</span>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-[color:var(--border)] pt-3">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--text)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Pencil className="h-3.5 w-3.5" />
              Update
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-300 dark:hover:bg-rose-400/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </article>
      ))}
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

export default ResourcesPage;
