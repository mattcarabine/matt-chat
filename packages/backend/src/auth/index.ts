import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { db } from '../db';

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
});

export type Auth = typeof auth;
