import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import AppRoutes from "./routes";
import "./index.css";
import { AuthProvider } from "./context/auth";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRoutes />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  </React.StrictMode>
);
