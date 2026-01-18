import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { and, eq, like, not, or } from 'drizzle-orm';
import { db } from '../db';
import { user, userPreferences } from '../db/schema';
import type { AppContext } from '../types';

export const usersRoutes = new Hono<AppContext>();

type SessionUser = {
  id: string;
  fullName: string;
  username?: string;
  displayUsername?: string;
};

usersRoutes.get('/me/chat-info', async (c) => {
  const session = c.get('session');
  const sessionUser = session.user as SessionUser;

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, session.user.id),
  });

  const preference = prefs?.displayNamePreference ?? 'fullName';
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

usersRoutes.get('/search', async (c) => {
  const session = c.get('session');

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
        not(eq(user.id, session.user.id)),
        isE2eMode ? undefined : not(like(user.email, '%@e2e-test.local'))
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

usersRoutes.get('/:userId', async (c) => {
  const session = c.get('session');
  const userId = c.req.param('userId');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';

  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!targetUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Filter out E2E test users in production mode
  const isE2eTestUser = targetUser.email.endsWith('@e2e-test.local');
  if (isE2eTestUser && !isE2eMode) {
    return c.json({ error: 'User not found' }, 404);
  }

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  });

  const preference = prefs?.displayNamePreference ?? 'fullName';
  const resolvedUsername = targetUser.displayUsername || targetUser.username || null;
  const displayName =
    preference === 'username' && resolvedUsername
      ? resolvedUsername
      : targetUser.fullName;

  // Only include email if the user is viewing their own profile
  const isOwnProfile = session.user.id === userId;

  return c.json({
    id: targetUser.id,
    displayName,
    fullName: targetUser.fullName,
    username: resolvedUsername,
    email: isOwnProfile ? targetUser.email : null,
    memberSince: targetUser.createdAt.toISOString(),
    displayNamePreference: preference,
  });
});
