import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { checkoutRouter } from "../modules/checkout/checkout.routes.js";
import { plansRouter } from "../modules/plans/plans.routes.js";
import { subscriptionsRouter } from "../modules/subscriptions/subscriptions.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";
import { devPaymentsRouter } from "../modules/devPayments/devPayments.routes.js";
import { paymentsRouter } from "../modules/payments/payments.routes.js";
import { internalMatchesRouter } from "../modules/internal/internal-matches.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { profileRouter } from "../modules/profile/index.js";
import { rankingsRouter } from "../modules/rankings/index.js";


export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/checkout", checkoutRouter);
apiRouter.use("/plans", plansRouter);
apiRouter.use("/subscriptions", subscriptionsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/internal/matches", internalMatchesRouter);
apiRouter.use("/dev/payments", devPaymentsRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/rankings", rankingsRouter);
