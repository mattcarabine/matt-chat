import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { rooms, roomMembers } from '../db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    // Username plugin: case-insensitive lookup, preserves display casing
    username(),
  ],

  user: {
    additionalFields: {
      fullName: {
        type: 'string',
        required: true,
        input: true, // Allow during signup
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-join new users to the default room
          const defaultRoom = await db.query.rooms.findFirst({
            where: eq(rooms.isDefault, true),
          });

          if (defaultRoom) {
            await db.insert(roomMembers).values({
              id: nanoid(),
              roomId: defaultRoom.id,
              userId: user.id,
              joinedAt: new Date(),
            });
          }
        },
      },
    },
  },
});

export type Auth = typeof auth;
