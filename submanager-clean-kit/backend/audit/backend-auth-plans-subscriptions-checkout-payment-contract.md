# Backend Auth/Plans/Subscriptions/Checkout/Payment Contract Audit

This file documents the backend API contract that the frontend should consume directly.

## Scope Reviewed

Read and audited:
- `backend/src/modules/auth/auth.routes.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/plans/plans.routes.ts`
- `backend/src/modules/plans/plans.controller.ts`
- `backend/src/modules/checkout/checkout.routes.ts`
- `backend/src/modules/checkout/checkout.service.ts`
- `backend/src/modules/subscriptions/subscriptions.routes.ts`
- `backend/src/modules/subscriptions/subscriptions.service.ts`
- `backend/src/modules/payments/providers/paymentProvider.ts`
- `backend/src/modules/payments/providers/mercadoPagoProvider.ts`
- `backend/src/modules/users/users.routes.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/middlewares/role.middleware.ts`
- `backend/src/shared/types/auth.ts`
- `backend/prisma/schema.prisma`

---

## Shared Auth Contract

### JWT Payload
```ts
type JwtPayload = {
  sub: string;
  role: Role;
};
```

### Auth User on Request
```ts
type AuthUser = {
  id: string;
  role: Role;
};
```

### Roles
Exact values:
- `OWNER`
- `ADMIN`
- `PLAYER`

### Auth Middleware Behavior
`requireAuth`:
- Expects `Authorization: Bearer <token>`
- Verifies JWT using `env.JWT_SECRET`
- Looks up the user in the database by `sub`
- Sets `request.auth = { id, role }` from DB, not from token only

Failure modes:
- Missing or empty token -> `401 Missing authorization token`
- Invalid token -> `401 Invalid token`
- User not found -> `401 User not found`

`requireRole(...roles)`:
- Requires `request.auth`
- `401 Unauthorized` if missing auth
- `403 Forbidden` if role is not allowed

---

## Auth Endpoints

### `POST /api/auth/register`
Route:
- `authRouter.post("/register", authController.register)`

Auth:
- Public

Request:
- Controller parses `registerSchema.parse({ ...request.body, role: "PLAYER" })`
- Frontend should only send the fields accepted by `registerSchema`
- `role` is overridden to `PLAYER`

Behavior:
- Email is lowercased and trimmed
- Username is trimmed
- Duplicate email or username -> `409 Email or username already in use`
- Password is hashed with bcrypt
- Creates `playerProfile` when role is PLAYER
- Service supports ADMIN creation, but controller never allows it

Response `201`:
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "username": "string",
    "role": "PLAYER",
    "discordId": "string|null",
    "createdAt": "Date",
    "updatedAt": "Date",
    "playerProfile": { "nickname": "string" } | null,
    "adminProfile": { "isActive": boolean } | null
  },
  "accessToken": "string"
}
```

### `POST /api/auth/login`
Route:
- `authRouter.post("/login", authController.login)`

Auth:
- Public

Request:
```json
{
  "emailOrUsername": "string",
  "password": "string"
}
```

Behavior:
- If `emailOrUsername` contains `@`, it is lowercased and treated as email
- Otherwise treated as username
- Invalid credentials -> `401 Invalid credentials`

Response `200`:
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "username": "string",
    "role": "OWNER|ADMIN|PLAYER",
    "discordId": "string|null",
    "createdAt": "Date",
    "updatedAt": "Date",
    "playerProfile": { "nickname": "string" } | null,
    "adminProfile": { "isActive": boolean } | null
  },
  "accessToken": "string"
}
```

### `GET /api/auth/me`
Route:
- `authRouter.get("/me", requireAuth, authController.me)`

Auth:
- Bearer token required

