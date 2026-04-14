import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../layouts/AppShell.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Plans from "../pages/Plans.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import AdminSubscribers from "../pages/AdminSubscribers.jsx";
import UserHome from "../pages/UserHome.jsx";
import Profile from "../pages/Profile.jsx";
import TermsOfUse from "../pages/TermsOfUse.jsx";
import PrivacyPolicy from "../pages/PrivacyPolicy.jsx";
import FinancialTerms from "../pages/FinancialTerms.jsx";
import { useAuth } from "../context/auth.jsx";

function ProtectedRoute({ children }) {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnlyRoute({ children }) {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!["ADMIN", "OWNER"].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function DefaultRedirect() {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === "PLAYER" ? "/dashboard" : "/admin"} replace />;
}

function LogoutRedirect() {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === "PLAYER" ? "/dashboard" : "/admin"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/termos-de-uso"
        element={
          <AppShell>
            <TermsOfUse />
          </AppShell>
        }
      />
      <Route
        path="/politica-de-privacidade"
        element={
          <AppShell>
            <PrivacyPolicy />
          </AppShell>
        }
      />
      <Route
        path="/termos-financeiros"
        element={
          <AppShell>
            <FinancialTerms />
          </AppShell>
        }
      />

      <Route path="/" element={<AppShell><DefaultRedirect /></AppShell>} />

      <Route
        path="/dashboard"
        element={
          <AppShell>
            <ProtectedRoute>
              <UserHome />
            </ProtectedRoute>
          </AppShell>
        }
      />

      <Route
        path="/profile"
        element={
          <AppShell>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </AppShell>
        }
      />

      <Route
        path="/plans"
        element={
          <AppShell>
            <AdminOnlyRoute>
              <Plans />
            </AdminOnlyRoute>
          </AppShell>
        }
      />

      <Route
        path="/admin"
        element={
          <AppShell>
            <AdminOnlyRoute>
              <AdminDashboard />
            </AdminOnlyRoute>
          </AppShell>
        }
      />

      <Route
        path="/admin/subscribers"
        element={
          <AppShell>
            <AdminOnlyRoute>
              <AdminSubscribers />
            </AdminOnlyRoute>
          </AppShell>
        }
      />

      <Route path="/logout" element={<LogoutRedirect />} />

      <Route
        path="*"
        element={
          <AppShell>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-8 text-white">
              Página não encontrada.
            </div>
          </AppShell>
        }
      />
    </Routes>
  );
}