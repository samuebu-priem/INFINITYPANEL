import { Router } from "express";
import { listSubscriptions } from "../controllers/subscriptionsController.js";

const router = Router();
router.get("/:email", listSubscriptions);
export default router;
