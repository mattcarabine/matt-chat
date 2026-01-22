import { z } from 'zod';

// Default room slug constant
export const DEFAULT_ROOM_SLUG = 'landing-zone';

// Room slug validation (URL-friendly identifier)
export const roomSlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens');

// Room creation input schema
export const createRoomInputSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional().default(true),
});
export type CreateRoomInput = z.infer<typeof createRoomInputSchema>;

// Room response schema
export const roomSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  isPublic: z.boolean(),
  memberCount: z.number(),
  isMember: z.boolean().optional(),
  isCreator: z.boolean().optional(),
  createdAt: z.string(),
});
export type Room = z.infer<typeof roomSchema>;

// Room list item (for user's joined rooms)
export const roomListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  isPublic: z.boolean(),
  memberCount: z.number(),
  joinedAt: z.string(),
});
export type RoomListItem = z.infer<typeof roomListItemSchema>;

// Room search result
export const roomSearchResultSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  memberCount: z.number(),
  isMember: z.boolean(),
});
export type RoomSearchResult = z.infer<typeof roomSearchResultSchema>;

// Room invitation schema (for API responses)
export const roomInvitationSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  roomName: z.string(),
  roomSlug: z.string(),
  inviterId: z.string(),
  inviterName: z.string(),
  createdAt: z.string(),
});
export type RoomInvitation = z.infer<typeof roomInvitationSchema>;

// User search result schema
export const userSearchResultSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string().nullable(),
});
export type UserSearchResult = z.infer<typeof userSearchResultSchema>;

// Display name preference
export const displayNamePreferenceSchema = z.enum(['fullName', 'username']);
export type DisplayNamePreference = z.infer<typeof displayNamePreferenceSchema>;

// User preferences schema
export const userPreferencesSchema = z.object({
  displayNamePreference: displayNamePreferenceSchema,
});
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// Presence data schema (sent with presence enter/update)
export const presenceDataSchema = z.object({
  displayName: z.string(),
  userId: z.string(),
  displayNamePreference: displayNamePreferenceSchema,
});
export type PresenceData = z.infer<typeof presenceDataSchema>;

// Image attachment in a message
export const messageImageSchema = z.object({
  key: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type MessageImage = z.infer<typeof messageImageSchema>;

// Chat message metadata
export const chatMessageMetadataSchema = z.object({
  displayName: z.string(),
  userId: z.string(),
  images: z.array(messageImageSchema).optional(),
});
export type ChatMessageMetadata = z.infer<typeof chatMessageMetadataSchema>;

// Chat message schema (matches Ably Chat message structure)
// Text is optional when images are present
export const chatMessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  clientId: z.string(),
  text: z.string().max(2000).optional(),
  timestamp: z.number(),
  metadata: chatMessageMetadataSchema.optional(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// ========================================
// DEPRECATED - Use dynamic room lookup instead
// ========================================

/** @deprecated Use dynamic room lookup via /api/rooms instead */
export const ROOMS = {
  LANDING_ZONE: 'landing-zone',
} as const;

/** @deprecated Use dynamic room lookup via /api/rooms instead */
export type RoomId = (typeof ROOMS)[keyof typeof ROOMS];

/** @deprecated Use roomSlugSchema instead */
export const roomIdSchema = z.string().min(1).max(100);

/** @deprecated Use dynamic room lookup via /api/rooms/:slug instead */
export const ROOM_DISPLAY_NAMES: Record<RoomId, string> = {
  [ROOMS.LANDING_ZONE]: 'Landing Zone',
};

/** @deprecated Room validation now happens via API calls */
export function isValidRoomId(roomId: string): roomId is RoomId {
  return Object.values(ROOMS).includes(roomId as RoomId);
}

// ========================================
// User Profile Schemas
// ========================================

// User profile schema for GET /api/users/:id/profile response
export const userProfileSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  username: z.string(),
  bio: z.string().nullable(),
  createdAt: z.string(), // ISO date string
  sharedRoomsCount: z.number(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Input schema for PUT /api/users/me/bio
export const updateBioInputSchema = z.object({
  bio: z.string().max(160).nullable(),
});

export type UpdateBioInput = z.infer<typeof updateBioInputSchema>;
