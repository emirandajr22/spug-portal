import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  Zap,
  LogOut,
  Home,
  Activity,
  UserCircle,
  UserCheck,
  Users,
  ChevronDown,
  Upload,
} from "lucide-react";

export default function DashboardLayout({
  children,
  title,
  subtitle,
  tickerItems = [],
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const isSuperAdmin = profile?.role === "superadmin";
  const isAdmin = profile?.role === "admin";
  const canUpload = isSuperAdmin || isAdmin;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const username = profile?.full_name || user?.email || "User";

  async function handleLogout() {
    const returnUrl = localStorage.getItem("sso_return_url");

    console.log("Return URL:", returnUrl);

    await supabase.auth.signOut();

    localStorage.removeItem("sso_return_url");

    if (returnUrl) {
      window.location.href = returnUrl;
      return;
    }

    navigate("/login", { replace: true });
  }

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const tickerText =
    tickerItems.length > 0
      ? [...tickerItems, ...tickerItems].join("  ·  ")
      : "";

  const roleBadgeColor = {
    superadmin: "bg-violet-500/20 text-white/90",
    admin: "bg-white/20 text-white/90",
    user: "bg-white/10 text-white/70",
  };

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <header className="bg-moss text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 transition-all"
            >
              <Home className="w-4 h-4" /> Home
            </button>
            <span className="w-px h-6 bg-white/20" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-display text-lg leading-tight">
                  {title || "SPUG Energy Portal"}
                </h1>
                {subtitle && (
                  <p className="text-teal-light text-xs">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* SuperAdmin nav links */}
            {isSuperAdmin && (
              <div className="hidden sm:flex items-center gap-1">
                <NavLink
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                  label="Approvals"
                  active={location.pathname === "/admin/approvals"}
                  onClick={() => navigate("/admin/approvals")}
                />
                <NavLink
                  icon={<Users className="w-3.5 h-3.5" />}
                  label="Users"
                  active={location.pathname === "/admin/users"}
                  onClick={() => navigate("/admin/users")}
                />
                <NavLink
                  icon={<Upload className="w-3.5 h-3.5" />}
                  label="Upload"
                  active={location.pathname === "/admin/upload"}
                  onClick={() => navigate("/admin/upload")}
                />
              </div>
            )}

            {/* Admin — upload only */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-1">
                <NavLink
                  icon={<Upload className="w-3.5 h-3.5" />}
                  label="Upload"
                  active={location.pathname === "/admin/upload"}
                  onClick={() => navigate("/admin/upload")}
                />
              </div>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 text-white/80 hover:text-white text-sm border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 transition-all"
              >
                <UserCircle className="w-4 h-4" />
                <span className="hidden sm:block max-w-[120px] truncate">
                  {username}
                </span>
                {(isSuperAdmin || isAdmin) && (
                  <span
                    className={`hidden sm:block text-xs px-1.5 py-0.5 rounded-full capitalize ${roleBadgeColor[profile?.role] || "bg-white/20 text-white/90"}`}
                  >
                    {isSuperAdmin ? "Super Admin" : "Admin"}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                  <p className="text-xs text-gray-400 px-3 py-1.5 font-medium truncate">
                    {user?.email}
                  </p>
                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => {
                      navigate("/profile");
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <UserCircle className="w-4 h-4 text-gray-400" /> My Profile
                  </button>

                  {/* SuperAdmin dropdown items */}
                  {isSuperAdmin && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <p className="text-xs text-gray-400 px-3 py-1 font-medium">
                        Super Admin
                      </p>
                      <button
                        onClick={() => {
                          navigate("/admin/approvals");
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <UserCheck className="w-4 h-4 text-gray-400" /> User
                        Approvals
                      </button>
                      <button
                        onClick={() => {
                          navigate("/admin/users");
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Users className="w-4 h-4 text-gray-400" /> Manage Users
                      </button>
                      <button
                        onClick={() => {
                          navigate("/admin/upload");
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Upload className="w-4 h-4 text-gray-400" /> Upload Data
                      </button>
                    </>
                  )}

                  {/* Admin dropdown items — upload only */}
                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <p className="text-xs text-gray-400 px-3 py-1 font-medium">
                        Admin
                      </p>
                      <button
                        onClick={() => {
                          navigate("/admin/upload");
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Upload className="w-4 h-4 text-gray-400" /> Upload Data
                      </button>
                    </>
                  )}

                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {tickerText && (
        <div className="bg-sky/50 border-b border-teal/20 overflow-hidden py-2">
          <div className="scroll-animate text-moss text-xs font-mono px-8">
            <Activity className="inline w-3 h-3 mr-2 text-teal" />
            {tickerText}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="text-center text-moss/40 text-xs py-6 border-t border-sky/30 mt-4">
        Created by: VEC-Settlement &nbsp;·&nbsp; © {new Date().getFullYear()}{" "}
        All rights reserved.
      </footer>
    </div>
  );
}

function NavLink({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 transition-all
        ${
          active
            ? "bg-white/20 text-white border border-white/30"
            : "text-white/60 hover:text-white border border-transparent hover:border-white/20"
        }`}
    >
      {icon} {label}
    </button>
  );
}
