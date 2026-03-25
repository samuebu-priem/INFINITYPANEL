import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import plansRoutes from "./routes/plansRoutes.js";
import subscriptionsRoutes from "./routes/subscriptionsRoutes.js";
import paymentsRoutes from "./routes/paymentsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "submanager-backend" });
});

app.use(authRoutes);
app.use("/plans", plansRoutes);
app.use("/subscriptions", subscriptionsRoutes);
app.use(paymentsRoutes);

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
