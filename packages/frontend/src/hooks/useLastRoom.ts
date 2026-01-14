const LAST_ROOM_KEY = 'lastRoom';

export function getLastRoom(): string | null {
  try {
    return localStorage.getItem(LAST_ROOM_KEY);
  } catch {
    return null;
  }
}

export function setLastRoom(slug: string): void {
  try {
    localStorage.setItem(LAST_ROOM_KEY, slug);
  } catch {
    // Storage may be unavailable in private browsing mode
  }
}

export function clearLastRoom(): void {
  try {
    localStorage.removeItem(LAST_ROOM_KEY);
  } catch {
    // Storage may be unavailable in private browsing mode
  }
}
