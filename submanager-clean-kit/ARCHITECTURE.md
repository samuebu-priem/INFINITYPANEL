# Free Fire Betting Platform Architecture

## Overview

Scalable monorepo-style platform for managing a Free Fire competitive betting organization with:

- Web panel
- JWT authentication
- Role-based access control
- Public queue and auto-match creation
- Real-time updates with WebSockets
- Discord bot integration
- Rankings and analytics
- Admin subscription lifecycle
- PostgreSQL + Prisma persistence

---

## High-Level Architecture

```text
frontend (React + Vite + TS)
  ├─ React Router pages
  ├─ Context API state
  ├─ REST API client
  └─ WebSocket client
          │
          ▼
backend (Node.js + Express + TS)
  ├─ REST API
  ├─ Auth / RBAC
  ├─ Queue orchestration
  ├─ Match management
  ├─ Ranking services
  ├─ Subscription services
  ├─ Analytics services
  ├─ WebSocket gateway
  └─ Discord bot service
          │
          ▼
PostgreSQL (Prisma ORM)
```

---

## Core Domains

### Users and Roles
- `OWNER`
- `ADMIN`
- `PLAYER`

### Primary Business Flow
1. Player registers and logs in.
2. Player creates a public queue entry for `1v1`, `2v2`, or `4v4`.
3. Another player accepts the queue.
4. Backend creates a private match room.
5. Backend assigns an available active admin.
6. Discord bot posts updates and creates private match channel.
7. Admin confirms payment handling and match result.
8. Rankings, transactions, and analytics are updated.

---

## Recommended Final Folder Structure

