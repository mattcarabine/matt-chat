import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq, or, like, not, and } from 'drizzle-orm';
import { auth } from '../auth';
import { db } from '../db';
import { userPreferences, user } from '../db/schema';

export const usersRoutes = new Hono();

// Get current user's chat display info
usersRoutes.get('/me/chat-info', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, session.user.id),
  });

  const preference = prefs?.displayNamePreference ?? 'fullName';
  const sessionUser = session.user as {
    id: string;
    fullName: string;
    username?: string;
    displayUsername?: string;
  };

  const displayName =
    preference === 'username'
      ? sessionUser.displayUsername || sessionUser.username || sessionUser.fullName
      : sessionUser.fullName;

  return c.json({
    userId: sessionUser.id,
    displayName,
    displayNamePreference: preference,
    fullName: sessionUser.fullName,
    username: sessionUser.displayUsername || sessionUser.username,
  });
});

// GET /api/users/search - Search users by username/name
usersRoutes.get('/search', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const query = c.req.query('q') || '';
  if (query.length < 2) {
    return c.json({ users: [] });
  }

  const searchPattern = `%${query}%`;
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';

  const results = await db
    .select({
      id: user.id,
      fullName: user.fullName,
      name: user.name,
      username: user.username,
      displayUsername: user.displayUsername,
      email: user.email,
    })
    .from(user)
    .where(
      and(
        or(
          like(user.fullName, searchPattern),
          like(user.username, searchPattern),
          like(user.displayUsername, searchPattern)
        ),
        not(eq(user.id, session.user.id)), // Exclude self
        isE2eMode ? undefined : not(like(user.email, '%@e2e-test.local')) // Filter test users
      )
    )
    .limit(10);

  return c.json({
    users: results.map((u) => ({
      id: u.id,
      displayName: u.fullName || u.name || 'Anonymous',
      username: u.displayUsername || u.username,
    })),
  });
});
