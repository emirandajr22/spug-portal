import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import UserApprovalPage from "./pages/UserApprovalPage";
import UserManagementPage from "./pages/UserManagementPage";
import UploadPage from "./pages/UploadPage";
import SSOLoginPage from "./pages/SSOLoginPage";
import "./index.css";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-offwhite">
    <svg
      className="animate-spin w-8 h-8 text-teal"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  </div>
);

function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user && profile === null) return <Spinner />;
  return children;
}

/* superadmin only */
function SuperAdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user && profile === null) return <Spinner />;
  if (profile?.role !== "superadmin") return <Navigate to="/" replace />;
  return children;
}

/* superadmin + admin */
function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user && profile === null) return <Spinner />;
  if (!["superadmin", "admin"].includes(profile?.role))
    return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/sso-login" element={<SSOLoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/dpi"
        element={
          <ProtectedRoute>
            <DashboardPage dashboardKey="dpi" user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/inpc"
        element={
          <ProtectedRoute>
            <DashboardPage dashboardKey="inpc" user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/cipc/busuanga"
        element={
          <ProtectedRoute>
            <DashboardPage dashboardKey="cipc_busuanga" user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/cipc/coron"
        element={
          <ProtectedRoute>
            <DashboardPage dashboardKey="cipc_coron" user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/cipc/epsa"
        element={
          <ProtectedRoute>
            <DashboardPage dashboardKey="cipc_epsa" user={user} />
          </ProtectedRoute>
        }
      />

      {/* Upload — superadmin + admin */}
      <Route
        path="/admin/upload"
        element={
          <AdminRoute>
            <UploadPage />
          </AdminRoute>
        }
      />

      {/* SuperAdmin only */}
      <Route
        path="/admin/approvals"
        element={
          <SuperAdminRoute>
            <UserApprovalPage />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <SuperAdminRoute>
            <UserManagementPage />
          </SuperAdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
