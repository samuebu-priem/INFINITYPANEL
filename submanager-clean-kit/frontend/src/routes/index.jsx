import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../layouts/AppShell.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Plans from "../pages/Plans.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import AdminSubscribers from "../pages/AdminSubscribers.jsx";
import UserHome from "../pages/UserHome.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <AppShell>
            <Navigate to="/dashboard" replace />
          </AppShell>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AppShell>
            <UserHome />
          </AppShell>
        }
      />
      <Route
        path="/plans"
        element={
          <AppShell>
            <Plans />
          </AppShell>
        }
      />
      <Route
        path="/admin"
        element={
          <AppShell>
            <AdminDashboard />
          </AppShell>
        }
      />
      <Route
        path="/admin/subscribers"
        element={
          <AppShell>
            <AdminSubscribers />
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
