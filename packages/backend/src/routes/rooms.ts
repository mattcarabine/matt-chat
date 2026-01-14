import { Hono } from 'hono';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq, and, sql, count, not, like } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { auth } from '../auth';
import { db } from '../db';
import { rooms, roomMembers, user } from '../db/schema';

export const roomsRoutes = new Hono();

const createRoomSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  description: z.string().max(500).optional(),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

async function getSession(c: Context) {
  return auth.api.getSession({ headers: c.req.raw.headers });
}

async function getMemberCount(roomId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(roomMembers)
    .where(eq(roomMembers.roomId, roomId));
  return result[0]?.count ?? 0;
}

async function findRoomBySlug(slug: string) {
  return db.query.rooms.findFirst({ where: eq(rooms.slug, slug) });
}

async function findMembership(roomId: string, userId: string) {
  return db.query.roomMembers.findFirst({
    where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
  });
}

// GET /api/rooms - List user's joined rooms
roomsRoutes.get('/', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const memberships = await db.query.roomMembers.findMany({
    where: eq(roomMembers.userId, session.user.id),
    with: {
      room: true,
    },
  });

  const roomsWithCounts = await Promise.all(
    memberships.map(async (m) => ({
      id: m.room.id,
      slug: m.room.slug,
      name: m.room.name,
      description: m.room.description,
      isDefault: m.room.isDefault,
      memberCount: await getMemberCount(m.roomId),
      joinedAt: m.joinedAt.toISOString(),
    }))
  );

  return c.json({ rooms: roomsWithCounts });
});

// GET /api/rooms/search - Search public rooms or show popular rooms
roomsRoutes.get('/search', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const query = c.req.query('q') || '';
  const userId = session.user.id;

  // Get user's current memberships
  const userMemberships = await db.query.roomMembers.findMany({
    where: eq(roomMembers.userId, userId),
  });
  const memberRoomIds = new Set(userMemberships.map((m) => m.roomId));

  if (query) {
    // Search mode: find rooms matching the query
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const searchPattern = `%${query}%`;

    const searchResults = await db.query.rooms.findMany({
      where: and(
        eq(rooms.isPublic, true),
        sql`(${rooms.name} LIKE ${searchPattern} OR ${rooms.description} LIKE ${searchPattern})`
      ),
      limit,
    });

    const roomsWithMembership = await Promise.all(
      searchResults.map(async (room) => ({
        id: room.id,
        slug: room.slug,
        name: room.name,
        description: room.description,
        memberCount: await getMemberCount(room.id),
        isMember: memberRoomIds.has(room.id),
      }))
    );

    return c.json({ rooms: roomsWithMembership });
  }

  // Popular rooms mode: top 10 by member count, excluding joined and default rooms
  // Use LEFT JOIN with GROUP BY for efficient database-side counting and sorting
  const popularRoomsQuery = await db
    .select({
      id: rooms.id,
      slug: rooms.slug,
      name: rooms.name,
      description: rooms.description,
      memberCount: count(roomMembers.id),
    })
    .from(rooms)
    .leftJoin(roomMembers, eq(roomMembers.roomId, rooms.id))
    .where(
      and(
        eq(rooms.isPublic, true),
        eq(rooms.isDefault, false),
        sql`${rooms.id} NOT IN (SELECT roomId FROM room_members WHERE userId = ${userId})`
      )
    )
    .groupBy(rooms.id)
    .orderBy(sql`count(${roomMembers.id}) DESC`)
    .limit(10);

  const popularRooms = popularRoomsQuery.map((room) => ({
    ...room,
    isMember: false,
  }));

  return c.json({ rooms: popularRooms });
});

// POST /api/rooms - Create a new room
roomsRoutes.post('/', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const result = createRoomSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.issues }, 400);
  }

  const { name, description } = result.data;

  // Generate unique slug
  let slug = generateSlug(name);
  let suffix = 0;
  while (await findRoomBySlug(suffix ? `${slug}-${suffix}` : slug)) {
    suffix++;
  }
  if (suffix) slug = `${slug}-${suffix}`;

  const now = new Date();
  const roomId = nanoid();

  await db.insert(rooms).values({
    id: roomId,
    slug,
    name,
    description: description || null,
    createdBy: session.user.id,
    isDefault: false,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(roomMembers).values({
    id: nanoid(),
    roomId,
    userId: session.user.id,
    joinedAt: now,
  });

  return c.json({
    room: { id: roomId, slug, name, description: description || null, createdAt: now.toISOString() },
  });
});

// GET /api/rooms/:slug - Get room details
roomsRoutes.get('/:slug', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  const [memberCount, membership] = await Promise.all([
    getMemberCount(room.id),
    findMembership(room.id, session.user.id),
  ]);

  return c.json({
    room: {
      id: room.id,
      slug: room.slug,
      name: room.name,
      description: room.description,
      createdBy: room.createdBy,
      isDefault: room.isDefault,
      isPublic: room.isPublic,
      memberCount,
      isMember: !!membership,
      isCreator: room.createdBy === session.user.id,
      createdAt: room.createdAt.toISOString(),
    },
  });
});

// GET /api/rooms/:slug/members - Get room members
roomsRoutes.get('/:slug/members', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  // In e2e test mode (cookie set), include test users; otherwise filter them out
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';

  const memberships = await db
    .select({
      userId: roomMembers.userId,
      joinedAt: roomMembers.joinedAt,
      fullName: user.fullName,
      name: user.name,
      displayUsername: user.displayUsername,
      username: user.username,
    })
    .from(roomMembers)
    .innerJoin(user, eq(roomMembers.userId, user.id))
    .where(
      isE2eMode
        ? eq(roomMembers.roomId, room.id)
        : and(eq(roomMembers.roomId, room.id), not(like(user.email, '%@e2e-test.local')))
    );

  const members = memberships.map((m) => ({
    id: m.userId,
    displayName: m.fullName || m.name || 'Anonymous',
    username: m.displayUsername || m.username,
    joinedAt: m.joinedAt.toISOString(),
  }));

  return c.json({ members });
});

// POST /api/rooms/:slug/join - Join a room
roomsRoutes.post('/:slug/join', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  if (await findMembership(room.id, session.user.id)) {
    return c.json({ error: 'Already a member of this room' }, 400);
  }

  await db.insert(roomMembers).values({
    id: nanoid(),
    roomId: room.id,
    userId: session.user.id,
    joinedAt: new Date(),
  });

  return c.json({
    success: true,
    room: { id: room.id, slug: room.slug, name: room.name },
  });
});

// POST /api/rooms/:slug/leave - Leave a room
roomsRoutes.post('/:slug/leave', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  if (room.isDefault) {
    return c.json({ error: 'Cannot leave the default room' }, 400);
  }

  if (!(await findMembership(room.id, session.user.id))) {
    return c.json({ error: 'Not a member of this room' }, 404);
  }

  await db
    .delete(roomMembers)
    .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, session.user.id)));

  return c.json({ success: true });
});

// DELETE /api/rooms/:slug - Delete a room
roomsRoutes.delete('/:slug', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  if (room.isDefault) {
    return c.json({ error: 'Cannot delete the default room' }, 400);
  }

  if (room.createdBy !== session.user.id) {
    return c.json({ error: 'Only the room creator can delete this room' }, 403);
  }

  await db.delete(rooms).where(eq(rooms.id, room.id));

  return c.json({ success: true });
});
