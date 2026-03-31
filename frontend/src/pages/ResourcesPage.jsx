import { Filter, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createResource, fetchResources } from "../api/campusApi";
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

  async function handleCreateResource(event) {
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
      const response = await createResource(payload);
      setResources((current) => [response.data, ...current]);
      setOpenModal(false);
      setForm(initialForm);

      addToast({
        type: "success",
        title: "Resource created",
        message: response.isFallback ? "Saved in mock fallback data." : "Resource is now available in inventory.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Create failed",
        message: error?.response?.data?.message || "Unable to create resource.",
      });
    } finally {
      setSubmitting(false);
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
            <Button onClick={() => setOpenModal(true)}>
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
              <Button onClick={() => setOpenModal(true)}>
                <Plus className="h-4 w-4" />
                Create Resource
              </Button>
            }
          />
        ) : viewMode === "table" ? (
          <ResourceTable resources={filteredResources} />
        ) : (
          <ResourceCards resources={filteredResources} />
        )}
      </Card>

      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Add Campus Resource"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button form="resource-form" type="submit" loading={submitting}>
              Save Resource
            </Button>
          </div>
        }
      >
        <form id="resource-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateResource}>
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
    </div>
  );
}

function ResourceTable({ resources }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResourceCards({ resources }) {
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
