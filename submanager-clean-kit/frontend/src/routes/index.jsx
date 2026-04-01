import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../layouts/AppShell.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Plans from "../pages/Plans.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import AdminSubscribers from "../pages/AdminSubscribers.jsx";
import UserHome from "../pages/UserHome.jsx";
import { useAuth } from "../context/auth.jsx";

function AdminOnlyRoute({ children }) {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return children;
}

function DefaultRedirect() {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<AppShell><DefaultRedirect /></AppShell>} />
      <Route path="/dashboard" element={<AppShell><UserHome /></AppShell>} />
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
