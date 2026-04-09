import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "../pages/AdminDashboard";
import AdminSubscribers from "../pages/AdminSubscribers";
import Checkout from "../pages/Checkout";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Plans from "../pages/Plans";
import Register from "../pages/Register";
import UserHome from "../pages/UserHome";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/user-home" element={<UserHome />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/subscribers" element={<AdminSubscribers />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
