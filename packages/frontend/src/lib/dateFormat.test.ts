import { describe, it, expect } from 'vitest';
import { formatDateSeparator, getDateKey, isDifferentDay } from './dateFormat';

describe('formatDateSeparator', () => {
  it('returns "Today" for timestamps from today', () => {
    const now = new Date('2026-01-15T14:30:00');
    const todayMorning = new Date('2026-01-15T08:00:00').getTime();
    const todayEvening = new Date('2026-01-15T23:59:59').getTime();

    expect(formatDateSeparator(todayMorning, now)).toBe('Today');
    expect(formatDateSeparator(todayEvening, now)).toBe('Today');
  });

  it('returns "Yesterday" for timestamps from yesterday', () => {
    const now = new Date('2026-01-15T14:30:00');
    const yesterdayMorning = new Date('2026-01-14T08:00:00').getTime();
    const yesterdayEvening = new Date('2026-01-14T23:59:59').getTime();

    expect(formatDateSeparator(yesterdayMorning, now)).toBe('Yesterday');
    expect(formatDateSeparator(yesterdayEvening, now)).toBe('Yesterday');
  });

  it('returns full date for older timestamps', () => {
    const now = new Date('2026-01-15T14:30:00');
    const twoDaysAgo = new Date('2026-01-13T10:00:00').getTime();
    const lastWeek = new Date('2026-01-08T10:00:00').getTime();
    const lastYear = new Date('2025-12-25T10:00:00').getTime();

    expect(formatDateSeparator(twoDaysAgo, now)).toBe('January 13, 2026');
    expect(formatDateSeparator(lastWeek, now)).toBe('January 8, 2026');
    expect(formatDateSeparator(lastYear, now)).toBe('December 25, 2025');
  });

  it('handles midnight boundary correctly', () => {
    const now = new Date('2026-01-15T00:05:00'); // 5 minutes past midnight
    const justBeforeMidnight = new Date('2026-01-14T23:55:00').getTime();

    expect(formatDateSeparator(justBeforeMidnight, now)).toBe('Yesterday');
  });
});

describe('getDateKey', () => {
  it('returns YYYY-MM-DD format', () => {
    const timestamp = new Date('2026-01-15T14:30:00').getTime();
    expect(getDateKey(timestamp)).toBe('2026-01-15');
  });

  it('pads single digit months and days', () => {
    const timestamp = new Date('2026-03-05T14:30:00').getTime();
    expect(getDateKey(timestamp)).toBe('2026-03-05');
  });

  it('returns same key for different times on same day', () => {
    const morning = new Date('2026-01-15T08:00:00').getTime();
    const evening = new Date('2026-01-15T22:00:00').getTime();

    expect(getDateKey(morning)).toBe(getDateKey(evening));
  });
});

describe('isDifferentDay', () => {
  it('returns false for timestamps on the same day', () => {
    const morning = new Date('2026-01-15T08:00:00').getTime();
    const evening = new Date('2026-01-15T22:00:00').getTime();

    expect(isDifferentDay(morning, evening)).toBe(false);
  });

  it('returns true for timestamps on different days', () => {
    const yesterday = new Date('2026-01-14T23:59:59').getTime();
    const today = new Date('2026-01-15T00:00:01').getTime();

    expect(isDifferentDay(yesterday, today)).toBe(true);
  });

  it('handles cross-month boundaries', () => {
    const endOfJan = new Date('2026-01-31T23:00:00').getTime();
    const startOfFeb = new Date('2026-02-01T01:00:00').getTime();

    expect(isDifferentDay(endOfJan, startOfFeb)).toBe(true);
  });

  it('handles cross-year boundaries', () => {
    const endOfYear = new Date('2025-12-31T23:00:00').getTime();
    const startOfYear = new Date('2026-01-01T01:00:00').getTime();

    expect(isDifferentDay(endOfYear, startOfYear)).toBe(true);
  });
});
