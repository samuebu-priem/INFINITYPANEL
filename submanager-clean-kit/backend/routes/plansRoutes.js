import { Router } from "express";
import { createPlan, listPlans } from "../controllers/plansController.js";

const router = Router();
router.get("/", listPlans);
router.post("/", createPlan);
export default router;
