import { Hono } from 'hono';
import { and, desc, eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { roomInvitations, roomMembers, rooms, user } from '../db/schema';
import type { AppContext } from '../types';

export const invitationsRoutes = new Hono<AppContext>();

invitationsRoutes.get('/', async (c) => {
  const session = c.get('session');

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

invitationsRoutes.get('/count', async (c) => {
  const session = c.get('session');

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(roomInvitations)
    .where(eq(roomInvitations.inviteeId, session.user.id));

  return c.json({ count: result[0]?.count ?? 0 });
});

invitationsRoutes.post('/:id/accept', async (c) => {
  const session = c.get('session');

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

  // Synchronous transaction - better-sqlite3 doesn't support async transactions
  // TODO: Switch to async transaction when migrating to Postgres/MySQL
  db.transaction((tx) => {
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

invitationsRoutes.post('/:id/decline', async (c) => {
  const session = c.get('session');

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
