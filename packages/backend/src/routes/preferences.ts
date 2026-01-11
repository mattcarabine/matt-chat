import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '../auth';
import { db } from '../db';
import { userPreferences } from '../db/schema';
import { displayNamePreferenceSchema } from '@app/shared';
import { z } from 'zod';

export const preferencesRoutes = new Hono();

// Get user preferences
preferencesRoutes.get('/', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, session.user.id),
  });

  // Return defaults if no preferences exist
  return c.json({
    preferences: {
      displayNamePreference: prefs?.displayNamePreference ?? 'fullName',
    },
  });
});

// Update user preferences
preferencesRoutes.put('/', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const result = z
    .object({
      displayNamePreference: displayNamePreferenceSchema,
    })
    .safeParse(body);

  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.issues }, 400);
  }

  const now = new Date();
  const existing = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(userPreferences)
      .set({
        displayNamePreference: result.data.displayNamePreference,
        updatedAt: now,
      })
      .where(eq(userPreferences.userId, session.user.id));
  } else {
    await db.insert(userPreferences).values({
      id: nanoid(),
      userId: session.user.id,
      displayNamePreference: result.data.displayNamePreference,
      createdAt: now,
      updatedAt: now,
    });
  }

  return c.json({
    preferences: {
      displayNamePreference: result.data.displayNamePreference,
    },
  });
});
