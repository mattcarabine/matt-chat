import { createHash } from 'crypto';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { and, count, eq, like, not } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db';
import { roomMembers, rooms, user } from '../db/schema';
import type { AppContext } from '../types';

export const dmRoutes = new Hono<AppContext>();

const E2E_EMAIL_PATTERN = '%@e2e-test.local';
const MAX_GROUP_DM_MEMBERS = 5;

const createDmSchema = z.object({
  participantIds: z.array(z.string()).min(1).max(MAX_GROUP_DM_MEMBERS - 1), // exclude self
});

const addMemberSchema = z.object({
  userId: z.string(),
});

const convertSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  description: z.string().max(500).optional(),
});

/**
 * Generate a deterministic DM slug from sorted participant IDs.
 * This ensures the same participants always get the same DM.
 */
function generateDmSlug(participantIds: string[]): string {
  const sorted = [...participantIds].sort();
  const hash = createHash('sha256').update(sorted.join(':')).digest('hex').substring(0, 16);
  return `dm-${hash}`;
}

function generateRoomSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

async function getMemberCount(roomId: string, isE2eMode: boolean): Promise<number> {
  const baseCondition = eq(roomMembers.roomId, roomId);

  if (isE2eMode) {
    const result = await db
      .select({ count: count() })
      .from(roomMembers)
      .where(baseCondition);
    return result[0]?.count ?? 0;
  }

  const result = await db
    .select({ count: count() })
    .from(roomMembers)
    .innerJoin(user, eq(roomMembers.userId, user.id))
    .where(and(baseCondition, not(like(user.email, E2E_EMAIL_PATTERN))));
  return result[0]?.count ?? 0;
}

async function findDmById(dmId: string) {
  return db.query.rooms.findFirst({
    where: and(eq(rooms.id, dmId), eq(rooms.isDm, true)),
  });
}

async function findDmBySlug(slug: string) {
  return db.query.rooms.findFirst({
    where: and(eq(rooms.slug, slug), eq(rooms.isDm, true)),
  });
}

async function findMembership(roomId: string, userId: string) {
  return db.query.roomMembers.findFirst({
    where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
  });
}

// GET /api/dms - List user's DMs
dmRoutes.get('/', async (c) => {
  const session = c.get('session');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';

  const memberships = await db.query.roomMembers.findMany({
    where: eq(roomMembers.userId, session.user.id),
    with: {
      room: true,
    },
  });

  // Filter DMs based on E2E mode
  const filteredMemberships = memberships.filter(
    (m) => m.room.isDm && (isE2eMode ? m.room.isE2e : !m.room.isE2e)
  );

  const dmsWithDetails = await Promise.all(
    filteredMemberships.map(async (m) => {
      // Get participants (other members, excluding current user)
      const memberList = await db
        .select({
          userId: roomMembers.userId,
          fullName: user.fullName,
          name: user.name,
          displayUsername: user.displayUsername,
          username: user.username,
        })
        .from(roomMembers)
        .innerJoin(user, eq(roomMembers.userId, user.id))
        .where(
          isE2eMode
            ? and(eq(roomMembers.roomId, m.roomId), not(eq(roomMembers.userId, session.user.id)))
            : and(
                eq(roomMembers.roomId, m.roomId),
                not(eq(roomMembers.userId, session.user.id)),
                not(like(user.email, E2E_EMAIL_PATTERN))
              )
        );

      const participants = memberList.map((member) => ({
        id: member.userId,
        displayName: member.fullName || member.name || 'Anonymous',
        username: member.displayUsername || member.username,
      }));

      return {
        id: m.room.id,
        slug: m.room.slug,
        name: m.room.name,
        dmType: m.room.dmType,
        ablyRoomId: m.room.ablyRoomId,
        participants,
        memberCount: await getMemberCount(m.roomId, isE2eMode),
        joinedAt: m.joinedAt.toISOString(),
        createdAt: m.room.createdAt.toISOString(),
      };
    })
  );

  return c.json({ dms: dmsWithDetails });
});

