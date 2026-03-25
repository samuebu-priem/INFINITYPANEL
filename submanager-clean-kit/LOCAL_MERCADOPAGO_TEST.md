# Testar Mercado Pago localmente (sem VPS/hosting) usando Tunnel (Webhook)

Você consegue testar **checkout PIX + webhook** localmente. O único requisito é expor **uma URL pública HTTPS** que a Mercado Pago consiga chamar. Para isso use um túnel:

- Opção A: **Cloudflare Tunnel (`cloudflared`)** (geralmente mais simples/grátis)
- Opção B: **ngrok**

Webhook do seu projeto:
- `POST /api/payments/webhook/mercadopago`

Quando publicar via túnel, a URL final será:
- `https://<SEU-TUNNEL>/api/payments/webhook/mercadopago`

---

## 1) Rodar o backend local
No terminal:

```bash
cd backend
npm ci
npm run dev
```

Confirme que está vivo:
- `http://localhost:3001/health`

---

## 2) Expor o backend com Cloudflare Tunnel (recomendado)

### 2.1 Checagem rápida (Windows / CMD / VSCode)
Se ao rodar `cloudflared ...` você **não vê URL**, na prática quase sempre é porque o `cloudflared` **não está instalado** ou **não está no PATH**.

Teste:
```bat
where cloudflared
cloudflared --version
```

- Se `where cloudflared` não retornar nada e `cloudflared --version` der “não é reconhecido”, instale ou adicione no PATH.

### 2.2 Instalar `cloudflared` no Windows (jeitos comuns)
**Opção 1 (Winget):**
```bat
winget install Cloudflare.cloudflared
```

Feche e reabra o terminal e teste:
```bat
cloudflared --version
```

**Opção 2 (Chocolatey):**
```bat
choco install cloudflared
```

**Opção 3 (manual):**
- Baixe o `cloudflared.exe` no site oficial do Cloudflare
- Coloque em uma pasta (ex: `C:\tools\cloudflared\cloudflared.exe`)
- Adicione essa pasta ao PATH do Windows
- Reabra o terminal e teste `cloudflared --version`

### 2.3 Subir o tunnel (gera a URL)
Com o backend rodando em `http://localhost:3001`:

```bat
cloudflared tunnel --url http://localhost:3001
```

Procure no output uma linha parecida com:
- `https://xxxx.trycloudflare.com`

Essa é a URL pública.

> Dica: deixe esse comando rodando (janela aberta). Se você fechar, a URL para de funcionar.

---

## 3) Configurar `.env` do backend para Mercado Pago + webhook público

Edite `backend/.env` e ajuste:

```env
PAYMENT_PROVIDER=MERCADO_PAGO
MERCADO_PAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN
MERCADO_PAGO_PUBLIC_KEY=SUA_PUBLIC_KEY

# precisa ser a URL pública do tunnel + caminho do webhook
MERCADO_PAGO_WEBHOOK_URL=https://xxxx.trycloudflare.com/api/payments/webhook/mercadopago
```

Reinicie o backend após alterar `.env`.

---

## 4) Configurar Webhook no painel Mercado Pago
No painel do Mercado Pago:
- URL de webhook/notificações:
  `https://xxxx.trycloudflare.com/api/payments/webhook/mercadopago`
- Eventos: **payments** (ou o equivalente na sua conta)

Salvar.

---

## 5) Teste end-to-end (PIX)
1) No seu app, crie um checkout PIX (isso chama o backend e cria payment no MP)
2) O backend retorna `qr_code` / `ticket_url` para pagar
3) Pague o PIX
4) Verifique logs do backend: deve chegar `POST /api/payments/webhook/mercadopago`
5) O controller (`payments.controller.ts`) faz:
   - parse do webhook para obter `paymentId`
   - `mercadopago.Payment.get({ id })` para estado canônico
   - usa `external_reference` para achar `CheckoutSession.id`
   - atualiza `CheckoutSession`, `PaymentTransaction` e ativa `Subscription` quando aprovado

---

## Opção B (alternativa): ngrok
1) Rode backend local (`npm run dev`)
2) Suba tunnel:
```bash
ngrok http 3001
```
3) Use a URL https do ngrok no:
- `MERCADO_PAGO_WEBHOOK_URL`
- painel do Mercado Pago

---

## Dicas / problemas comuns
- Se o Mercado Pago não “bate” no webhook:
  - confirme que a URL do tunnel está **HTTPS**
  - confirme que a rota existe: `/api/payments/webhook/mercadopago`
  - confira se o backend está em `PORT=3001`
- Se o pagamento não atualiza:
  - o código depende de `external_reference` (id da `CheckoutSession`) para vincular no banco
  - verifique se você está criando checkout via fluxo do projeto (não manualmente no painel)
