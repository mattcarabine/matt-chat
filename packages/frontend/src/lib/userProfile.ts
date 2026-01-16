/**
 * Avatar colors derived deterministically from user ID.
 * Uses ember and sand palette colors for brand consistency.
 */
export const AVATAR_COLORS = [
  { bg: 'bg-ember-500', text: 'text-white' },
  { bg: 'bg-ember-600', text: 'text-white' },
  { bg: 'bg-ember-700', text: 'text-white' },
  { bg: 'bg-sand-600', text: 'text-white' },
  { bg: 'bg-sand-700', text: 'text-white' },
  { bg: 'bg-sand-800', text: 'text-sand-100' },
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

/**
 * Gets a consistent avatar color based on user ID.
 * Uses a simple hash to ensure the same user always gets the same color.
 */
export function getAvatarColor(userId: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Formats a date string as "Month Year" (e.g., "January 2024").
 */
export function formatMemberSince(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
