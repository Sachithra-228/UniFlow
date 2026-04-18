import { CheckCircle2, Link2, SearchX, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  approveAdminLinkRequest,
  fetchAdminLinkRequests,
  fetchUsers,
  rejectAdminLinkRequest,
} from "../api/campusApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { useToast } from "../hooks/useToast";
import { formatDateTime } from "../utils/format";

const STATUS_OPTIONS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

function AdminLinkRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [targetUsersByRequest, setTargetUsersByRequest] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [requestsResponse, usersResponse] = await Promise.all([
          fetchAdminLinkRequests(statusFilter === "ALL" ? undefined : statusFilter),
          fetchUsers({ page: 0, size: 500 }),
        ]);

        setRequests(requestsResponse.items);
        setUsers(usersResponse.items);

        setTargetUsersByRequest((current) => {
          const next = { ...current };
          requestsResponse.items.forEach((request) => {
            if (next[request.id]) return;
            const matchingUser = usersResponse.items.find((user) => {
              const userEmail = String(user.email ?? "").toLowerCase();
              const userGoogleEmail = String(user.googleEmail ?? "").toLowerCase();
              const requestEmail = String(request.requestedGoogleEmail ?? "").toLowerCase();
              return userEmail === requestEmail || userGoogleEmail === requestEmail;
            });

            if (matchingUser) {
              next[request.id] = String(matchingUser.id);
            }
          });
          return next;
        });
      } catch (error) {
        addToast({
          type: "error",
          title: "Link requests unavailable",
          message: error?.response?.data?.message || "Failed to load account-link requests.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [addToast, statusFilter]);

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "PENDING").length,
    [requests]
  );

  async function handleApprove(request) {
    const selectedUserId = Number(targetUsersByRequest[request.id]);
    if (!Number.isFinite(selectedUserId)) {
      addToast({
        type: "error",
        title: "Target user required",
        message: "Select a user account before approving this link request.",
      });
      return;
    }

    const currentActionKey = `approve-${request.id}`;
    setActionKey(currentActionKey);
    try {
      const response = await approveAdminLinkRequest(request.id, { userId: selectedUserId, note: "" });
      setRequests((current) =>
        current.map((item) => (item.id === request.id ? response.data : item))
      );
      addToast({
        type: "success",
        title: "Link request approved",
        message: "Google account link has been approved.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Approve failed",
        message: error?.response?.data?.message || "Unable to approve link request.",
      });
    } finally {
      setActionKey("");
    }
  }

  async function handleReject(request) {
    const currentActionKey = `reject-${request.id}`;
    setActionKey(currentActionKey);
    try {
      const response = await rejectAdminLinkRequest(request.id, { note: "" });
      setRequests((current) =>
        current.map((item) => (item.id === request.id ? response.data : item))
      );
      addToast({
        type: "info",
        title: "Link request rejected",
        message: "The mismatched Google account link request was rejected.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Reject failed",
        message: error?.response?.data?.message || "Unable to reject link request.",
      });
    } finally {
      setActionKey("");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Admin Workflow
        </p>
        <h2 className="mt-2 text-2xl font-bold">Pending Google Link Requests</h2>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Review mismatched Google-account linking requests and decide whether to approve or reject.
        </p>
      </Card>

      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm dark:bg-white/[0.08]">
            <span className="font-semibold text-[color:var(--text-muted)]">Pending:</span>
            <span className="font-bold">{pendingCount}</span>
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm outline-none dark:bg-white/[0.08]"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All Statuses" : status}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <LoadingSkeleton key={index} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No link requests"
            description="No account-link requests matched your current status filter."
            icon={SearchX}
          />
        ) : (
          <div className="fine-scrollbar overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                <tr>
                  <th className="pb-3">Request</th>
                  <th className="pb-3">Google Email</th>
                  <th className="pb-3">Target User</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {requests.map((request) => {
                  const approveKey = `approve-${request.id}`;
                  const rejectKey = `reject-${request.id}`;
                  const busy = actionKey === approveKey || actionKey === rejectKey;

                  return (
                    <tr key={request.id}>
                      <td className="py-3">
                        <p className="font-semibold">#{request.id}</p>
                        <p className="text-xs text-[color:var(--text-muted)]">
                          {request.requestedDisplayName || "Unknown display name"}
                        </p>
                      </td>
                      <td className="py-3">
                        <p className="font-semibold">{request.requestedGoogleEmail}</p>
                      </td>
                      <td className="py-3">
                        {request.status === "PENDING" ? (
                          <select
                            value={targetUsersByRequest[request.id] || ""}
                            onChange={(event) =>
                              setTargetUsersByRequest((current) => ({
                                ...current,
                                [request.id]: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-xs outline-none dark:bg-white/[0.08]"
                          >
                            <option value="">Select user to link</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email} ({user.email})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs text-[color:var(--text-muted)]">
                            Linked User ID: {request.targetUserId ?? "N/A"}
                          </p>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge value={request.status} />
                      </td>
                      <td className="py-3 text-xs text-[color:var(--text-muted)]">
                        {formatDateTime(request.createdAt)}
                      </td>
                      <td className="py-3">
                        {request.status === "PENDING" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request)}
                              loading={actionKey === approveKey}
                              disabled={busy}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReject(request)}
                              loading={actionKey === rejectKey}
                              disabled={busy}
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[color:var(--text-muted)]">
                            <Link2 className="h-3.5 w-3.5" />
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default AdminLinkRequestsPage;

