import { createMiddleware } from 'hono/factory';
import type { MiddlewareHandler } from 'hono';
import { auth } from '../auth';

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type AuthVariables = {
  session: Session;
};

const PUBLIC_ROUTES = [
  '/api/health',
  '/api/images/upload/*',
  '/api/images/download/*',
];

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((pattern) => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
  });
}

export function public_(): MiddlewareHandler {
  return async (_c, next) => {
    await next();
  };
}

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    if (isPublicRoute(c.req.path)) {
      await next();
      return;
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('session', session);
    await next();
  }
);
