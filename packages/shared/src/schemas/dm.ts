import { z } from 'zod';

// DM list item returned from GET /api/dms
export const dmListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  ablyRoomId: z.string(),
  dmType: z.enum(['one_on_one', 'group']),
  participants: z.array(
    z.object({
      id: z.string(),
      displayName: z.string(),
      username: z.string().nullable(),
    })
  ),
  memberCount: z.number(),
});
export type DmListItem = z.infer<typeof dmListItemSchema>;

// Input for creating a DM
export const createDmInputSchema = z.object({
  participantIds: z.array(z.string()).min(1).max(4),
});
export type CreateDmInput = z.infer<typeof createDmInputSchema>;

// Input for adding member to group DM
export const addDmMemberInputSchema = z.object({
  userId: z.string(),
});
export type AddDmMemberInput = z.infer<typeof addDmMemberInputSchema>;

// Input for converting group DM to room
export const convertDmToRoomInputSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean(),
});
export type ConvertDmToRoomInput = z.infer<typeof convertDmToRoomInputSchema>;
