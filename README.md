# Auth Scaffold

A production-ready TypeScript monorepo with React frontend, Hono backend, and BetterAuth authentication.

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + TailwindCSS + React Router + TanStack Query
- **Backend**: Hono + BetterAuth + Drizzle ORM + SQLite
- **Real-time**: Ably Chat SDK (messaging, presence, typing indicators)
- **Shared**: Zod validation schemas
- **Testing**: Vitest (unit) + Playwright (E2E)

## Prerequisites

- Node.js 20+
- pnpm 9+

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy the example environment file and generate a secret:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Edit `packages/backend/.env` and set a secure secret (minimum 32 characters):

```bash
# Generate a secret
openssl rand -base64 32
```

Your `.env` should look like:

```env
PORT=3000
BETTER_AUTH_SECRET=your-generated-secret-here
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
ABLY_API_KEY=your-ably-api-key
```

To get an Ably API key:
1. Create an account at [ably.com](https://ably.com)
2. Create a new app in the Ably dashboard
3. Copy the API key from the app's "API Keys" tab

### 3. Run database migrations

```bash
pnpm db:migrate
```

### 4. Start development servers

```bash
pnpm dev
```

This starts both the backend (http://localhost:3000) and frontend (http://localhost:5173) concurrently.

### 5. Open the app

Navigate to http://localhost:5173 in your browser.

## Available Scripts

### Root

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |

### Database

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply migrations to SQLite |
| `pnpm db:seed` | Seed default room (run once after migrate) |
| `pnpm db:studio` | Open Drizzle Studio GUI |

## Project Structure

```
├── packages/
│   ├── backend/           # Hono API server
│   │   ├── src/
│   │   │   ├── auth/      # BetterAuth configuration
│   │   │   ├── db/        # Drizzle schema and connection
│   │   │   └── index.ts   # Server entry point
│   │   ├── drizzle/       # Migration files
│   │   └── sqlite.db      # SQLite database (generated)
│   │
│   ├── frontend/          # React application
│   │   ├── src/
│   │   │   ├── components/  # Reusable components
│   │   │   │   └── chat/    # Chat UI components
│   │   │   ├── hooks/       # React hooks (chat, preferences)
│   │   │   ├── lib/         # Auth client, Ably client
│   │   │   ├── providers/   # Context providers (ChatProvider)
│   │   │   └── pages/       # Route pages
│   │   └── index.html
│   │
│   └── shared/            # Shared code
│       └── src/
│           └── schemas/   # Zod validation schemas
│
├── tests/
│   └── e2e/               # Playwright tests
│
└── playwright.config.ts
```

## Authentication Features

- **Sign up** with full name, username, email, and password
- **Sign in** with username or email (auto-detected)
- **Session management** via secure httpOnly cookies
- **Protected routes** with automatic redirect
- **Sign out** with session cleanup

### Username Rules

- 3-30 characters
- Alphanumeric and underscores only
- Case-insensitive (stored lowercase, display preserved)

### Password Rules

- Minimum 8 characters

## Chat Features

Real-time multi-room chat powered by Ably Chat SDK:

- **Multi-room**: Create, join, and leave chat rooms
- **Private rooms**: Create invite-only rooms that don't appear in search
- **Invitation system**: Invite users to private rooms by name/username search
- **Messaging**: Send and receive messages in real-time
- **Message history**: Automatic backfill when joining rooms (30-day Ably retention)
- **Presence**: See online and offline room members
- **Typing indicators**: See when others are typing
- **Display name preference**: Choose to show full name or username

### Routes

| Route | Description |
|-------|-------------|
| `/chat` | Redirects to `/chat/landing-zone` |
| `/chat/:slug` | Chat room (e.g., `/chat/landing-zone`) |
| `/invitations` | View and manage room invitations |

## API Endpoints

All auth endpoints are handled by BetterAuth at `/api/auth/*`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Create account |
| POST | `/api/auth/sign-in/email` | Sign in with email |
| POST | `/api/auth/sign-in/username` | Sign in with username |
| POST | `/api/auth/sign-out` | Sign out |
| GET | `/api/auth/get-session` | Get current session |

Custom endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get current user (protected) |
| GET | `/api/health` | Health check |
| GET | `/api/ably/token` | Get Ably token for real-time (protected) |
| GET | `/api/preferences` | Get user preferences (protected) |
| PUT | `/api/preferences` | Update user preferences (protected) |
| GET | `/api/users/me/chat-info` | Get user's chat display info (protected) |
| GET | `/api/rooms` | List user's joined rooms (protected) |
| POST | `/api/rooms` | Create a new room (protected) |
| GET | `/api/rooms/search?q=` | Search public rooms (protected) |
| GET | `/api/rooms/:slug` | Get room details (protected) |
| GET | `/api/rooms/:slug/members` | Get room members (protected) |
| POST | `/api/rooms/:slug/join` | Join a room (protected) |
| POST | `/api/rooms/:slug/leave` | Leave a room (protected) |
| DELETE | `/api/rooms/:slug` | Delete a room (creator only) |
| POST | `/api/rooms/:slug/invitations` | Invite user to private room (protected) |
| GET | `/api/users/search?q=` | Search users by name/username (protected) |
| GET | `/api/invitations` | List pending invitations (protected) |
| GET | `/api/invitations/count` | Get invitation count for badge (protected) |
| POST | `/api/invitations/:id/accept` | Accept an invitation (protected) |
| POST | `/api/invitations/:id/decline` | Decline an invitation (protected) |

## Environment Variables

### Backend (`packages/backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `BETTER_AUTH_SECRET` | Encryption secret (min 32 chars) | Required |
| `BETTER_AUTH_URL` | Backend URL | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `ABLY_API_KEY` | Ably API key for real-time chat | Required for chat |

### Frontend

The frontend uses Vite's proxy in development, so no environment variables are required. For production, set `VITE_API_URL` to your backend URL.

## Development Notes

### Adding a new migration

1. Edit the schema in `packages/backend/src/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:migrate`

### Viewing the database

```bash
pnpm db:studio
```

Opens Drizzle Studio at https://local.drizzle.studio

### Running tests

```bash
# Unit tests
pnpm test

# E2E tests (starts servers automatically)
pnpm test:e2e
```

## Deployment

### Build for production

```bash
pnpm build
```

### Backend

The backend can be deployed to any Node.js hosting:

```bash
cd packages/backend
node dist/index.js
```

Set environment variables on your hosting platform.

### Frontend

The frontend builds to `packages/frontend/dist/` and can be deployed to any static hosting (Vercel, Netlify, Cloudflare Pages).

Update `VITE_API_URL` to point to your production backend.

## License

MIT
