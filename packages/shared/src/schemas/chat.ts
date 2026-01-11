import { z } from 'zod';

// Predefined rooms
export const ROOMS = {
  LANDING_ZONE: 'landing-zone',
} as const;

export type RoomId = (typeof ROOMS)[keyof typeof ROOMS];

// Room ID validation
export const roomIdSchema = z.string().min(1).max(100);

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

// Chat message metadata
export const chatMessageMetadataSchema = z.object({
  displayName: z.string(),
  userId: z.string(),
});
export type ChatMessageMetadata = z.infer<typeof chatMessageMetadataSchema>;

// Chat message schema (matches Ably Chat message structure)
export const chatMessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  clientId: z.string(),
  text: z.string().min(1).max(2000),
  timestamp: z.number(),
  metadata: chatMessageMetadataSchema.optional(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Room display names
export const ROOM_DISPLAY_NAMES: Record<RoomId, string> = {
  [ROOMS.LANDING_ZONE]: 'Landing Zone',
};

// Helper to check if a room ID is valid
export function isValidRoomId(roomId: string): roomId is RoomId {
  return Object.values(ROOMS).includes(roomId as RoomId);
}
