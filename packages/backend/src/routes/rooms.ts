import { Hono } from 'hono';
import type { Context } from 'hono';
import { eq, and, sql, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { auth } from '../auth';
import { db } from '../db';
import { rooms, roomMembers } from '../db/schema';

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

// GET /api/rooms/search - Search public rooms
roomsRoutes.get('/search', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const query = c.req.query('q') || '';
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const searchPattern = `%${query}%`;

  const searchResults = await db.query.rooms.findMany({
    where: and(
      eq(rooms.isPublic, true),
      query
        ? sql`(${rooms.name} LIKE ${searchPattern} OR ${rooms.description} LIKE ${searchPattern})`
        : undefined
    ),
    limit,
  });

  const userMemberships = await db.query.roomMembers.findMany({
    where: eq(roomMembers.userId, session.user.id),
  });
  const memberRoomIds = new Set(userMemberships.map((m) => m.roomId));

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

  const memberships = await db.query.roomMembers.findMany({
    where: eq(roomMembers.roomId, room.id),
    with: {
      user: true,
    },
  });

  const members = memberships.map((m) => ({
    id: m.userId,
    displayName: m.user.fullName || m.user.name || 'Anonymous',
    username: m.user.displayUsername || m.user.username,
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