```text
.
├─ ARCHITECTURE.md
├─ README.md
├─ backend/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ .env.example
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.ts
│  └─ src/
│     ├─ server.ts
│     ├─ app.ts
│     ├─ config/
│     │  ├─ env.ts
│     │  ├─ logger.ts
│     │  ├─ prisma.ts
│     │  └─ constants.ts
│     ├─ shared/
│     │  ├─ types/
│     │  │  ├─ api.ts
│     │  │  ├─ auth.ts
│     │  │  ├─ queue.ts
│     │  │  ├─ match.ts
│     │  │  └─ ranking.ts
│     │  ├─ utils/
│     │  │  ├─ ApiError.ts
│     │  │  ├─ asyncHandler.ts
│     │  │  ├─ pagination.ts
│     │  │  ├─ date.ts
│     │  │  └─ money.ts
│     │  └─ validators/
│     │     └─ common.ts
│     ├─ middlewares/
│     │  ├─ auth.middleware.ts
│     │  ├─ role.middleware.ts
│     │  ├─ error.middleware.ts
│     │  └─ notFound.middleware.ts
│     ├─ modules/
│     │  ├─ auth/
│     │  │  ├─ auth.controller.ts
│     │  │  ├─ auth.service.ts
│     │  │  ├─ auth.repository.ts
│     │  │  ├─ auth.routes.ts
│     │  │  ├─ auth.schemas.ts
│     │  │  └─ auth.types.ts
│     │  ├─ users/
│     │  │  ├─ users.controller.ts
│     │  │  ├─ users.service.ts
│     │  │  ├─ users.repository.ts
│     │  │  ├─ users.routes.ts
│     │  │  └─ users.schemas.ts
│     │  ├─ admins/
│     │  │  ├─ admins.controller.ts
│     │  │  ├─ admins.service.ts
│     │  │  ├─ admins.repository.ts
│     │  │  ├─ admins.routes.ts
│     │  │  └─ admins.schemas.ts
│     │  ├─ queues/
│     │  │  ├─ queues.controller.ts
│     │  │  ├─ queues.service.ts
│     │  │  ├─ queues.repository.ts
│     │  │  ├─ queues.routes.ts
│     │  │  ├─ queues.schemas.ts
│     │  │  └─ queue.events.ts
│     │  ├─ matches/
│     │  │  ├─ matches.controller.ts
│     │  │  ├─ matches.service.ts
│     │  │  ├─ matches.repository.ts
│     │  │  ├─ matches.routes.ts
│     │  │  └─ matches.schemas.ts
│     │  ├─ subscriptions/
│     │  │  ├─ subscriptions.controller.ts
│     │  │  ├─ subscriptions.service.ts
│     │  │  ├─ subscriptions.repository.ts
│     │  │  ├─ subscriptions.routes.ts
│     │  │  └─ subscriptions.schemas.ts
│     │  ├─ transactions/
│     │  │  ├─ transactions.service.ts
│     │  │  └─ transactions.repository.ts
│     │  ├─ rankings/
│     │  │  ├─ rankings.controller.ts
│     │  │  ├─ rankings.service.ts
│     │  │  ├─ rankings.repository.ts
│     │  │  ├─ rankings.routes.ts
│     │  │  └─ rankings.schemas.ts
│     │  ├─ analytics/
│     │  │  ├─ analytics.controller.ts
│     │  │  ├─ analytics.service.ts
│     │  │  ├─ analytics.repository.ts
│     │  │  └─ analytics.routes.ts
│     │  └─ discord/
│     │     ├─ discord.bot.ts
│     │     ├─ discord.service.ts
│     │     ├─ discord.events.ts
│     │     └─ discord.types.ts
│     ├─ websocket/
│     │  ├─ socket.server.ts
│     │  ├─ socket.events.ts
│     │  └─ socket.types.ts
│     └─ routes/
│        └─ index.ts
├─ frontend/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  ├─ vite.config.ts
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ router/
│     │  ├─ index.tsx
│     │  ├─ ProtectedRoute.tsx
│     │  └─ RoleGuard.tsx
│     ├─ pages/
│     │  ├─ LandingPage.tsx
│     │  ├─ LoginPage.tsx
│     │  ├─ RegisterPage.tsx
│     │  ├─ QueuePage.tsx
│     │  ├─ MatchRoomPage.tsx
│     │  ├─ RankingPage.tsx
│     │  ├─ dashboards/
│     │  │  ├─ PlayerDashboardPage.tsx
│     │  │  ├─ AdminDashboardPage.tsx
│     │  │  └─ OwnerDashboardPage.tsx
│     │  └─ NotFoundPage.tsx
│     ├─ layouts/
│     │  ├─ AuthLayout.tsx
│     │  ├─ DashboardLayout.tsx
│     │  └─ PublicLayout.tsx
│     ├─ components/
│     │  ├─ common/
│     │  │  ├─ Button.tsx
│     │  │  ├─ Card.tsx
│     │  │  ├─ Modal.tsx
│     │  │  ├─ Input.tsx
│     │  │  ├─ Badge.tsx
│     │  │  └─ Table.tsx
│     │  ├─ auth/
│     │  │  ├─ LoginForm.tsx
│     │  │  └─ RegisterForm.tsx
│     │  ├─ queue/
│     │  │  ├─ QueueBoard.tsx
│     │  │  ├─ QueueCard.tsx
│     │  │  ├─ CreateQueueForm.tsx
│     │  │  └─ QueueFilters.tsx
│     │  ├─ match/
│     │  │  ├─ MatchStatusPanel.tsx
│     │  │  ├─ MatchActions.tsx
│     │  │  └─ MatchTimeline.tsx
│     │  ├─ ranking/
│     │  │  ├─ RankingTable.tsx
│     │  │  └─ LeaderboardCard.tsx
│     │  └─ dashboard/
│     │     ├─ MetricCard.tsx
│     │     ├─ MatchList.tsx
│     │     └─ EarningsPanel.tsx
│     ├─ context/
│     │  ├─ AuthContext.tsx
│     │  ├─ QueueContext.tsx
│     │  └─ SocketContext.tsx
│     ├─ hooks/
│     │  ├─ useAuth.ts
│     │  ├─ useQueue.ts
│     │  ├─ useSocket.ts
│     │  └─ useRole.ts
│     ├─ services/
│     │  ├─ api/
│     │  │  ├─ client.ts
│     │  │  ├─ auth.api.ts
│     │  │  ├─ queue.api.ts
│     │  │  ├─ match.api.ts
│     │  │  ├─ ranking.api.ts
│     │  │  ├─ admin.api.ts
│     │  │  └─ analytics.api.ts
│     │  └─ socket/
│     │     └─ socket.client.ts
│     ├─ types/
│     │  ├─ auth.ts
│     │  ├─ user.ts
│     │  ├─ queue.ts
│     │  ├─ match.ts
│     │  └─ ranking.ts
│     ├─ utils/
│     │  ├─ storage.ts
│     │  ├─ format.ts
│     │  └─ guards.ts
│     └─ styles/
│        └─ globals.css
└─ shared/
   └─ contracts/
      ├─ roles.ts
      ├─ queue.ts
      ├─ match.ts
      └─ ranking.ts
```

---

## Backend Module Responsibilities

### Auth Module
- Register
- Login
- Password hashing
- JWT issue and validation
- Current user endpoint

### User Module
- User profile
- Role retrieval
- Owner-managed user listing
- Player and admin views

### Admin Module
- Admin activation/deactivation
- Weekly subscription validation
- Admin earnings and match stats
- Available-admin assignment strategy

### Queue Module
- Create public queue
- List active queues
- Accept queue
- Cancel queue
- Real-time broadcast
- Trigger match room creation

### Match Module
- Create private match room
- Assign players and admin
- Confirm payment
- Confirm result
- Update lifecycle statuses

### Ranking Module
- Weekly player leaderboard
- Weekly admin leaderboard
- Match-count-based ranking
- Cached aggregation strategy

### Analytics Module
- Total matches per day
- Total money intermediated
- Queue activity
- Admin earnings metrics
- Owner financial dashboard