// POST /api/dms - Create or return existing DM
dmRoutes.post('/', async (c) => {
  const session = c.get('session');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';

  const body = await c.req.json();
  const result = createDmSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.issues }, 400);
  }

  const { participantIds } = result.data;

  // Verify all participants exist
  for (const participantId of participantIds) {
    const participant = await db.query.user.findFirst({ where: eq(user.id, participantId) });
    if (!participant) {
      return c.json({ error: `User not found: ${participantId}` }, 404);
    }
  }

  // Add self to participants for slug generation
  const allParticipants = [...new Set([...participantIds, session.user.id])];
  const dmSlug = generateDmSlug(allParticipants);

  // Check if DM already exists
  const existingDm = await findDmBySlug(dmSlug);
  if (existingDm) {
    // Return existing DM
    return c.json({
      dm: {
        id: existingDm.id,
        slug: existingDm.slug,
        name: existingDm.name,
        dmType: existingDm.dmType,
        ablyRoomId: existingDm.ablyRoomId,
        createdAt: existingDm.createdAt.toISOString(),
      },
      created: false,
    });
  }

  // Determine DM type: 1 other participant = one_on_one, else group
  const dmType = participantIds.length === 1 ? 'one_on_one' : 'group';

  // Generate name based on participants (use their display names)
  const participantUsers = await Promise.all(
    participantIds.map((id) => db.query.user.findFirst({ where: eq(user.id, id) }))
  );
  const participantNames = participantUsers
    .filter((u) => u !== undefined)
    .map((u) => u!.fullName || u!.name || 'Anonymous');
  const dmName = participantNames.join(', ');

  const now = new Date();
  const dmId = nanoid();

  await db.insert(rooms).values({
    id: dmId,
    slug: dmSlug,
    name: dmName,
    description: null,
    createdBy: session.user.id,
    isDefault: false,
    isPublic: false,
    isE2e: isE2eMode,
    isDm: true,
    dmType,
    ablyRoomId: dmSlug, // Set ablyRoomId to slug at creation
    createdAt: now,
    updatedAt: now,
  });

  // Add all participants as members
  await Promise.all(
    allParticipants.map((participantId) =>
      db.insert(roomMembers).values({
        id: nanoid(),
        roomId: dmId,
        userId: participantId,
        joinedAt: now,
      })
    )
  );

  return c.json({
    dm: {
      id: dmId,
      slug: dmSlug,
      name: dmName,
      dmType,
      ablyRoomId: dmSlug,
      createdAt: now.toISOString(),
    },
    created: true,
  });
});

// GET /api/dms/:idOrSlug - Get single DM details (supports both ID and slug)
dmRoutes.get('/:idOrSlug', async (c) => {
  const session = c.get('session');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';
  const idOrSlug = c.req.param('idOrSlug');

  // Try to find by ID first, then by slug
  let dm = await findDmById(idOrSlug);
  if (!dm) {
    dm = await findDmBySlug(idOrSlug);
  }
  if (!dm) {
    return c.json({ error: 'DM not found' }, 404);
  }

  // Check E2E mode match
  if (dm.isE2e !== isE2eMode) {
    return c.json({ error: 'DM not found' }, 404);
  }

  // Verify user is a member
  const membership = await findMembership(dm.id, session.user.id);
  if (!membership) {
    return c.json({ error: 'Not a member of this DM' }, 403);
  }

  const memberCount = await getMemberCount(dm.id, isE2eMode);

  // Get participants (other members, excluding current user)
  const memberships = await db
    .select({
      userId: roomMembers.userId,
      fullName: user.fullName,
      name: user.name,
      displayUsername: user.displayUsername,
      username: user.username,
    })
    .from(roomMembers)
    .innerJoin(user, eq(roomMembers.userId, user.id))
    .where(
      isE2eMode
        ? and(eq(roomMembers.roomId, dm.id), not(eq(roomMembers.userId, session.user.id)))
        : and(
            eq(roomMembers.roomId, dm.id),
            not(eq(roomMembers.userId, session.user.id)),
            not(like(user.email, E2E_EMAIL_PATTERN))
          )
    );

  const participants = memberships.map((m) => ({
    id: m.userId,
    displayName: m.fullName || m.name || 'Anonymous',
    username: m.displayUsername || m.username,
  }));

  return c.json({
    dm: {
      id: dm.id,
      slug: dm.slug,
      name: dm.name,
      dmType: dm.dmType,
      ablyRoomId: dm.ablyRoomId,
      memberCount,
      participants,
      createdAt: dm.createdAt.toISOString(),
    },
  });
});

// GET /api/dms/:id/members - Get DM members
dmRoutes.get('/:id/members', async (c) => {
  const session = c.get('session');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';
  const dmId = c.req.param('id');

  const dm = await findDmById(dmId);
  if (!dm) {
    return c.json({ error: 'DM not found' }, 404);
  }

  // Check E2E mode match
  if (dm.isE2e !== isE2eMode) {
    return c.json({ error: 'DM not found' }, 404);
  }

  // Verify user is a member
  const membership = await findMembership(dm.id, session.user.id);
  if (!membership) {
    return c.json({ error: 'Not a member of this DM' }, 403);
  }

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
        ? eq(roomMembers.roomId, dm.id)
        : and(eq(roomMembers.roomId, dm.id), not(like(user.email, E2E_EMAIL_PATTERN)))
    );

  const members = memberships.map((m) => ({
    id: m.userId,
    displayName: m.fullName || m.name || 'Anonymous',
    username: m.displayUsername || m.username,
    joinedAt: m.joinedAt.toISOString(),
  }));

  return c.json({ members });
});

