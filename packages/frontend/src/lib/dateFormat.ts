/**
 * Formats a timestamp for date separator display.
 * Returns "Today", "Yesterday", or a full date like "January 14, 2026"
 */
export function formatDateSeparator(timestamp: number, now: Date = new Date()): string {
  const date = new Date(timestamp);

  // Normalize both dates to midnight for comparison
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = today.getTime() - dateDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Gets the calendar day key for a timestamp (YYYY-MM-DD format).
 * Used to group messages by day.
 */
export function getDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Checks if two timestamps are on different calendar days.
 */
export function isDifferentDay(timestamp1: number, timestamp2: number): boolean {
  return getDateKey(timestamp1) !== getDateKey(timestamp2);
}
