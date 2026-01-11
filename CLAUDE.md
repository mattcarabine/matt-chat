# Auth Scaffold

TypeScript monorepo authentication boilerplate with pnpm workspaces. Implements user registration, login (via email or username), session management, and protected routes.

## Tech Stack

- **Backend**: Hono, BetterAuth, Drizzle ORM, SQLite
- **Frontend**: React, Vite, TanStack Query, TailwindCSS
- **Shared**: Zod validation schemas
- **Testing**: Vitest (unit), Playwright (E2E)

## Structure

```
packages/backend/   # Hono API server (port 3000)
packages/frontend/  # React app (port 5173)
packages/shared/    # Shared Zod schemas
tests/e2e/          # Playwright tests
drizzle/            # Database migrations
```

## Commands

```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm test         # Run unit tests
pnpm test:e2e     # Run Playwright E2E tests
pnpm typecheck    # Type-check all packages
pnpm db:migrate   # Apply database migrations
pnpm db:studio    # Open Drizzle Studio
```

## Conventions

- TypeScript strict mode enabled
- Zod schemas in `packages/shared/` for frontend/backend validation
- BetterAuth handles all authentication flows
- Drizzle ORM for database access with SQLite
- API routes at `/api/auth/*` (BetterAuth) and custom endpoints

## Testing

E2E tests in `tests/e2e/auth.spec.ts`. Playwright auto-starts both servers:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

Run with `pnpm test:e2e`. Tests cover signup, signin, protected routes, and signout flows.
