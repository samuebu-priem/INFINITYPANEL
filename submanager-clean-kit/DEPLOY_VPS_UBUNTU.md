# Deploy to VPS (Ubuntu 22.04/24.04) + Domain + HTTPS (Nginx) — Mercado Pago Webhooks

This repo has:
- **backend**: Node.js (Express + TS) on `PORT` (default `3001`)
- **frontend**: Vite build (static) to be served by Nginx

Webhook endpoint (public):
- `POST https://<your-domain>/api/payments/webhook/mercadopago`

## 0) Prereqs
On your DNS provider, create:
- `A` record: `your-domain.com -> <VPS_IP>`
(Optional) `www.your-domain.com -> <VPS_IP>`

Open ports in VPS firewall / provider firewall:
- `22/tcp` SSH
- `80/tcp` HTTP
- `443/tcp` HTTPS

---

## 1) VPS packages
```bash
sudo apt update
sudo apt -y install nginx git ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs
sudo npm i -g pm2
```

(Recommended) enable firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## 2) PostgreSQL (choose one)

### Option A: Use managed Postgres (recommended)
Just keep your provider `DATABASE_URL` and skip Postgres install.

### Option B: Install Postgres on the VPS
```bash
sudo apt -y install postgresql
sudo -u postgres psql
```

Inside `psql`:
```sql
CREATE USER submanager WITH PASSWORD 'CHANGE_ME_STRONG';
CREATE DATABASE submanager OWNER submanager;
\q
```

Example `DATABASE_URL`:
```
postgresql://submanager:CHANGE_ME_STRONG@localhost:5432/submanager?schema=public
```

---

## 3) Clone and install
```bash
sudo mkdir -p /var/www/submanager
sudo chown -R $USER:$USER /var/www/submanager
cd /var/www/submanager

git clone <YOUR_REPO_URL> .
```

Backend:
```bash
cd backend
npm ci
npm run build
```

Frontend:
```bash
cd ../frontend
npm ci
npm run build
```

---

## 4) Backend environment (.env)
Create `/var/www/submanager/backend/.env` (production values):

```bash
cd /var/www/submanager/backend
nano .env
```

Minimal example (adjust values):
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com

DATABASE_URL=postgresql://submanager:CHANGE_ME_STRONG@localhost:5432/submanager?schema=public

JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_SECRET_32+_CHARS
JWT_EXPIRES_IN=7d

PAYMENT_PROVIDER=MERCADO_PAGO
MERCADO_PAGO_PUBLIC_KEY=YOUR_PUBLIC_KEY
MERCADO_PAGO_ACCESS_TOKEN=YOUR_ACCESS_TOKEN

# Webhook secret is optional in current code (signature verification TODO)
MERCADO_PAGO_WEBHOOK_SECRET=

# IMPORTANT: must be public HTTPS URL for Mercado Pago to call
MERCADO_PAGO_WEBHOOK_URL=https://your-domain.com/api/payments/webhook/mercadopago

FRONTEND_CHECKOUT_SUCCESS_URL=https://your-domain.com/checkout/success
FRONTEND_CHECKOUT_FAILURE_URL=https://your-domain.com/checkout/failure
FRONTEND_CHECKOUT_PENDING_URL=https://your-domain.com/checkout/pending
```

---

## 5) Prisma migrations
Run migrations **once** on the server:
```bash
cd /var/www/submanager/backend
npx prisma generate
npx prisma migrate deploy
```

(If you want seed data)
```bash
npm run prisma:seed
```

---

## 6) Run backend with PM2
```bash
cd /var/www/submanager/backend
pm2 start dist/server.js --name submanager-api
pm2 save
pm2 startup
```

Check health (should respond):
```bash
curl -i http://127.0.0.1:3001/health
```

---

## 7) Nginx config (static frontend + reverse proxy API)
Create Nginx site:
```bash
sudo nano /etc/nginx/sites-available/submanager
```

Paste (replace `your-domain.com` and paths):
```nginx
server {
  server_name your-domain.com;

  # Frontend build output
  root /var/www/submanager/frontend/dist;
  index index.html;

  # Serve SPA
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API reverse proxy
  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Health shortcut (optional)
  location /health {
    proxy_pass http://127.0.0.1:3001/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }
}
```

Enable it:
```bash
sudo ln -sf /etc/nginx/sites-available/submanager /etc/nginx/sites-enabled/submanager
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8) HTTPS (Let’s Encrypt)
```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

After it finishes:
- HTTPS is active
- Certbot sets up renewal automatically

---

## 9) Mercado Pago webhook setup
In Mercado Pago dashboard:
- Configure webhook (notifications) URL:
  `https://your-domain.com/api/payments/webhook/mercadopago`
- Events: **payments** (or equivalent payments/charge events depending on MP panel)
- Save and send a test notification (if the panel supports it)

Server logs:
```bash
pm2 logs submanager-api
```

---

## 10) Quick end-to-end test checklist
1. Confirm backend is reachable:
   - `https://your-domain.com/health` returns JSON
2. Confirm API is reachable:
   - `https://your-domain.com/api/...` endpoints respond
3. Trigger a PIX checkout in the app:
   - Backend creates payment via Mercado Pago and returns `qr_code` / `ticket_url`
4. Pay via PIX QR Code
5. Mercado Pago calls webhook:
   - `POST /api/payments/webhook/mercadopago`
6. Backend updates:
   - `CheckoutSession.status` -> `COMPLETED` when approved
   - `PaymentTransaction.status` -> `APPROVED`
   - `Subscription` becomes `ACTIVE`

---

## Notes / gotchas
- `CORS_ORIGIN` should be your production frontend origin (not `*`) when using credentials.
- Nginx proxies `/api/*` to backend, so your frontend can call same-domain `/api`.
- Webhooks require public HTTPS; localhost won’t work (ngrok only for local dev).
- Current code has TODO for verifying webhook signatures (`MERCADO_PAGO_WEBHOOK_SECRET`). You can test without it, but production should add verification.
