import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './auth';
import { authMiddleware } from './middleware/auth';
import type { AppContext } from './types';
import { ablyRoutes } from './routes/ably';
import { preferencesRoutes } from './routes/preferences';
import { usersRoutes } from './routes/users';
import { roomsRoutes } from './routes/rooms';
import { invitationsRoutes } from './routes/invitations';
import { imagesRoutes } from './routes/images';
import { dmRoutes } from './routes/dms';

const app = new Hono<AppContext>();

app.use('*', logger());

app.use(
  '/api/*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.use('/api/*', authMiddleware);

app.route('/api/ably', ablyRoutes);
app.route('/api/preferences', preferencesRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/rooms', roomsRoutes);
app.route('/api/invitations', invitationsRoutes);
app.route('/api/dms', dmRoutes);
app.route('/api', imagesRoutes);

app.get('/api/me', (c) => {
  const session = c.get('session');
  return c.json({ user: session.user });
});

app.get('/api/health', (c) => c.json({ status: 'ok' }));

const port = parseInt(process.env.PORT || '3000');
console.log(`Server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