### Discord Module
- Queue message publishing
- Match channel creation
- Admin assignment notification
- Match status synchronization

---

## Database Model Plan

### User
- id
- email
- username
- passwordHash
- role
- discordId
- createdAt
- updatedAt

### AdminProfile
- id
- userId
- isActive
- weeklyFee
- totalEarnings
- totalMatchesIntermediated
- currentSubscriptionId
- createdAt
- updatedAt

### PlayerProfile
- id
- userId
- nickname
- totalMatches
- totalWins
- rankingPoints
- createdAt
- updatedAt

### Queue
- id
- createdById
- acceptedById
- type
- amount
- status
- notes
- createdAt
- acceptedAt
- expiresAt

### Match
- id
- queueId
- player1Id
- player2Id
- adminId
- mode
- amount
- adminFee
- status
- paymentStatus
- winnerId
- startedAt
- completedAt
- createdAt
- updatedAt

### Transaction
- id
- matchId
- adminId
- payerId
- amount
- type
- status
- createdAt

### Subscription
- id
- adminId
- amount
- startsAt
- endsAt
- status
- paidAt
- createdAt

### Ranking
- id
- userId
- scope
- weekKey
- matchesPlayed
- wins
- earnings
- points
- updatedAt

---

## Important Enums

```text
Role: OWNER | ADMIN | PLAYER
QueueType: ONE_VS_ONE | TWO_VS_TWO | FOUR_VS_FOUR
QueueStatus: OPEN | ACCEPTED | CANCELLED | EXPIRED
MatchStatus: PENDING_PAYMENT | READY | LIVE | COMPLETED | CANCELLED
PaymentStatus: WAITING | CONFIRMED | RELEASED | REFUNDED
SubscriptionStatus: PENDING | ACTIVE | EXPIRED | CANCELLED
TransactionType: SUBSCRIPTION_PAYMENT | MATCH_ESCROW | ADMIN_FEE | PAYOUT
RankingScope: PLAYER_WEEKLY | ADMIN_WEEKLY
```

---

## API Surface Plan

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users
- `GET /api/users/me`
- `GET /api/users`
- `GET /api/users/:id`

### Admins
- `GET /api/admins`
- `PATCH /api/admins/:id/status`
- `GET /api/admins/me/stats`
- `GET /api/admins/me/earnings`

### Queues
- `GET /api/queues`
- `POST /api/queues`
- `POST /api/queues/:id/accept`
- `PATCH /api/queues/:id/cancel`

### Matches
- `GET /api/matches/:id`
- `GET /api/matches/me`
- `PATCH /api/matches/:id/payment`
- `PATCH /api/matches/:id/result`
- `PATCH /api/matches/:id/status`

### Subscriptions
- `POST /api/subscriptions`
- `GET /api/subscriptions/me`
- `PATCH /api/subscriptions/:id/pay`

### Rankings
- `GET /api/rankings/players`
- `GET /api/rankings/admins`

### Analytics
- `GET /api/analytics/overview`
- `GET /api/analytics/daily-matches`
- `GET /api/analytics/queue-activity`

---

## Real-Time Events

### WebSocket Server Events
- `queue:list`
- `queue:created`
- `queue:updated`
- `queue:accepted`
- `match:created`
- `match:updated`
- `ranking:updated`
- `admin:assigned`

### Client Actions
- subscribe to queue board
- receive new queue entries
- receive auto-created match room updates
- update dashboards live

---

## Discord Bot Responsibilities

### Bot Commands / Flows
- Publish queue embed message
- Accept queue from Discord interaction
- Create private match text channel
- Mention assigned admin
- Mirror match status changes
- Post result summary

### Integration Boundary
Discord bot should be a backend service consuming internal queue and match services, not duplicating business rules.

---

## Clean Architecture Rules

- Controllers only handle HTTP concerns.
- Services implement business logic.
- Repositories isolate Prisma persistence.
- Middlewares handle auth, roles, and errors.
- Shared types and validators stay framework-agnostic.
- Discord and WebSocket layers consume domain services.

---

## Delivery Sequence

### Phase 1
- Replace current JS backend with TS backend structure
- Add Prisma schema
- Add modular Express app
- Add auth and user foundation

### Phase 2
- Implement queue, match, admin, subscription, ranking, analytics services
- Add WebSocket broadcasting
- Add seed data

### Phase 3
- Replace current frontend JS app with React + TS architecture
- Add routing, auth context, role guards
- Add dashboards and queue pages
- Add WebSocket client integration

### Phase 4
- Add Discord bot scaffold and event bindings
- Polish README and environment setup

---

## Notes About Current Repository

Current repository is a starter kit for subscription management and will need major restructuring:
- backend JS controllers/routes will be replaced
- frontend JSX pages/components will be replaced by TypeScript equivalents
- local JSON persistence will be removed in favor of PostgreSQL + Prisma
- existing subscription UI can be discarded or selectively reused after migration
