/**
 * Wrapper to run dev-register-and-checkout.mjs ensuring USERNAME/PLAN_ID env vars
 * don't accidentally override defaults (Windows terminals often have USERNAME=PC).
 */
delete process.env.USERNAME;
delete process.env.USER;
delete process.env.PLAN_ID;

// Important: dynamic import so the env cleanup runs BEFORE loading the script.
await import("./dev-register-and-checkout.mjs");
