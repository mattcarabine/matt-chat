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
**Every user-facing feature requires E2E test coverage before it's considered complete.**

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

Tests live in `packages/frontend/e2e/` using Playwright.

### Structure
```
e2e/
  utils/
    helpers.ts          # Shared utilities (login, createRoom, etc.)
    fixtures.ts         # Custom test fixtures if needed
  auth/                 # Auth flow tests
  chat/                 # Chat feature tests
  rooms/                # Room CRUD tests
  invitations/          # Invitation flow tests
```

### Test User Convention
- **Email domain**: All test users use `@e2e-test.local` emails
- **e2e_mode cookie**: Tests set `e2e_mode=true` cookie so backend includes test users in responses
- **Production filtering**: Without cookie, `@e2e-test.local` users filtered at DB level

### E2E Room Isolation
- **E2E rooms**: Rooms created with `e2e_mode=true` cookie are marked `isE2e: true` in the database
- **E2E mode filtering**: Tests only see E2E rooms (Landing Zone and production rooms are hidden)
- **Production filtering**: Without cookie, E2E rooms are filtered out from room lists and search
- **Cross-mode protection**: Users cannot join rooms from the opposite mode (production users can't join E2E rooms and vice versa)
- **Tests must create rooms**: Since E2E users don't see Landing Zone, all tests must create their own E2E rooms using `createRoom()` helper

### Writing Tests

**Always use helpers for repeated actions:**
```typescript
import { loginAsNewUser, createRoom, sendMessage } from '../utils/helpers';

test('user can send message in room', async ({ page }) => {
  const user = await loginAsNewUser(page);
  const room = await createRoom(page, { name: 'Test Room' });
  await sendMessage(page, 'Hello world');
  await expect(page.getByText('Hello world')).toBeVisible();
});
```

**Selector priority:**
1. `data-testid` attributes (preferred)
2. Accessible roles: `getByRole('button', { name: 'Send' })`
3. Text content: `getByText('Join Room')`
4. CSS selectors (last resort)

**Required patterns:**
- Unique test data per test (use timestamps/random suffixes)
- Clean up created resources when possible
- No hardcoded waits - use Playwright's auto-waiting
- Tests must be independent and parallelizable

### Adding data-testid

When implementing features, add `data-testid` to interactive elements:
```tsx
Send

```

### Commands
```bash
pnpm test:e2e              # Run all E2E tests
pnpm test:e2e --ui         # Interactive UI mode
pnpm test:e2e auth/        # Run specific folder
```

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
