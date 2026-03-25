import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import UserHome from "@/pages/UserHome";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminSubscribers from "@/pages/AdminSubscribers";
import Plans from "@/pages/Plans";
import Checkout from "@/pages/Checkout";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/context/auth";

function PrivateRoute({ children, adminOnly = false, allowedRoles }) {
  const { user, booting } = useAuth();

  if (booting) return null;
  if (!user) return <Navigate to="/" replace />;

  if (adminOnly && user.role !== "ADMIN") return <Navigate to="/home" replace />;

  if (Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
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
        <Route
          path="/plans"
          element={
            <PrivateRoute allowedRoles={["ADMIN", "OWNER"]}>
              <Plans />
            </PrivateRoute>
          }
        />
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route
          path="/admin"
          element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>}
        />
        <Route
          path="/admin/subscribers"
          element={<PrivateRoute adminOnly><AdminSubscribers /></PrivateRoute>}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
