# Environment verification checklist

## Backend
Verify these are set correctly in both local `backend/.env` and VPS backend `.env`:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `WS_PATH`
- `DISCORD_BOT_TOKEN`
- `DISCORD_GUILD_ID`
- `PAYMENT_PROVIDER`
- `MERCADO_PAGO_PUBLIC_KEY`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `MERCADO_PAGO_WEBHOOK_URL`
- `FRONTEND_CHECKOUT_SUCCESS_URL`
- `FRONTEND_CHECKOUT_FAILURE_URL`
- `FRONTEND_CHECKOUT_PENDING_URL`

## Frontend
Verify these are set correctly in `frontend/.env` locally and in any production build environment:

- `VITE_API_URL`

## Production assumptions to verify
- Frontend is built with Vite and served statically by Nginx from `frontend/dist`.
- Nginx proxies `/api/` to the backend on `127.0.0.1:3001`.
- `VITE_API_URL=/api` assumes the frontend and API are reachable on the same origin in production.
- `CORS_ORIGIN` on the backend must match the actual production frontend origin if requests are not strictly same-origin.
- PM2 must point to the correct built backend entry file after `npm run build`.

## Why a mismatch can break login even if code is correct
- Wrong `DATABASE_URL`: login queries hit the wrong database or backend cannot start.
- Wrong `JWT_SECRET`: tokens are signed/validated inconsistently across environments.
- Wrong `CORS_ORIGIN`: browser blocks the login response in production.
- Wrong `VITE_API_URL`: frontend sends login to the wrong host or path.
- Wrong Nginx proxy rules: `/api` requests never reach the backend.
- Wrong PM2 start path: backend never runs in production.

## Notes
Local and VPS `.env` values should not be assumed identical.