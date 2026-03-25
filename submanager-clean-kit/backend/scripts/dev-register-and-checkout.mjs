/**
 * Dev helper: registers a user, optionally promotes to ADMIN, logs in, then calls /api/checkout/create.
 *
 * Usage (from repo root):
 *   node backend/scripts/dev-register-and-checkout.mjs
 *
 * Env overrides:
 *   API_URL=http://localhost:3001
 *   EMAIL=admin.local@example.com
 *   USERNAME=adminlocal
 *   PASSWORD=Admin1234!
 *   PROMOTE_TO_ADMIN=1   (default: 1)
 *   PLAN_ID=...          (required for checkout)
 */

import { PrismaClient } from "@prisma/client";

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const EMAIL = process.env.EMAIL || "admin.local@example.com";
const USERNAME = process.env.USERNAME || "player123";
const PASSWORD = process.env.PASSWORD || "Admin1234!";
const NICKNAME = process.env.NICKNAME || "Admin Local";

console.log("[dev] process.env.USERNAME =", process.env.USERNAME);
console.log("[dev] resolved USERNAME =", USERNAME);

if (USERNAME.length < 3 || USERNAME.length > 32) {
  throw new Error(
    `USERNAME must be 3..32 chars. Got "${USERNAME}" (len=${USERNAME.length}). Set USERNAME env var.`,
  );
}
const PROMOTE_TO_ADMIN = (process.env.PROMOTE_TO_ADMIN || "0") === "1";
const PLAN_ID = process.env.PLAN_ID || "cmmv8kjd4000355a4t1vvl5cp";

function die(msg) {
  console.error(msg);
  process.exit(1);
}

async function httpJson(path, { method = "GET", token, body } = {}) {
  const url = `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { ok: res.ok, status: res.status, data };
}

async function ensureRegistered() {
  const register = await httpJson("/api/auth/register", {
    method: "POST",
    body: { email: EMAIL, username: USERNAME, password: PASSWORD, nickname: NICKNAME },
  });

  // 201 created or 409 already exists are ok
  if (register.ok) return;

  if (register.status !== 409) {
    console.error("Register failed:", register);
    die("Failed to register user");
  }
}

async function promoteToAdminIfNeeded() {
  if (!PROMOTE_TO_ADMIN) return;

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: EMAIL.toLowerCase() }, { username: USERNAME }] },
      select: { id: true, role: true, adminProfile: { select: { id: true } } },
    });

    if (!user) die("User not found in DB after register");

    if (user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "ADMIN",
          adminProfile: user.adminProfile
            ? undefined
            : {
                create: { weeklyFee: "0", isActive: true },
              },
        },
      });
    } else if (user.adminProfile) {
      await prisma.adminProfile.update({
        where: { id: user.adminProfile.id },
        data: { isActive: true },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { adminProfile: { create: { weeklyFee: "0", isActive: true } } },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function login() {
  const loginRes = await httpJson("/api/auth/login", {
    method: "POST",
    body: { emailOrUsername: EMAIL, password: PASSWORD },
  });

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes);
    die("Failed to login");
  }

  const token = loginRes.data?.accessToken;
  if (!token) die("No accessToken returned");
  return token;
}

async function callCheckout(token) {
  if (!PLAN_ID) die("PLAN_ID is required (use a real plan id from DB).");

  const res = await httpJson("/api/checkout/create", {
    method: "POST",
    token,
    body: { planId: PLAN_ID },
  });

  console.log("Checkout response:", JSON.stringify(res, null, 2));
}

async function main() {
  console.log(`[dev] API_URL=${API_URL}`);
  console.log(`[dev] EMAIL=${EMAIL} USERNAME=${USERNAME} PROMOTE_TO_ADMIN=${PROMOTE_TO_ADMIN}`);

  await ensureRegistered();
  await promoteToAdminIfNeeded();

  const token = await login();
  console.log("[dev] Logged in OK");
  console.log("[dev] JWT:", token);

  await callCheckout(token);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
