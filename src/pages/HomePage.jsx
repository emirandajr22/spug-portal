import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  Zap,
  LogOut,
  ChevronRight,
  Activity,
  Building2,
  UserCircle,
  UserCheck,
  Users,
  ChevronDown,
  Upload,
} from "lucide-react";

const COMPANIES = [
  {
    id: "dpi",
    name: "Delta P, Inc.",
    short: "DPI",
    description: "View energy generation & billing dashboard.",
    route: "/dashboard/dpi",
    gradientFrom: "#00313a",
    gradientTo: "#75b5b4",
    emoji: "⚡",
    location: "Palawan Grid · SPUG Area",
    subDashboards: null,
  },
  {
    id: "inpc",
    name: "Isla Norte Power Corporation",
    short: "INPC",
    description: "View energy generation & billing dashboard.",
    route: "/dashboard/inpc",
    gradientFrom: "#005697",
    gradientTo: "#9bbfde",
    emoji: "🔋",
    location: "Northern Islands · SPUG Area",
    subDashboards: null,
  },
  {
    id: "cipc",
    name: "Calamian Islands Power Corporation",
    short: "CIPC",
    description: "Multi-site energy dashboard — select a location.",
    route: null,
    gradientFrom: "#4a3f7a",
    gradientTo: "#a49fc8",
    emoji: "🏝️",
    location: "Busuanga · Coron · EPSA",
    subDashboards: [
      { label: "Busuanga", route: "/dashboard/cipc/busuanga" },
      { label: "Coron", route: "/dashboard/cipc/coron" },
      { label: "EPSA", route: "/dashboard/cipc/epsa" },
    ],
  },
];

export default function HomePage({ user }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "superadmin";
  const isAdmin = profile?.role === "admin";
  const canUpload = isSuperAdmin || isAdmin;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const username = profile?.full_name || user?.email || "User";

  async function handleLogout() {
    const returnUrl = localStorage.getItem("sso_return_url");

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

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* ── Header ── */}
      <header className="bg-moss text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal rounded-xl flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl leading-tight">
                SPUG Energy Portal
              </h1>
              <p className="text-teal-light text-xs">
                Small Power Utilities Group
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* SuperAdmin nav links */}
            {isSuperAdmin && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => navigate("/admin/approvals")}
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white border border-transparent hover:border-white/20 rounded-lg px-3 py-1.5 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Approvals
                </button>
                <button
                  onClick={() => navigate("/admin/users")}
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white border border-transparent hover:border-white/20 rounded-lg px-3 py-1.5 transition-all"
                >
                  <Users className="w-3.5 h-3.5" /> Users
                </button>
                <button
                  onClick={() => navigate("/admin/upload")}
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white border border-transparent hover:border-white/20 rounded-lg px-3 py-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>
            )}
            {/* Admin nav — upload only */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => navigate("/admin/upload")}
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white border border-transparent hover:border-white/20 rounded-lg px-3 py-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>
            )}

            {/* User dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 text-white/80 hover:text-white
                           text-sm border border-white/20 hover:border-white/40
                           rounded-lg px-3 py-1.5 transition-all"
              >
                <UserCircle className="w-4 h-4" />
                <span className="hidden sm:block max-w-[140px] truncate">
                  {username}
                </span>
                {(isSuperAdmin || isAdmin) && (
                  <span className="hidden sm:block text-xs bg-white/20 text-white/90 px-1.5 py-0.5 rounded-full capitalize">
                    {isSuperAdmin ? "Super Admin" : "Admin"}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
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

      {/* ── Ticker banner ── */}
      <div className="bg-sky/50 border-b border-teal/20 overflow-hidden py-2">
        <div className="scroll-animate text-moss text-xs font-mono px-8">
          {[1, 2].map((n) => (
            <span key={n}>
              <Activity className="inline w-3 h-3 mr-1 text-teal" />
              SPUG Energy Dashboard &nbsp;·&nbsp; DPI — Delta P, Inc.
              &nbsp;·&nbsp; INPC — Isla Norte Power Corporation &nbsp;·&nbsp;
              CIPC — Busuanga &nbsp;·&nbsp; CIPC — Coron &nbsp;·&nbsp; CIPC —
              EPSA &nbsp;·&nbsp; Data updated monthly &nbsp;·&nbsp;
              VEC-Settlement © {new Date().getFullYear()}{" "}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="font-display text-3xl text-moss mb-2">
            Energy Dashboards
          </h2>
          <p className="text-moss/60 text-sm">
            Select a utility company to view its energy performance dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMPANIES.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-2xl shadow-card overflow-hidden border
                         border-sky/30 hover:shadow-glow transition-all duration-300"
            >
              {/* Gradient banner */}
              <div
                className="h-32 relative flex items-end p-5"
                style={{
                  background: `linear-gradient(135deg, ${company.gradientFrom}, ${company.gradientTo})`,
                }}
              >
                <svg
                  className="absolute inset-0 w-full h-full opacity-10"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id={`dots-${company.id}`}
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="10" cy="10" r="1" fill="white" />
                    </pattern>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill={`url(#dots-${company.id})`}
                  />
                </svg>
                <span className="text-4xl relative z-10">{company.emoji}</span>
                <span
                  className="absolute top-4 right-4 bg-white/20 text-white/90
                                 text-xs font-mono font-semibold px-2 py-1 rounded-lg"
                >
                  {company.short}
                </span>
              </div>

              {/* Card body */}
              <div className="p-5">
                <h3 className="font-semibold text-moss text-base leading-snug mb-0.5">
                  {company.name}
                </h3>
                <p className="text-teal text-xs font-medium mb-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {company.location}
                </p>
                <p className="text-moss/55 text-sm mb-4">
                  {company.description}
                </p>

                {company.subDashboards ? (
                  <div className="space-y-2">
                    {company.subDashboards.map((sub) => (
                      <button
                        key={sub.route}
                        onClick={() => navigate(sub.route)}
                        className="w-full flex items-center justify-between
                                   bg-offwhite hover:bg-sky/50 rounded-xl
                                   px-4 py-2.5 text-sm font-medium text-moss
                                   transition-all group"
                      >
                        {sub.label}
                        <ChevronRight
                          className="w-4 h-4 text-teal opacity-0
                                                  group-hover:opacity-100 transition-opacity"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(company.route)}
                    className="w-full bg-moss hover:bg-moss-light text-white rounded-xl
                               py-2.5 text-sm font-semibold transition-all
                               flex items-center justify-center gap-2 group"
                  >
                    Go to Dashboard
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center text-moss/40 text-xs py-6 border-t border-sky/30">
        Created by: VEC-Settlement &nbsp;·&nbsp; © {new Date().getFullYear()}{" "}
        All rights reserved.
      </footer>
    </div>
  );
}
