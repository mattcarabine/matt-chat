import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { and, eq, like, not, or, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { user, userPreferences, roomMembers } from '../db/schema';
import { updateBioInputSchema } from '@app/shared';
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

// GET /api/users/:id/profile - Get user profile with shared rooms count
usersRoutes.get('/:id/profile', async (c) => {
  const session = c.get('session');
  const targetUserId = c.req.param('id');

  // Fetch the target user
  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, targetUserId),
  });

  if (!targetUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Get rooms where the current user is a member
  const currentUserRooms = await db
    .select({ roomId: roomMembers.roomId })
    .from(roomMembers)
    .where(eq(roomMembers.userId, session.user.id));

  const currentUserRoomIds = currentUserRooms.map((r) => r.roomId);

  // Count rooms where both users are members
  let sharedRoomsCount = 0;
  if (currentUserRoomIds.length > 0) {
    const sharedRooms = await db
      .select({ count: sql<number>`count(*)` })
      .from(roomMembers)
      .where(
        and(
          eq(roomMembers.userId, targetUserId),
          inArray(roomMembers.roomId, currentUserRoomIds)
        )
      );
    sharedRoomsCount = sharedRooms[0]?.count ?? 0;
  }

  // Get display name preference for target user
  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, targetUserId),
  });

  const preference = prefs?.displayNamePreference ?? 'fullName';
  const displayName =
    preference === 'username'
      ? targetUser.displayUsername || targetUser.username || targetUser.fullName
      : targetUser.fullName;

  return c.json({
    id: targetUser.id,
    displayName,
    username: targetUser.displayUsername || targetUser.username || null,
    bio: targetUser.bio || null,
    createdAt: targetUser.createdAt.toISOString(),
    sharedRoomsCount,
  });
});

// PUT /api/users/me/bio - Update current user's bio
usersRoutes.put('/me/bio', async (c) => {
  const session = c.get('session');

  const body = await c.req.json();
  const parsed = updateBioInputSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const { bio } = parsed.data;

  await db.update(user).set({ bio }).where(eq(user.id, session.user.id));

  return c.json({ success: true, bio });
});
