import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/context/auth";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminSubscribers from "@/pages/AdminSubscribers";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Plans from "@/pages/Plans";
import Register from "@/pages/Register";
import UserHome from "@/pages/UserHome";

function hasRequiredRole(userRole, allowedRoles) {
  return Boolean(userRole) && allowedRoles.includes(userRole);
}

function PrivateRoute({ children, allowedRoles }) {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/" replace />;

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !hasRequiredRole(user.role, allowedRoles)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<PrivateRoute><UserHome /></PrivateRoute>} />
        <Route path="/plans" element={<PrivateRoute allowedRoles={["ADMIN", "OWNER", "PLAYER"]}><Plans /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute allowedRoles={["ADMIN", "OWNER"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/subscribers" element={<PrivateRoute allowedRoles={["ADMIN", "OWNER"]}><AdminSubscribers /></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
