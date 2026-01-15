import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { and, count, eq, like, not, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db';
import { roomInvitations, roomMembers, rooms, user } from '../db/schema';
import type { AppContext } from '../types';

export const roomsRoutes = new Hono<AppContext>();

const createRoomSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional().default(true),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
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

roomsRoutes.get('/', async (c) => {
  const session = c.get('session');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';

  const memberships = await db.query.roomMembers.findMany({
    where: eq(roomMembers.userId, session.user.id),
    with: {
      room: true,
    },
  });

  // Filter rooms based on E2E mode:
  // - E2E mode: only show E2E rooms
  // - Production: only show non-E2E rooms
  const filteredMemberships = memberships.filter((m) =>
    isE2eMode ? m.room.isE2e : !m.room.isE2e
  );

  const roomsWithCounts = await Promise.all(
    filteredMemberships.map(async (m) => ({
      id: m.room.id,
      slug: m.room.slug,
      name: m.room.name,
      description: m.room.description,
      isDefault: m.room.isDefault,
      isPublic: m.room.isPublic,
      memberCount: await getMemberCount(m.roomId),
      joinedAt: m.joinedAt.toISOString(),
    }))
  );

  return c.json({ rooms: roomsWithCounts });
});

roomsRoutes.get('/search', async (c) => {
  const session = c.get('session');
  const query = c.req.query('q') || '';
  const userId = session.user.id;
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';

  const userMemberships = await db.query.roomMembers.findMany({
    where: eq(roomMembers.userId, userId),
  });
  const memberRoomIds = new Set(userMemberships.map((m) => m.roomId));

  if (query) {
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const searchPattern = `%${query}%`;

    const searchResults = await db.query.rooms.findMany({
      where: and(
        eq(rooms.isPublic, true),
        eq(rooms.isE2e, isE2eMode),
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
        eq(rooms.isE2e, isE2eMode),
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

roomsRoutes.post('/', async (c) => {
  const session = c.get('session');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';

  const body = await c.req.json();
  const result = createRoomSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.issues }, 400);
  }

  const { name, description, isPublic } = result.data;

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
    isPublic,
    isE2e: isE2eMode,
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

roomsRoutes.get('/:slug', async (c) => {
  const session = c.get('session');

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

roomsRoutes.get('/:slug/members', async (c) => {
  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

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

roomsRoutes.post('/:slug/join', async (c) => {
  const session = c.get('session');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  // Prevent cross-mode joining
  if (room.isE2e && !isE2eMode) {
    return c.json({ error: 'Room not found' }, 404);
  }
  if (!room.isE2e && isE2eMode) {
    return c.json({ error: 'Cannot join production rooms in E2E mode' }, 403);
  }

  if (!room.isPublic) {
    return c.json({ error: 'Cannot join private room directly - invitation required' }, 403);
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

roomsRoutes.post('/:slug/invitations', async (c) => {
  const session = c.get('session');

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  if (room.isPublic) {
    return c.json({ error: 'Cannot invite to public rooms - users can join directly' }, 400);
  }

  const membership = await findMembership(room.id, session.user.id);
  if (!membership) {
    return c.json({ error: 'You must be a member to invite others' }, 403);
  }

  const body = await c.req.json();
  const { inviteeId } = z.object({ inviteeId: z.string() }).parse(body);

  const invitee = await db.query.user.findFirst({ where: eq(user.id, inviteeId) });
  if (!invitee) {
    return c.json({ error: 'User not found' }, 404);
  }

  const existingMembership = await findMembership(room.id, inviteeId);
  if (existingMembership) {
    return c.json({ error: 'User is already a member' }, 400);
  }

  await db.delete(roomInvitations).where(
    and(eq(roomInvitations.roomId, room.id), eq(roomInvitations.inviteeId, inviteeId))
  );

  const now = new Date();
  const invitationId = nanoid();

  await db.insert(roomInvitations).values({
    id: invitationId,
    roomId: room.id,
    inviterId: session.user.id,
    inviteeId,
    createdAt: now,
  });

  return c.json({ success: true, invitationId });
});

roomsRoutes.post('/:slug/leave', async (c) => {
  const session = c.get('session');

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  if (!(await findMembership(room.id, session.user.id))) {
    return c.json({ error: 'Not a member of this room' }, 404);
  }

  await db
    .delete(roomMembers)
    .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, session.user.id)));

  return c.json({ success: true });
});

roomsRoutes.delete('/:slug', async (c) => {
  const session = c.get('session');

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
