import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// User table - BetterAuth core + username plugin + custom fullName
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
  name: text('name'),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  // Username plugin fields
  username: text('username').unique(),
  displayUsername: text('displayUsername'),
  // Custom fields
  fullName: text('fullName').notNull(),
  bio: text('bio'), // Optional bio, max 160 chars enforced at API level
});

// Session table - BetterAuth core
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Account table - BetterAuth core (for OAuth and credentials)
export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Verification table - BetterAuth core (for email verification, etc.)
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

// User preferences table - stores display and notification preferences
export const userPreferences = sqliteTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  displayNamePreference: text('displayNamePreference', {
    enum: ['fullName', 'username'],
  })
    .notNull()
    .default('fullName'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Rooms table - stores chat room metadata
export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(), // URL-friendly identifier (e.g., "landing-zone")
  name: text('name').notNull(), // Display name
  description: text('description'), // Optional description
  createdBy: text('createdBy').references(() => user.id, { onDelete: 'set null' }),
  isDefault: integer('isDefault', { mode: 'boolean' }).notNull().default(false),
  isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(true), // For future private rooms
  isE2e: integer('isE2e', { mode: 'boolean' }).notNull().default(false), // Marks E2E test rooms
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Room members table - tracks which users have joined which rooms
export const roomMembers = sqliteTable(
  'room_members',
  {
    id: text('id').primaryKey(),
    roomId: text('roomId')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    joinedAt: integer('joinedAt', { mode: 'timestamp' }).notNull(),
    // Future fields for moderation:
    // role: text('role', { enum: ['member', 'moderator', 'admin'] }).notNull().default('member'),
    // isMuted: integer('isMuted', { mode: 'boolean' }).notNull().default(false),
    // mutedUntil: integer('mutedUntil', { mode: 'timestamp' }),
  },
  (table) => [unique().on(table.roomId, table.userId)]
);

// Room invitations table - tracks pending invitations to private rooms
export const roomInvitations = sqliteTable(
  'room_invitations',
  {
    id: text('id').primaryKey(),
    roomId: text('roomId')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    inviterId: text('inviterId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    inviteeId: text('inviteeId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [unique().on(table.roomId, table.inviteeId)]
);

// Uploaded images table - tracks images uploaded to chat
export const uploadedImages = sqliteTable('uploaded_images', {
  id: text('id').primaryKey(), // Same as storage key
  roomId: text('roomId')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  uploaderId: text('uploaderId')
    .notNull()
    .references(() => user.id, { onDelete: 'set null' }),
  originalName: text('originalName').notNull(),
  mimeType: text('mimeType').notNull(),
  sizeBytes: integer('sizeBytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  uploadedAt: integer('uploadedAt', { mode: 'timestamp' }).notNull(),
});

// Relations for Drizzle query API
export const roomsRelations = relations(rooms, ({ many, one }) => ({
  members: many(roomMembers),
  creator: one(user, { fields: [rooms.createdBy], references: [user.id] }),
  images: many(uploadedImages),
  invitations: many(roomInvitations),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, { fields: [roomMembers.roomId], references: [rooms.id] }),
  user: one(user, { fields: [roomMembers.userId], references: [user.id] }),
}));

export const uploadedImagesRelations = relations(uploadedImages, ({ one }) => ({
  room: one(rooms, { fields: [uploadedImages.roomId], references: [rooms.id] }),
  uploader: one(user, { fields: [uploadedImages.uploaderId], references: [user.id] }),
}));

export const roomInvitationsRelations = relations(roomInvitations, ({ one }) => ({
  room: one(rooms, { fields: [roomInvitations.roomId], references: [rooms.id] }),
  inviter: one(user, { fields: [roomInvitations.inviterId], references: [user.id] }),
  invitee: one(user, { fields: [roomInvitations.inviteeId], references: [user.id] }),
}));
