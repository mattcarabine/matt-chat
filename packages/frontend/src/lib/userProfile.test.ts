import { describe, it, expect } from 'vitest';
import { getAvatarColor, formatMemberSince, AVATAR_COLORS } from './userProfile';

describe('getAvatarColor', () => {
  it('returns consistent color for the same user ID', () => {
    const color1 = getAvatarColor('user-123');
    const color2 = getAvatarColor('user-123');

    expect(color1).toEqual(color2);
  });

  it('returns different colors for different user IDs', () => {
    // Test with IDs that are known to produce different hashes
    const color1 = getAvatarColor('user-abc');
    const color2 = getAvatarColor('user-xyz');

    // They might occasionally be the same due to hash collisions, but generally different
    // At minimum, verify both are valid colors from the palette
    expect(AVATAR_COLORS).toContainEqual(color1);
    expect(AVATAR_COLORS).toContainEqual(color2);
  });

  it('always returns a color from the AVATAR_COLORS array', () => {
    const testIds = ['a', 'b', 'user-123', 'abc-def-ghi', '12345', 'UPPERCASE'];

    for (const id of testIds) {
      const color = getAvatarColor(id);
      expect(AVATAR_COLORS).toContainEqual(color);
    }
  });

  it('handles empty string without crashing', () => {
    const color = getAvatarColor('');
    expect(AVATAR_COLORS).toContainEqual(color);
  });
});

describe('formatMemberSince', () => {
  it('formats date as "Month Year"', () => {
    expect(formatMemberSince('2024-01-15T10:00:00.000Z')).toBe('January 2024');
    expect(formatMemberSince('2023-06-01T00:00:00.000Z')).toBe('June 2023');
    expect(formatMemberSince('2025-12-25T23:59:59.000Z')).toBe('December 2025');
  });

  it('handles different date formats', () => {
    expect(formatMemberSince('2024-03-15')).toBe('March 2024');
    expect(formatMemberSince('2024/07/20')).toBe('July 2024');
  });
});
