# SubManager Clean Kit

Projeto limpo para reconstruir seu app de gestão de assinaturas sem Base44.

## O que vem pronto

- `frontend/`: React + Vite + Tailwind
- `backend/`: Node + Express
- login local de teste
- área do cliente
- painel admin
- planos com CRUD simples no frontend
- checkout simulado no frontend
- esqueleto de API para login, planos, assinaturas e webhook

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`

Usuários de teste:

- cliente: `cliente@local.test` / `123456`
- admin: `admin@local.test` / `123456`

## Backend

```bash
cd backend
npm install
npm run dev
```

Acesse `http://localhost:3001/health`

## Próximos passos recomendados

1. ligar o frontend na API do backend
2. mover o login local para login real via backend
3. trocar checkout simulado por Mercado Pago ou Asaas
4. ativar assinatura só via webhook
5. migrar armazenamento local para banco real (Supabase/PostgreSQL)

## Observações

- O frontend já funciona sozinho com `localStorage`
- O backend já tem rotas iniciais e persistência em JSON para desenvolvimento
- A integração real de pagamento ainda não está feita
