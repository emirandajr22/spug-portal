import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import { UserCheck, UserX, Clock, Search, RefreshCw } from "lucide-react";

export default function UserApprovalPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("spug")
      .from("users")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const handleAction = async (userId, action) => {
    setActionLoading(userId + action);
    const newStatus = action === "approve" ? "active" : "rejected";

    const { error } = await supabase
      .schema("spug")
      .from("users")
      .update({ status: newStatus })
      .eq("id", userId);

    if (!error) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(
        action === "approve"
          ? "User approved successfully."
          : "User rejected.",
        action === "approve" ? "green" : "red"
      );
    }
    setActionLoading(null);
  };

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-dark">User Approval</h1>
            <p className="text-gray-500 text-sm mt-1">
              Review and approve pending account requests.
            </p>
          </div>
          <button
            onClick={fetchPendingUsers}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-dark transition px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-4 text-sm px-4 py-2.5 rounded-lg border ${
              toast.color === "green"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={search.length > 0} />
        ) : (
          <div className="space-y-3">
            {filtered.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onAction={handleAction}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function UserCard({ user, onAction, actionLoading }) {
  const initials = user.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
      {/* Avatar + Info */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-sky-100 text-primary font-semibold flex items-center justify-center text-sm flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-medium text-dark text-sm">{user.full_name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
          <div className="flex gap-2 mt-1">
            {user.position && (
              <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                {user.position}
              </span>
            )}
            {user.department && (
              <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                {user.department}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Date + Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
          <Clock size={13} />
          {new Date(user.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <button
          onClick={() => onAction(user.id, "reject")}
          disabled={!!actionLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50 transition disabled:opacity-50"
        >
          <UserX size={14} />
          Reject
        </button>
        <button
          onClick={() => onAction(user.id, "approve")}
          disabled={!!actionLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs hover:bg-dark transition disabled:opacity-50"
        >
          <UserCheck size={14} />
          Approve
        </button>
      </div>
    </div>
  );
}

function EmptyState({ hasSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
        <UserCheck size={24} className="text-green-500" />
      </div>
      <p className="font-medium text-dark">
        {hasSearch ? "No matching requests found." : "All caught up!"}
      </p>
      <p className="text-gray-400 text-sm mt-1">
        {hasSearch
          ? "Try a different search term."
          : "There are no pending account approvals."}
      </p>
    </div>
  );
}
