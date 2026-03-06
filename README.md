# Arithmetic Arena Bot (Telegram Mini App)

Production-oriented monorepo MVP of a real-time 1v1 arithmetic PvP game for Telegram Mini Apps.

## 1) Folder structure

```txt
apps/
  api/                # NestJS + Socket.IO + MongoDB/Mongoose
  web/                # React + Vite + Tailwind + Telegram Mini App SDK
packages/
  shared/             # BigInt-safe game engine, shared schemas/types/i18n
  config/             # Reserved for cross-app config packages
nginx/                # Reverse proxy setup for API/web/ws
docker/               # API and web Dockerfiles
.github/workflows/    # CI checks
```

## 2) Architecture

- **Server-authoritative** match logic in `apps/api`.
- **BigInt safe** arithmetic in `packages/shared` with string transport in JSON.
- **Realtime**: Socket.IO events (`matchmaking:*`, `match:*`, `friendmatch:*`).
- **Persistence**: MongoDB schemas for users, ratings, matches, snapshots, moves, seasons, leaderboard cache metadata, audit events.
- **Ephemeral state**: Redis intended for queue/presence/rate-limit helpers.
- **Auth security**: backend validates Telegram init data signature + auth_date TTL.
- **i18n**: RU primary, EN secondary via shared translation map.

## 3) Root configs

- pnpm workspace monorepo
- strict TypeScript base config
- ESLint + Prettier + Husky + lint-staged
- GitHub Actions CI

## 4) Shared game engine

`packages/shared` includes:
- `parseBigIntString`, `digitLength`, `isExactDivision`, `absDistanceBigInt`
- `validateOperationRange`, `getOperationCost`, `applyOperation`
- lazy `computeElixir`
- timeout resolver by minimal distance
- Elo helpers with K-factor policy
- target generation via hidden legal operation sequence

## 5) Backend modules and schemas

Nest modules:
- `auth`, `users`, `matchmaking`, `matches`, `ratings`, `leaderboard`, `friend-matches`, `health`

REST endpoints implemented:
- `POST /api/auth/telegram`
- `GET /api/me`
- `GET /api/me/history`
- `GET /api/leaderboard`
- `POST /api/friend-matches`
- `POST /api/friend-matches/:code/join`
- `GET /api/matches/:id`
- `GET /api/health`

Socket namespaces:
- `/realtime` for matchmaking
- `/match` for active match actions

## 6) Frontend app/pages

`apps/web` includes:
- Telegram bootstrapping (`@twa-dev/sdk`)
- auth bootstrap flow to backend
- menu and match screens
- Zustand app store
- TanStack Query provider
- Tailwind mobile-first styling

## 7) Docker + Nginx

- `docker-compose.yml` with `mongo`, `redis`, `api`, `web`, optional `nginx` profile.
- Dockerfiles for api/web builds.
- Nginx config with websocket proxy path.

## 8) Tests

Included test coverage targets:
- operation costs
- legal/illegal division
- elixir regeneration
- timeout closest-distance and draw
- Elo updates
- auth init-data rejection path
- Playwright smoke stub for UI visibility

## 9) Setup and run

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm dev
```

Docker:

```bash
docker compose up --build
```

## 10) Unfinished / next hardening tasks

- Plug Redis-backed matchmaking queue and anti-repeat pairing policy.
- Add authenticated socket handshake middleware bound to validated Telegram session.
- Persist authoritative active match state transitions + MongoDB transactions for finish/rating/history writes.
- Add full reconnect resume snapshots and anti-spam throttles per socket event.
- Add admin module with protected audit browsing.
- Expand frontend to all required screens (history/profile/settings/result/friendly invite UX).
- Add production OpenTelemetry exporters and trace correlation.
- Add end-to-end integration tests with dockerized services in CI.

## Security notes

- Never trust client identity; verify Telegram `initDataRaw` on backend.
- Use HTTPS + secure headers in production.
- Keep MongoDB/Redis private network only.
- Rotate secrets and avoid logging sensitive payloads.