// POST /api/dms/:id/members - Add member to group DM
dmRoutes.post('/:id/members', async (c) => {
  const session = c.get('session');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';
  const dmId = c.req.param('id');

  const body = await c.req.json();
  const result = addMemberSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.issues }, 400);
  }

  const { userId } = result.data;

  const dm = await findDmById(dmId);
  if (!dm) {
    return c.json({ error: 'DM not found' }, 404);
  }

  // Check E2E mode match
  if (dm.isE2e !== isE2eMode) {
    return c.json({ error: 'DM not found' }, 404);
  }

  // Only group DMs can have members added
  if (dm.dmType !== 'group') {
    return c.json({ error: 'Cannot add members to one-on-one DM' }, 400);
  }

  // Verify requester is a member
  const membership = await findMembership(dm.id, session.user.id);
  if (!membership) {
    return c.json({ error: 'Not a member of this DM' }, 403);
  }

  // Check member limit
  const currentMemberCount = await getMemberCount(dm.id, isE2eMode);
  if (currentMemberCount >= MAX_GROUP_DM_MEMBERS) {
    return c.json({ error: `Group DM cannot exceed ${MAX_GROUP_DM_MEMBERS} members` }, 400);
  }

  // Verify user to add exists
  const userToAdd = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!userToAdd) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Check if already a member
  const existingMembership = await findMembership(dm.id, userId);
  if (existingMembership) {
    return c.json({ error: 'User is already a member' }, 400);
  }

  // Add the new member
  await db.insert(roomMembers).values({
    id: nanoid(),
    roomId: dm.id,
    userId,
    joinedAt: new Date(),
  });

  // Update the DM name to include the new member
  const allMemberships = await db
    .select({ fullName: user.fullName, name: user.name })
    .from(roomMembers)
    .innerJoin(user, eq(roomMembers.userId, user.id))
    .where(eq(roomMembers.roomId, dm.id));

  const newName = allMemberships
    .filter((m) => m.fullName || m.name)
    .map((m) => m.fullName || m.name || 'Anonymous')
    .join(', ');

  await db.update(rooms).set({ name: newName, updatedAt: new Date() }).where(eq(rooms.id, dm.id));

  return c.json({ success: true });
});

// POST /api/dms/:id/convert - Convert group DM to private room
dmRoutes.post('/:id/convert', async (c) => {
  const session = c.get('session');
  const isE2eMode = getCookie(c, 'e2e_mode') === 'true';
  const dmId = c.req.param('id');

  const body = await c.req.json();
  const result = convertSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.issues }, 400);
  }

  const { name, description } = result.data;

  const dm = await findDmById(dmId);
  if (!dm) {
    return c.json({ error: 'DM not found' }, 404);
  }

  // Check E2E mode match
  if (dm.isE2e !== isE2eMode) {
    return c.json({ error: 'DM not found' }, 404);
  }

  // Only group DMs can be converted
  if (dm.dmType !== 'group') {
    return c.json({ error: 'Only group DMs can be converted to rooms' }, 400);
  }

  // Verify requester is a member
  const membership = await findMembership(dm.id, session.user.id);
  if (!membership) {
    return c.json({ error: 'Not a member of this DM' }, 403);
  }

  // Generate a new unique slug for the room
  let newSlug = generateRoomSlug(name);
  let suffix = 0;
  while (await db.query.rooms.findFirst({ where: eq(rooms.slug, suffix ? `${newSlug}-${suffix}` : newSlug) })) {
    suffix++;
  }
  if (suffix) newSlug = `${newSlug}-${suffix}`;

  const now = new Date();

  // Update the DM to become a regular private room
  // IMPORTANT: Keep ablyRoomId unchanged to preserve chat history
  await db
    .update(rooms)
    .set({
      slug: newSlug,
      name,
      description: description || null,
      isDm: false,
      dmType: null,
      isPublic: false, // Converted rooms are private by default
      updatedAt: now,
    })
    .where(eq(rooms.id, dm.id));

  return c.json({
    room: {
      id: dm.id,
      slug: newSlug,
      name,
      description: description || null,
      ablyRoomId: dm.ablyRoomId, // Preserved from original DM
      isPublic: false,
      createdAt: dm.createdAt.toISOString(),
    },
  });
});
