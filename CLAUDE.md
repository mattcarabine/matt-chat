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
  src/routes/             # Chat routes (ably, preferences, users)
packages/frontend/        # React app (port 5173)
  src/components/chat/    # Chat UI components
  src/hooks/useChat.ts    # Chat hooks (messages, presence, typing)
  src/providers/          # ChatProvider for Ably connection
packages/shared/          # Shared Zod schemas (auth, chat)
```

## Commands

```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm db:migrate   # Apply database migrations
pnpm test:e2e     # Run Playwright E2E tests
```

## Chat Feature

- Single room "landing-zone" at `/chat/landing-zone` (URL-based routing for future multi-room)
- Ably token auth via `/api/ably/token`
- User display preference (fullName vs username) stored in `user_preferences` table
- React hooks: `useChatMessages`, `useChatPresence`, `useChatTyping`

## Environment

Backend requires `ABLY_API_KEY` in `.env`.
