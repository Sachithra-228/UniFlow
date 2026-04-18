import { Filter, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { deleteAdminUser, fetchUsers, inviteAdminUser, updateAdminUser } from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import Modal from "../components/common/Modal";
import { useToast } from "../hooks/useToast";
import { titleCase } from "../utils/format";
import { normalizeRole } from "../utils/roles";

const ROLE_OPTIONS = ["STUDENT", "STAFF", "TECHNICIAN", "ADMIN"];
const ACCOUNT_STATUS_OPTIONS = ["ACTIVE", "INVITED", "DISABLED"];

const initialInviteForm = {
  name: "",
  email: "",
  role: "STUDENT",
};

const initialEditForm = {
  name: "",
  role: "STUDENT",
  accountStatus: "ACTIVE",
};

const USER_ROLE_STYLES = {
  STUDENT: {
    cardBg:
      "bg-gradient-to-br from-cyan-300/30 via-cyan-200/24 to-cyan-50/80 dark:from-cyan-800/40 dark:via-cyan-900/24 dark:to-[color:var(--bg-soft)]/88",
    iconWrap: "bg-cyan-200/55 dark:bg-cyan-900/45",
    iconColor: "text-cyan-800 dark:text-cyan-100",
  },
  STAFF: {
    cardBg:
      "bg-gradient-to-br from-emerald-300/30 via-emerald-200/24 to-emerald-50/80 dark:from-emerald-800/40 dark:via-emerald-900/24 dark:to-[color:var(--bg-soft)]/88",
    iconWrap: "bg-emerald-200/55 dark:bg-emerald-900/45",
    iconColor: "text-emerald-800 dark:text-emerald-100",
  },
  TECHNICIAN: {
    cardBg:
      "bg-gradient-to-br from-amber-300/34 via-amber-200/26 to-amber-50/82 dark:from-amber-800/42 dark:via-amber-900/26 dark:to-[color:var(--bg-soft)]/88",
    iconWrap: "bg-amber-200/55 dark:bg-amber-900/45",
    iconColor: "text-amber-800 dark:text-amber-100",
  },
  ADMIN: {
    cardBg:
      "bg-gradient-to-br from-rose-300/30 via-rose-200/24 to-rose-50/80 dark:from-rose-800/40 dark:via-rose-900/24 dark:to-[color:var(--bg-soft)]/88",
    iconWrap: "bg-rose-200/55 dark:bg-rose-900/45",
    iconColor: "text-rose-800 dark:text-rose-100",
  },
};

function getUserRoleStyles(role) {
  return USER_ROLE_STYLES[normalizeRole(role) ?? "STUDENT"] ?? USER_ROLE_STYLES.STUDENT;
}

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [openInviteModal, setOpenInviteModal] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteForm, setInviteForm] = useState(initialInviteForm);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editTargetUserId, setEditTargetUserId] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  const { addToast } = useToast();

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const response = await fetchUsers({ page: 0, size: 300 });
        setUsers(response.items);
      } catch {
        addToast({
          type: "error",
          title: "Users unavailable",
          message: "Failed to load user directory from backend.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [addToast]);

  const normalizedUsers = useMemo(() => {
    return users.map((user) => ({
      ...user,
      role: normalizeRole(user.role) ?? "STUDENT",
      accountStatus: user.accountStatus ?? "ACTIVE",
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return normalizedUsers.filter((user) => {
      const matchesQuery = [user.name, user.email].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [normalizedUsers, query, roleFilter]);

  function handleInviteInput(event) {
    const { name, value } = event.target;
    setInviteForm((current) => ({ ...current, [name]: value }));
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();
    const name = inviteForm.name.trim();
    const email = inviteForm.email.trim();

    if (!name || !email) {
      addToast({
        type: "error",
        title: "Validation error",
        message: "Name and email are required.",
      });
      return;
    }

    setInviteSubmitting(true);
    try {
      const response = await inviteAdminUser({
        name,
        email,
        role: inviteForm.role,
      });

      const invitedUser = response.data;
      setUsers((current) => [
        {
          id: invitedUser.id,
          name: invitedUser.name,
          email: invitedUser.email,
          role: invitedUser.role,
          provider: "local",
          accountStatus: invitedUser.accountStatus,
        },
        ...current.filter((user) => user.id !== invitedUser.id),
      ]);
      setInviteForm(initialInviteForm);
      setOpenInviteModal(false);

      const inviteCreated = Boolean(invitedUser.inviteTokenExpiresAt);
      const emailSent = invitedUser.invitationEmailSent !== false;
      const fallbackActivationLink = invitedUser.activationLink;

      addToast({
        type: emailSent ? "success" : "info",
        title: inviteCreated ? "User invited" : "User updated",
        message: invitedUser.message || (inviteCreated
          ? (emailSent
              ? `Invitation sent to ${invitedUser.email}.`
              : `Invite created but email failed. Share this activation link manually: ${fallbackActivationLink}`)
          : `${invitedUser.email} already exists. Role/profile details were updated.`),
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Invite failed",
        message: error?.response?.data?.message || "Could not create the user invitation.",
      });
    } finally {
      setInviteSubmitting(false);
    }
  }

  function openEditForUser(user) {
    setEditTargetUserId(user.id);
    setEditForm({
      name: user.name ?? "",
      role: user.role ?? "STUDENT",
      accountStatus: user.accountStatus ?? "ACTIVE",
    });
    setOpenEditModal(true);
  }

  function handleEditInput(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (!editTargetUserId) return;

    const name = editForm.name.trim();
    if (!name) {
      addToast({
        type: "error",
        title: "Validation error",
        message: "Name is required.",
      });
      return;
    }

    setEditSubmitting(true);
    try {
      const response = await updateAdminUser(editTargetUserId, {
        name,
        role: editForm.role,
        accountStatus: editForm.accountStatus,
      });

      const updatedUser = response.data;
      setUsers((current) =>
        current.map((user) =>
          user.id === updatedUser.id
            ? {
                ...user,
                ...updatedUser,
              }
            : user
        )
      );

      setOpenEditModal(false);
      setEditTargetUserId(null);
      setEditForm(initialEditForm);

      addToast({
        type: "success",
        title: "User updated",
        message: `${updatedUser.email} was updated successfully.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        message: error?.response?.data?.message || "Could not update user.",
      });
    } finally {
      setEditSubmitting(false);
    }
  }

  function openDeleteForUser(user) {
    setDeleteTarget(user);
    setOpenDeleteModal(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget?.id) return;

    setDeleteSubmitting(true);
    try {
      const response = await deleteAdminUser(deleteTarget.id);
      const hardDeleted = response?.data?.hardDeleted !== false;
      setUsers((current) => current.filter((user) => user.id !== deleteTarget.id));
      addToast({
        type: "success",
        title: hardDeleted ? "User deleted" : "User archived",
        message: hardDeleted
          ? `${deleteTarget.email} was removed.`
          : `${deleteTarget.email} had related records, so the account was archived instead.`,
      });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        message: error?.response?.data?.message || "Could not delete user.",
      });
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 dark:bg-[color:var(--bg-soft)]/80">
            <Search className="h-4 w-4 text-[color:var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users by name or email"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]/70"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
          >
            <option value="ALL">All Roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setViewMode((prev) => (prev === "table" ? "cards" : "table"))}>
              <Filter className="h-4 w-4" />
              {viewMode === "table" ? "Card View" : "Table View"}
            </Button>
            <Button onClick={() => setOpenInviteModal(true)}>
              <Plus className="h-4 w-4" />
              Create User
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        {loading ? (
          viewMode === "table" ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <LoadingSkeleton key={index} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <LoadingSkeleton key={index} className="h-[190px] rounded-2xl" />
              ))}
            </div>
          )
        ) : filteredUsers.length === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your search or role filters." />
        ) : viewMode === "table" ? (
          <UsersTable users={filteredUsers} onEdit={openEditForUser} onDelete={openDeleteForUser} />
        ) : (
          <UsersCards users={filteredUsers} onEdit={openEditForUser} onDelete={openDeleteForUser} />
        )}
      </Card>

      <Modal
        isOpen={openInviteModal}
        onClose={() => setOpenInviteModal(false)}
        title="Create User (Invite)"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenInviteModal(false)}>
              Cancel
            </Button>
            <Button form="invite-user-form" type="submit" loading={inviteSubmitting}>
              Send Invite
            </Button>
          </div>
        )}
      >
        <form id="invite-user-form" onSubmit={handleInviteSubmit} className="grid gap-4">
          <FormField label="Full Name">
            <input
              name="name"
              value={inviteForm.name}
              onChange={handleInviteInput}
              placeholder="E.g. Alex Perera"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              name="email"
              value={inviteForm.email}
              onChange={handleInviteInput}
              placeholder="name@campus.edu"
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
            />
          </FormField>

          <FormField label="Role">
            <select
              name="role"
              value={inviteForm.role}
              onChange={handleInviteInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </Modal>

      <Modal
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        title="Update User"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenEditModal(false)}>
              Cancel
            </Button>
            <Button form="edit-user-form" type="submit" loading={editSubmitting}>
              Save Changes
            </Button>
          </div>
        )}
      >
        <form id="edit-user-form" onSubmit={handleEditSubmit} className="grid gap-4">
          <FormField label="Full Name">
            <input
              name="name"
              value={editForm.name}
              onChange={handleEditInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
            />
          </FormField>

          <FormField label="Role">
            <select
              name="role"
              value={editForm.role}
              onChange={handleEditInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Account Status">
            <select
              name="accountStatus"
              value={editForm.accountStatus}
              onChange={handleEditInput}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-[color:var(--bg-soft)]/80"
            >
              {ACCOUNT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </Modal>

      <Modal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        title="Delete User"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleteSubmitting}>
              Delete User
            </Button>
          </div>
        )}
      >
        <p className="text-sm text-[color:var(--text-muted)]">
          Delete user <span className="font-semibold text-[color:var(--text)]">{deleteTarget?.email}</span>? This action cannot be undone and may fail if related records exist.
        </p>
      </Modal>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function UsersTable({ users, onEdit, onDelete }) {
  return (
    <div className="fine-scrollbar overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
          <tr>
            <th className="pb-3">Name</th>
            <th className="pb-3">Email</th>
            <th className="pb-3">Role</th>
            <th className="pb-3">Provider</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--border)]">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="py-3 font-semibold">{user.name}</td>
              <td className="py-3">{user.email}</td>
              <td className="py-3">
                <Badge value={titleCase(user.role)} />
              </td>
              <td className="py-3">
                <Badge value={titleCase(user.provider ?? "local")} />
              </td>
              <td className="py-3">
                <Badge value={titleCase(user.accountStatus ?? "active")} />
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--text)] hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(user)}
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

function UsersCards({ users, onEdit, onDelete }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => {
        const roleStyles = getUserRoleStyles(user.role);
        return (
        <article key={user.id} className={`rounded-2xl border border-[color:var(--border)] p-4 ${roleStyles.cardBg}`}>
          <div className="mb-3 flex items-center justify-between">
            <span className={`rounded-xl p-2 ${roleStyles.iconWrap}`}>
              <UserRound className={`h-4 w-4 ${roleStyles.iconColor}`} />
            </span>
            <Badge value={titleCase(user.role)} />
          </div>

          <p className="font-semibold">{user.name}</p>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">{user.email}</p>

          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="font-semibold text-[color:var(--text-muted)]">Provider:</span>
            <Badge value={titleCase(user.provider ?? "local")} />
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-semibold text-[color:var(--text-muted)]">Status:</span>
            <Badge value={titleCase(user.accountStatus ?? "active")} />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-[color:var(--border)] pt-3">
            <button
              type="button"
              onClick={() => onEdit(user)}
              className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--text)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Pencil className="h-3.5 w-3.5" />
              Update
            </button>
            <button
              type="button"
              onClick={() => onDelete(user)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-300 dark:hover:bg-rose-400/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </article>
      )})}
    </div>
  );
}

export default UsersPage;
