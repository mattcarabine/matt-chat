import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './auth';

const app = new Hono();

// Logging middleware
app.use('*', logger());

// CORS - MUST be before routes, credentials: true for cookies
app.use(
  '/api/*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Mount BetterAuth handler
app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// Protected route example - get current user
app.get('/api/me', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return c.json({ user: session.user });
});

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

const port = parseInt(process.env.PORT || '3000');
console.log(`Server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
