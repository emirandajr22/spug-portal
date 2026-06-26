import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import {
  Search, RefreshCw, Trash2,
  ShieldCheck, ShieldOff, Shield, ChevronDown, Users,
} from "lucide-react";

const STATUS_OPTIONS = ["active", "pending", "rejected"];
const ROLE_OPTIONS   = ["user", "admin", "superadmin"];

export default function UserManagementPage() {
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [filterRole,    setFilterRole]    = useState("all");
  const [toast,         setToast]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
    fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("spug")
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const updateUser = async (id, updates, successMsg) => {
    setActionLoading(id);
    const { error } = await supabase
      .schema("spug")
      .from("users")
      .update(updates)
      .eq("id", id);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      showToast(successMsg, "green");
    } else {
      showToast(error.message, "red");
    }
    setActionLoading(null);
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    const { error } = await supabase
      .schema("spug")
      .from("users")
      .delete()
      .eq("id", id);
    if (!error) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("User deleted.", "red");
    } else {
      showToast(error.message, "red");
    }
    setConfirmDelete(null);
    setActionLoading(null);
  };

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    const matchRole   = filterRole   === "all" || u.role   === filterRole;
    return matchSearch && matchStatus && matchRole;
  });

  const counts = {
    total:   users.length,
    active:  users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    admins:  users.filter((u) => ["admin", "superadmin"].includes(u.role)).length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-dark">User Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage roles, statuses, and accounts.</p>
          </div>
          <button onClick={fetchUsers}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-dark transition px-3 py-2 rounded-lg hover:bg-gray-100">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Users", value: counts.total,   color: "text-dark"        },
            { label: "Active",      value: counts.active,  color: "text-green-600"   },
            { label: "Pending",     value: counts.pending, color: "text-yellow-600"  },
            { label: "Admins",      value: counts.admins,  color: "text-violet-600"  },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-4 text-sm px-4 py-2.5 rounded-lg border ${
            toast.color === "green"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search users…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <SelectFilter value={filterStatus} onChange={setFilterStatus} options={["all", ...STATUS_OPTIONS]} label="Status" />
          <SelectFilter value={filterRole}   onChange={setFilterRole}   options={["all", ...ROLE_OPTIONS]}   label="Role"   />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={32} className="text-gray-300 mb-3" />
            <p className="font-medium text-dark">No users found.</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Department</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Role</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelf={user.auth_user_id === currentUserId}
                      onUpdateStatus={(status) => updateUser(user.id, { status }, `Status updated to ${status}.`)}
                      onUpdateRole={(role)     => updateUser(user.id, { role },   `Role updated to ${role}.`)}
                      onDelete={() => setConfirmDelete(user)}
                      actionLoading={actionLoading === user.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-dark text-lg mb-1">Delete User</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-dark">{confirmDelete.full_name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={!!actionLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition disabled:opacity-60">
                {actionLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function UserRow({ user, isSelf, onUpdateStatus, onUpdateRole, onDelete, actionLoading }) {
  const initials = user.full_name
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const statusColor = {
    active:   "bg-green-100 text-green-700",
    pending:  "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-600",
  };

  const roleStyle = {
    superadmin: { bg: "bg-violet-100 text-violet-700", icon: <Shield size={12} />,      label: "Super Admin" },
    admin:      { bg: "bg-sky-100 text-sky-700",       icon: <ShieldCheck size={12} />, label: "Admin"       },
    user:       { bg: "bg-gray-100 text-gray-600",     icon: <ShieldOff size={12} />,   label: "User"        },
  };

  const currentRole = roleStyle[user.role] || roleStyle.user;

  return (
    <tr className="hover:bg-gray-50 transition">
      {/* User */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sky-100 text-primary font-semibold flex items-center justify-center text-xs flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-medium text-dark text-sm flex items-center gap-1.5">
              {user.full_name}
              {isSelf && (
                <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">You</span>
              )}
            </p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="text-xs text-gray-500">{user.department || "—"}</span>
      </td>

      {/* Status dropdown */}
      <td className="px-4 py-3.5">
        <div className="relative inline-block">
          <select
            value={user.status}
            onChange={(e) => onUpdateStatus(e.target.value)}
            disabled={isSelf || actionLoading}
            className={`text-xs font-medium px-2.5 py-1 rounded-full appearance-none pr-6 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-default ${statusColor[user.status] || "bg-gray-100 text-gray-600"}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-white text-gray-700 capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          {!isSelf && (
            <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
          )}
        </div>
      </td>

      {/* Role dropdown */}
      <td className="px-4 py-3.5">
        <div className="relative inline-block">
          <select
            value={user.role}
            onChange={(e) => onUpdateRole(e.target.value)}
            disabled={isSelf || actionLoading}
            className={`text-xs font-medium pl-6 pr-6 py-1 rounded-full appearance-none border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-default ${currentRole.bg}`}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r} className="bg-white text-gray-700 capitalize">
                {r === "superadmin" ? "Super Admin" : r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          {/* Role icon */}
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {currentRole.icon}
          </span>
          {!isSelf && (
            <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
          )}
        </div>
      </td>

      {/* Joined */}
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <span className="text-xs text-gray-400">
          {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </td>

      {/* Delete */}
      <td className="px-5 py-3.5 text-right">
        <button onClick={onDelete} disabled={isSelf || actionLoading}
          title={isSelf ? "Cannot delete your own account" : "Delete user"}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-default">
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}

function SelectFilter({ value, onChange, options, label }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-primary outline-none bg-white capitalize">
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? `All ${label}s` : o === "superadmin" ? "Super Admin" : o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}
