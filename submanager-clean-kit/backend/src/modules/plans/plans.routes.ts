import { Router } from "express";
import {
  createPlan,
  deletePlan,
  getPlanById,
  listPlans,
  updatePlan,
} from "./plans.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const router = Router();

router.get("/", listPlans);
router.get("/:id", getPlanById);
router.post("/", requireAuth, requireRole("ADMIN", "OWNER"), createPlan);
router.patch("/:id", requireAuth, requireRole("ADMIN", "OWNER"), updatePlan);
router.delete("/:id", requireAuth, requireRole("ADMIN", "OWNER"), deletePlan);

export { router as plansRouter };
