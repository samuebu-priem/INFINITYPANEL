
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../layouts/AppShell.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Plans from "../pages/Plans.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import AdminSubscribers from "../pages/AdminSubscribers.jsx";
import AdminMediatorRanking from "../pages/AdminMediatorRanking.jsx";
import UserHome from "../pages/UserHome.jsx";
import Profile from "../pages/Profile.jsx";
import RankingPublic from "../pages/RankingPublic.jsx";
import TermsOfUse from "../pages/TermsOfUse.jsx";
import PrivacyPolicy from "../pages/PrivacyPolicy.jsx";
import FinancialTerms from "../pages/FinancialTerms.jsx";
import { useAuth } from "../context/auth.jsx";

/* ================= PROTECTIONS ================= */

function Protected({ children }) {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!["ADMIN", "OWNER"].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/* ================= REDIRECT ================= */

function RedirectByRole() {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Navigate
      to={user.role === "PLAYER" ? "/dashboard" : "/admin"}
      replace
    />
  );
}

/* ================= ROUTES ================= */

export default function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* TERMS */}
      <Route path="/termos-de-uso" element={<AppShell><TermsOfUse /></AppShell>} />
      <Route path="/politica-de-privacidade" element={<AppShell><PrivacyPolicy /></AppShell>} />
      <Route path="/termos-financeiros" element={<AppShell><FinancialTerms /></AppShell>} />

      {/* ROOT */}
      <Route path="/" element={<RedirectByRole />} />

      {/* APP (PLAYER) */}
      <Route
        path="/dashboard"
        element={
          <Protected>
            <AppShell>
              <UserHome />
            </AppShell>
          </Protected>
        }
      />

      <Route
        path="/profile"
        element={
          <Protected>
            <AppShell>
              <Profile />
            </AppShell>
          </Protected>
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <AppShell>
              <AdminDashboard />
            </AppShell>
          </AdminOnly>
        }
      />

      <Route
        path="/admin/subscribers"
        element={
          <AdminOnly>
            <AppShell>
              <AdminSubscribers />
            </AppShell>
          </AdminOnly>
        }
      />

      <Route
        path="/admin/mediators"
        element={
          <AdminOnly>
            <AppShell>
              <AdminMediatorRanking />
            </AppShell>
          </AdminOnly>
        }
      />

      <Route
        path="/ranking"
        element={
          <AdminOnly>
            <AppShell>
              <RankingPublic />
            </AppShell>
          </AdminOnly>
        }
      />

      <Route
        path="/plans"
        element={
          <AdminOnly>
            <AppShell>
              <Plans />
            </AppShell>
          </AdminOnly>
        }
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={
          <AppShell>
            <div className="p-8 text-white">
              página não encontrada
            </div>
          </AppShell>
        }
      />

    </Routes>
  );
}