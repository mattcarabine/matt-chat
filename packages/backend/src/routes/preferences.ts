import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db';
import { userPreferences } from '../db/schema';
import { displayNamePreferenceSchema } from '@app/shared';
import type { AppContext } from '../types';

export const preferencesRoutes = new Hono<AppContext>();

const updatePreferencesSchema = z.object({
  displayNamePreference: displayNamePreferenceSchema,
});

preferencesRoutes.get('/', async (c) => {
  const session = c.get('session');

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, session.user.id),
  });

  return c.json({
    preferences: {
      displayNamePreference: prefs?.displayNamePreference ?? 'fullName',
    },
  });
});

preferencesRoutes.put('/', async (c) => {
  const session = c.get('session');

  const body = await c.req.json();
  const result = updatePreferencesSchema.safeParse(body);
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
