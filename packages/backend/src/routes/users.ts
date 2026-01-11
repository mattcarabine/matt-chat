import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { auth } from '../auth';
import { db } from '../db';
import { userPreferences } from '../db/schema';

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
  const user = session.user as {
    id: string;
    fullName: string;
    username?: string;
    displayUsername?: string;
  };

  const displayName =
    preference === 'username'
      ? user.displayUsername || user.username || user.fullName
      : user.fullName;

  return c.json({
    userId: user.id,
    displayName,
    displayNamePreference: preference,
    fullName: user.fullName,
    username: user.displayUsername || user.username,
  });
});
