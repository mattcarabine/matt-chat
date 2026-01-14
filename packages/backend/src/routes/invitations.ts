import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '../auth';
import { db } from '../db';
import { rooms, roomMembers, roomInvitations, user } from '../db/schema';

export const invitationsRoutes = new Hono();

// GET /api/invitations - List pending received invitations
invitationsRoutes.get('/', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const invitations = await db
    .select({
      id: roomInvitations.id,
      roomId: roomInvitations.roomId,
      roomName: rooms.name,
      roomSlug: rooms.slug,
      inviterId: roomInvitations.inviterId,
      inviterName: user.fullName,
      createdAt: roomInvitations.createdAt,
    })
    .from(roomInvitations)
    .innerJoin(rooms, eq(roomInvitations.roomId, rooms.id))
    .innerJoin(user, eq(roomInvitations.inviterId, user.id))
    .where(eq(roomInvitations.inviteeId, session.user.id))
    .orderBy(desc(roomInvitations.createdAt));

  return c.json({
    invitations: invitations.map((inv) => ({
      ...inv,
      inviterName: inv.inviterName || 'Unknown',
      createdAt: inv.createdAt.toISOString(),
    })),
  });
});

// GET /api/invitations/count - Get count of pending invitations (for nav badge)
invitationsRoutes.get('/count', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(roomInvitations)
    .where(eq(roomInvitations.inviteeId, session.user.id));

  return c.json({ count: result[0]?.count ?? 0 });
});

// POST /api/invitations/:id/accept - Accept an invitation
invitationsRoutes.post('/:id/accept', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const invitationId = c.req.param('id');

  const invitation = await db.query.roomInvitations.findFirst({
    where: and(
      eq(roomInvitations.id, invitationId),
      eq(roomInvitations.inviteeId, session.user.id)
    ),
    with: { room: true },
  });

  if (!invitation) {
    return c.json({ error: 'Invitation not found' }, 404);
  }

  const now = new Date();

  // Synchronous transaction - better-sqlite3 doesn't support async transactions.
  // TODO: Switch to async transaction when migrating to Postgres/MySQL.
  db.transaction((tx) => {
    // Check if already a member (edge case)
    const existingMembership = tx
      .select()
      .from(roomMembers)
      .where(
        and(
          eq(roomMembers.roomId, invitation.roomId),
          eq(roomMembers.userId, session.user.id)
        )
      )
      .get();

    if (!existingMembership) {
      tx.insert(roomMembers).values({
        id: nanoid(),
        roomId: invitation.roomId,
        userId: session.user.id,
        joinedAt: now,
      }).run();
    }

    // Delete the invitation
    tx.delete(roomInvitations).where(eq(roomInvitations.id, invitationId)).run();
  });

  return c.json({
    success: true,
    room: {
      id: invitation.room.id,
      slug: invitation.room.slug,
      name: invitation.room.name,
    },
  });
});

// POST /api/invitations/:id/decline - Decline an invitation
invitationsRoutes.post('/:id/decline', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const invitationId = c.req.param('id');

  const invitation = await db.query.roomInvitations.findFirst({
    where: and(
      eq(roomInvitations.id, invitationId),
      eq(roomInvitations.inviteeId, session.user.id)
    ),
  });

  if (!invitation) {
    return c.json({ error: 'Invitation not found' }, 404);
  }

  await db.delete(roomInvitations).where(eq(roomInvitations.id, invitationId));

  return c.json({ success: true });
});
