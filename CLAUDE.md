# Auth Scaffold

TypeScript monorepo with authentication and real-time chat using pnpm workspaces.

## Coding Style

Production code. Must be maintainable.
This codebase will outlive you. Every shortcut you take becomes
someone else's burden. Every hack compounds into technical debt
that slows the whole team down.
You are not just writing code. You are shaping the future of this
project. The patterns you establish will be copied. The corners
you cut will be cut again.
Fight entropy. Leave the codebase better than you found it.
All changes must be well tested, if tests do not exist, you must add them

Use code-simplifier to simplify any code you write before finishing.

## Tech Stack

- **Backend**: Hono, BetterAuth, Drizzle ORM, SQLite
- **Frontend**: React, Vite, TanStack Query, TailwindCSS
- **Chat**: Ably Chat SDK (presence, typing indicators, message history)
- **Shared**: Zod validation schemas

## Structure

```
packages/backend/         # Hono API server (port 3000)
  src/routes/             # API routes (ably, preferences, users, rooms)
  src/db/schema.ts        # Drizzle schema (rooms, roomMembers tables)
packages/frontend/        # React app (port 5173)
  src/components/chat/    # Chat UI (ChatRoom, RoomSidebar, modals)
  src/hooks/useChat.ts    # Ably hooks (messages, presence, typing)
  src/hooks/useRooms.ts   # Room CRUD hooks (TanStack Query)
  src/providers/          # ChatProvider for Ably connection
packages/shared/          # Shared Zod schemas (auth, chat, rooms)
```

## Commands

```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm db:migrate   # Apply database migrations
pnpm test:e2e     # Run Playwright E2E tests
```

## Chat Architecture

- **Multi-room**: Users can create, join, and leave rooms. Room metadata in SQLite, messages in Ably (30-day retention)
- **Default room**: "Landing Zone" - all users auto-join on signup via BetterAuth `databaseHooks`
- **Room slug as Ably room ID**: `/chat/:slug` maps directly to Ably room
- **History**: Uses `historyBeforeSubscribe()` for seamless backfill without message overlap
- **Presence**: Shows online/offline members by cross-referencing Ably presence with room membership

## E2E Testing

- **Test user email domain**: All e2e test users use `@e2e-test.local` emails to distinguish them from real users
- **e2e_mode cookie**: Tests set an `e2e_mode=true` cookie so the backend includes test users in API responses (e.g., room member lists)
- **Production filtering**: Without the cookie, the backend filters out `@e2e-test.local` users at the database level, keeping test data hidden from real users

## Environment

Backend requires `ABLY_API_KEY` in `.env`.
