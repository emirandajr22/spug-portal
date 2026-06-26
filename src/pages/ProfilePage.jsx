import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import {
  User, Mail, Briefcase, Building2, ShieldCheck,
  Clock, Pencil, Check, X, Phone, CalendarCheck, LogIn
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    full_name:    "",
    phone_number: "",
    position:     "",
    department:   "",
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const { data, error } = await supabase
        .schema("spug")
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setForm({
        full_name:    data.full_name    || "",
        phone_number: data.phone_number || "",
        position:     data.position     || "",
        department:   data.department   || "",
      });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase
        .schema("spug")
        .from("users")
        .update({
          full_name:    form.full_name,
          phone_number: form.phone_number,
          position:     form.position,
          department:   form.department,
        })
        .eq("id", profile.id);

      if (error) throw error;
      setProfile((prev) => ({ ...prev, ...form }));
      setSuccess("Profile updated.");
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm({
      full_name:    profile.full_name    || "",
      phone_number: profile.phone_number || "",
      position:     profile.position     || "",
      department:   profile.department   || "",
    });
    setEditing(false);
    setError(null);
  };

  const fmt = (ts) =>
    ts ? new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

  const statusColor = {
    active:   "bg-green-100 text-green-700 border-green-200",
    pending:  "bg-yellow-100 text-yellow-700 border-yellow-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };
  const roleColor = {
    admin: "bg-violet-100 text-violet-700 border-violet-200",
    user:  "bg-sky-100 text-sky-700 border-sky-200",
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-dark">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">View and update your account information.</p>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm mb-4 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-moss to-teal" />

          <div className="px-8 pb-8">
            {/* Avatar + badges */}
            <div className="flex items-end justify-between -mt-10 mb-6">
              <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center">
                <span className="text-2xl font-bold text-moss">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex gap-2 mt-12">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${roleColor[profile?.role] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  {profile?.role}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusColor[profile?.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  {profile?.status}
                </span>
              </div>
            </div>

            {/* ── Editable fields ── */}
            <div className="space-y-5">
              {/* Full name — full width */}
              <Field
                icon={<User size={15} />}
                label="Full Name"
                value={form.full_name}
                editing={editing}
                onChange={(v) => setForm(f => ({ ...f, full_name: v }))}
              />

              {/* Read-only email */}
              <Field
                icon={<Mail size={15} />}
                label="Email"
                value={profile?.email}
                editing={false}
                hint="Cannot be changed"
              />

              <Field
                icon={<Phone size={15} />}
                label="Phone Number"
                value={form.phone_number}
                editing={editing}
                onChange={(v) => setForm(f => ({ ...f, phone_number: v }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field icon={<Briefcase size={15} />} label="Position"   value={form.position}   editing={editing} onChange={(v) => setForm(f => ({ ...f, position: v }))} />
                <Field icon={<Building2 size={15} />} label="Department" value={form.department} editing={editing} onChange={(v) => setForm(f => ({ ...f, department: v }))} />
              </div>

              {/* ── Read-only info chips ── */}
              <div className="border-t border-gray-100 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InfoChip icon={<ShieldCheck size={13} />}   label="Role"       value={profile?.role} />
                <InfoChip icon={<Clock size={13} />}         label="Joined"     value={fmt(profile?.created_at)} />
                <InfoChip icon={<CalendarCheck size={13} />} label="Approved"   value={fmt(profile?.approved_at)} />
                <InfoChip icon={<LogIn size={13} />}         label="Last Login" value={fmt(profile?.last_login)} />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3 justify-end">
              {editing ? (
                <>
                  <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm transition">
                    <X size={15} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-moss text-white text-sm hover:bg-dark transition disabled:opacity-60">
                    <Check size={15} /> {saving ? "Saving…" : "Save Changes"}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-moss text-white text-sm hover:bg-dark transition">
                  <Pencil size={15} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ icon, label, value, editing, onChange, hint }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
        {icon} {label}
        {hint && <span className="ml-auto text-gray-300 font-normal">{hint}</span>}
      </label>
      {editing && onChange ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal outline-none text-sm text-dark"
        />
      ) : (
        <p className="text-sm text-dark font-medium px-1">{value || "—"}</p>
      )}
    </div>
  );
}

function InfoChip({ icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
      <p className="flex items-center gap-1 text-xs text-gray-400 mb-1">{icon} {label}</p>
      <p className="text-xs font-semibold text-dark capitalize">{value || "—"}</p>
    </div>
  );
}