Response `200`:
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "username": "string",
    "role": "OWNER|ADMIN|PLAYER",
    "discordId": "string|null",
    "createdAt": "Date",
    "updatedAt": "Date",
    "playerProfile": { "nickname": "string" } | null,
    "adminProfile": { "isActive": boolean } | null
  }
}
```

---

## Plans Endpoints

### `GET /api/plans`
Route:
- `plansRouter.get("/", requireAuth, requireRole("ADMIN", "OWNER", "PLAYER"), asyncHandler(plansController.list))`

Auth:
- Bearer token required

Roles:
- `ADMIN`
- `OWNER`
- `PLAYER`

Response `200`:
```json
{
  "plans": [
    {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "amount": "decimal-like value",
      "currency": "string",
      "billingCycle": "WEEKLY|MONTHLY|YEARLY",
      "isActive": true,
      "metadata": {},
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ]
}
```

Behavior:
- Returns active and inactive plans
- Sorted by `amount ASC`, then `createdAt ASC`

### `POST /api/plans`
Route:
- `plansRouter.post("/", requireAuth, requireRole("ADMIN", "OWNER"), asyncHandler(plansController.create))`

Auth:
- Bearer token required

Roles:
- `ADMIN`
- `OWNER`

Request body:
```json
{
  "name": "string",
  "description": "string|null",
  "amount": 0,
  "billingCycle": "string",
  "currency": "string",
  "metadata": "any"
}
```

Validation:
- `name` must be a string with trimmed length >= 2
- `amount` must be a finite number >= 0
- `billingCycle` defaults to `"MONTHLY"`
- `currency` defaults to `"BRL"`

Response `201`:
```json
{
  "plan": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "amount": "decimal-like value",
    "currency": "string",
    "billingCycle": "string",
    "isActive": true,
    "metadata": {},
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

### `PATCH /api/plans/:id`
Route:
- `plansRouter.patch("/:id", requireAuth, requireRole("ADMIN", "OWNER"), asyncHandler(plansController.update))`

Auth:
- Bearer token required

Roles:
- `ADMIN`
- `OWNER`

Request body:
```json
{
  "name": "string",
  "description": "string|null",
  "amount": 0,
  "billingCycle": "string",
  "currency": "string",
  "metadata": "any"
}
```

Response `200`:
```json
{
  "plan": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "amount": "decimal-like value",
    "currency": "string",
    "billingCycle": "string",
    "isActive": true,
    "metadata": {},
    "updatedAt": "Date"
  }
}
```

Errors:
- Missing id -> `400 Missing plan id`
- No valid fields -> `400 No valid fields to update`
- Not found -> `404 Plan not found`

### `PATCH /api/plans/:id/status`
Route:
- `plansRouter.patch("/:id/status", requireAuth, requireRole("ADMIN", "OWNER"), asyncHandler(plansController.updateStatus))`

Auth:
- Bearer token required

Roles:
- `ADMIN`
- `OWNER`

Request body:
```json
{ "isActive": true }
```

Response `200`:
```json
{
  "plan": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "amount": "decimal-like value",
    "currency": "string",
    "billingCycle": "string",
    "isActive": true,
    "updatedAt": "Date"
  }
}
```

Errors:
- Missing id -> `400 Missing plan id`
- `isActive` not boolean -> `400 `isActive` must be a boolean`
- Not found -> `404 Plan not found`

### `DELETE /api/plans/:id`
Route:
- `plansRouter.delete("/:id", requireAuth, requireRole("ADMIN", "OWNER"), asyncHandler(plansController.remove))`

Auth:
- Bearer token required

Roles:
- `ADMIN`
- `OWNER`

Response:
- If linked to subscriptions:
```json
{
  "deleted": false,
  "deactivated": true,
  "message": "Plan is linked to subscriptions and cannot be deleted. It was deactivated instead."
}
```
- If deleted:
```json
{ "deleted": true }
```

Behavior:
- If linked subscriptions exist, the plan is soft-deactivated instead of deleted

---

## Checkout Endpoints

### `POST /api/checkout/create`
Route:
- `checkoutRouter.post("/create", requireAuth, requireRole("PLAYER", "ADMIN", "OWNER"), checkoutController.create)`

Auth:
- Bearer token required

Roles:
- `PLAYER`
- `ADMIN`
- `OWNER`

Service input:
```ts
{
  adminProfileId: string;
  planId: string;
}
```

Important mismatch:
- Route allows `PLAYER`, but service is admin-profile based
- Frontend should assume this flow is for admin subscriptions unless controller proves otherwise

Expected request body likely contains:
```json
{
  "adminProfileId": "string",
  "planId": "string"
}
```

Service response:
```json
{
  "checkoutSessionId": "string",
  "status": "PENDING|OPEN|COMPLETED|EXPIRED|CANCELLED",
  "provider": "MERCADO_PAGO",
  "plan": {
    "id": "string",
    "name": "string",
    "billingCycle": "WEEKLY|MONTHLY|YEARLY"
  },
  "amount": "string",
  "currency": "string",
  "checkoutUrl": "string|null",
  "qrCode": "string|null",
  "qrCodeBase64": "string|null",
  "expiresAt": "Date|null",
  "paymentTransactionId": "string|null"
}
```

Behavior:
- Plan must exist and be active -> otherwise `404 Plan not found`
- Admin profile must exist -> otherwise `404 Admin profile not found`
- Reuses existing PENDING/OPEN session if it already has checkout artifacts and is not expired
- Otherwise creates new checkout session and payment transaction
- Provider is hardcoded to `MERCADO_PAGO`

Risk:
- If `MERCADO_PAGO_ACCESS_TOKEN` is missing, provider returns a placeholder response with `status: "PENDING"` and no real checkout artifacts

### `GET /api/checkout/:id`
Route:
- `checkoutRouter.get("/:id", requireAuth, requireRole("PLAYER", "ADMIN", "OWNER"), checkoutController.getById)`

Auth:
- Bearer token required

Roles:
- `PLAYER`
- `ADMIN`
- `OWNER`

Expected response:
- Same shape as `POST /api/checkout/create`

Important mismatch:
- Service lookup is admin-scoped (`getCheckoutByIdForAdmin`)
- If controller derives adminProfileId from current user, non-admin users may get `403 Admin profile required`

---

## Subscriptions Endpoints

### `GET /api/subscriptions/me`
Route:
- `subscriptionsRouter.get("/me", requireAuth, requireRole("ADMIN", "OWNER"), subscriptionsController.me)`

Auth:
- Bearer token required

Roles:
- `ADMIN`
- `OWNER`

Service behavior:
- Uses current user’s admin profile
- Returns the latest subscription for that admin

Response `200`:
```json
{
  "subscription": null
}
```
or
```json
{
  "subscription": {
    "id": "string",
    "status": "PENDING|ACTIVE|EXPIRED|CANCELLED",
    "startsAt": "Date|null",
    "endsAt": "Date|null",
    "approvedAt": "Date|null",
    "createdAt": "Date"
  }
}
```

Note:
- Plan details are intentionally not returned yet

### `POST /api/subscriptions/start`
Route:
- `subscriptionsRouter.post("/start", requireAuth, requireRole("ADMIN", "OWNER"), subscriptionsController.start)`

Auth:
- Bearer token required

Roles:
- `ADMIN`
- `OWNER`

Input:
- `planId: string`

Response `200`:
```json
{
  "subscription": {
    "id": "string",
    "status": "PENDING",
    "createdAt": "Date"
  }
}
```

Behavior:
- Requires an admin profile
- Plan must exist and be active
- If an ACTIVE subscription already exists, returns `409 Active subscription already exists`

---

## Users Routes

### `GET /api/users/me`
### `GET /api/users`
### `GET /api/users/:id`

Route setup:
- `usersRouter.use(requireAuth)`

Auth:
- Bearer token required for all users routes

Role:
- No role guard is applied

Risk:
- `/api/users` and `/api/users/:id` are auth-only, not admin-only
- This is a potential security issue if the frontend assumes restricted access

---

## Payment Provider Contract

### Supported Providers
Only:
- `MERCADO_PAGO`

### Checkout Session Status
Exact values:
- `PENDING`
- `OPEN`
- `COMPLETED`
- `EXPIRED`
- `CANCELLED`

### Payment Transaction Status
Exact values:
- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `EXPIRED`
- `REFUNDED`

### Create Checkout Input
```ts
{
  amount: string;
  currency: string;
  externalReference: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}
```

### Create Checkout Output
```ts
{
  provider: "MERCADO_PAGO";
  status: "PENDING|OPEN|COMPLETED|EXPIRED|CANCELLED";
  externalCheckoutId?: string | null;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  paymentMethod?: string | null;
  expiresAt?: Date | null;
  raw?: unknown;
}
```

### Webhook Parse Output
```ts
{
  provider: "MERCADO_PAGO";
  externalPaymentId?: string | null;
  externalCheckoutId?: string | null;
  status: "PENDING|APPROVED|REJECTED|CANCELLED|EXPIRED|REFUNDED";
  approvedAt?: Date | null;
  raw?: unknown;
}
```

### Mercado Pago Behavior
- If `MERCADO_PAGO_ACCESS_TOKEN` is missing:
  - returns a placeholder checkout response with no real artifacts
  - `raw.reason = "MERCADO_PAGO_ACCESS_TOKEN_MISSING"`
- Uses PIX payments
- Payer email precedence:
  1. `MERCADO_PAGO_PAYER_EMAIL`
  2. `metadata.payerEmail`
  3. `test@example.com`
- Webhook parsing is safe and does not auto-approve unless payload clearly indicates approval

---

## Prisma Schema Notes Relevant to Frontend

### `SubscriptionPlan`
Fields:
- `id`
- `name`
- `description`
- `amount`
- `currency`
- `billingCycle`
- `isActive`
- `metadata`
- `createdAt`
- `updatedAt`

### `Subscription`
Fields:
- `id`
- `adminId`
- `startsAt`
- `endsAt`
- `createdAt`
- `approvedAt`
- `cancelledAt`
- `metadata`
- `planId`
- `updatedAt`
- `status`

### `CheckoutSession`
Fields:
- `id`
- `adminId`
- `planId`
- `subscriptionId`
- `provider`
- `status`
- `providerPublicKey`
- `providerAccessToken`
- `externalCheckoutId`
- `checkoutUrl`
- `qrCode`
- `qrCodeBase64`
- `paymentMethod`
- `amount`
- `currency`
- `expiresAt`
- `metadata`
- `createdAt`
- `updatedAt`

### `PaymentTransaction`
Fields:
- `id`
- `adminId`
- `subscriptionId`
- `checkoutSessionId`
- `provider`
- `status`
- `providerPublicKey`
- `providerAccessToken`
- `externalPaymentId`
- `externalCheckoutId`
- `amount`
- `currency`
- `paymentMethod`
- `approvedAt`
- `metadata`
- `createdAt`
- `updatedAt`

### Decimal Serialization Risk
Some endpoints return Prisma decimals directly, others convert them to strings with `.toString()`.
Frontend should not assume all money values arrive in the same runtime type.

---

## Mismatches / Risks for Frontend Refactor

1. **Register controller forces PLAYER**
   - Backend service supports admin registration, but the public register API does not expose it

2. **Checkout route vs service mismatch**
   - Route allows `PLAYER`, but service is admin-profile oriented
   - Frontend should not assume a PLAYER checkout flow without verifying controller behavior

3. **Subscriptions are admin-only**
   - `/api/subscriptions/me` and `/api/subscriptions/start` are only for ADMIN/OWNER
   - PLAYER users will be forbidden

4. **Users routes are auth-only**
   - `/api/users` and `/api/users/:id` are not role-protected
   - Frontend should not rely on them being admin-only unless backend changes

5. **Plan deletion may soft-deactivate**
   - Deleting a linked plan returns a deactivation response instead of deletion

6. **Provider fallback can produce placeholder checkouts**
   - If Mercado Pago env vars are missing, a checkout can return PENDING without real payment artifacts

7. **Decimal fields may serialize inconsistently**
   - Some payloads expose raw Prisma decimals
   - Frontend should be tolerant of string/number-like monetary values

---

## Frontend Consumption Guidance

- Use `Authorization: Bearer <token>` for all protected routes
- Treat `/api/auth/me` as the source of truth for current user identity and role
- Do not create client-side business logic for auth/role/plan access
- For plans listing, filter inactive plans client-side only if the UI needs consumer-facing active plans
- For checkout, expect PIX-related fields (`checkoutUrl`, `qrCode`, `qrCodeBase64`)
- For subscriptions, expect admin-only access and a minimal subscription object without plan details