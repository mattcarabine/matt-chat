# MattChat

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
  src/routes/             # API routes (ably, preferences, users, rooms, invitations)
  src/db/schema.ts        # Drizzle schema (rooms, roomMembers, roomInvitations tables)
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

## Private Rooms & Invitations

- **Private rooms**: Rooms can be marked private at creation. Private rooms don't appear in search results
- **Invitation system**: Any member of a private room can invite others by searching for users by name/username
- **Invitations page**: `/invitations` shows pending invitations with accept/decline options. Nav badge shows count
- **Cascade delete**: Invitations auto-delete when room is deleted (database-level `onDelete: cascade`)
- **Re-invite**: Users can be re-invited after declining (invitation deleted on decline, not blocked)
- **SQLite transactions**: Uses synchronous transactions due to better-sqlite3 limitations. TODO comment marks for async conversion when migrating to Postgres

## Auth Middleware

All `/api/*` routes are protected by default via `authMiddleware` in `src/middleware/auth.ts`.

**Secure by default**: New routes automatically require authentication. No need to remember to add auth checks.

**Session access**: Protected routes access the session via `c.get('session')` - no manual fetching needed.

**Public routes**: Listed in `PUBLIC_ROUTES` array in `middleware/auth.ts`:
- `/api/health` - Health check
- `/api/images/upload/*` - Token-based upload (has own signed token auth)
- `/api/images/download/*` - Token-based download (has own signed token auth)
- `/api/auth/*` - BetterAuth handlers (mounted before middleware)

**Adding a public route**: Add the path to `PUBLIC_ROUTES` in `middleware/auth.ts`. Use `*` suffix for prefix matching.

**Route file pattern**:
```typescript
import { Hono } from 'hono';
import type { AppContext } from '../types';

export const myRoutes = new Hono<AppContext>();

myRoutes.get('/example', async (c) => {
  const session = c.get('session'); // Guaranteed to exist
  // ... use session.user.id, etc.
});
```

## E2E Testing

- **Test user email domain**: All e2e test users use `@e2e-test.local` emails to distinguish them from real users
- **e2e_mode cookie**: Tests set an `e2e_mode=true` cookie so the backend includes test users in API responses (e.g., room member lists)
- **Production filtering**: Without the cookie, the backend filters out `@e2e-test.local` users at the database level, keeping test data hidden from real users

## Environment

Backend requires `ABLY_API_KEY` in `.env`.

## Visual Design

**Brand**: MattChat - warm, modern chat application with distinctive orange accent

**Color Palette**:
- Primary accent: Ember orange (`ember-500: #F97316`, `ember-600: #EA580C`)
- Neutrals: Sand palette (warm grays from `sand-50: #FAFAF9` to `sand-950: #0C0A09`)
- Deliberately avoids blue/purple to differentiate from "AI slop" aesthetics

**Typography**:
- Display/Logo: Sora (font-display)
- Body: DM Sans (font-sans)
- Decorative: Instrument Serif (font-serif)

**Theme Support**:
- Light, Dark, and System (auto-detect) themes
- Default: System preference
- Toggle in user dropdown menu
- Uses CSS variables in `:root` and `.dark` classes
- Controlled via `ThemeProvider` in `providers/ThemeProvider.tsx`

**Design System**:
- Glassmorphism: `.glass` class for frosted glass effect with backdrop-blur
- Fixed navbar with glass effect, sticky to top
- Orange gradient avatar buttons
- Rounded corners (lg for cards/dropdowns, full for avatars/badges)

**Logo**: Two overlapping chat bubbles at slight angles forming an abstract conversational "M" shape, rendered in `components/MattChatLogo.tsx`
