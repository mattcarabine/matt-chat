import { expect, Page, BrowserContext } from '@playwright/test';

/**
 * Generate unique identifiers for each test run.
 * Combines timestamp and random string to ensure uniqueness across parallel test runs.
 */
export function uniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Set up the e2e_mode cookie so the backend includes test users in API responses.
 * This distinguishes test users from real users and enables test-specific behavior.
 */
export async function setE2eCookie(context: BrowserContext): Promise<void> {
  await context.addCookies([
    {
      name: 'e2e_mode',
      value: 'true',
      domain: 'localhost',
      path: '/',
    },
  ]);
}

/**
 * Create a new user account and verify successful navigation to chat.
 * Uses the e2e-test.local email domain to mark as test user.
 * Note: E2E users don't see Landing Zone, so they land on /chat without a room slug.
 */
export async function createUserAndSignIn(
  page: Page,
  fullName: string,
  id: string
): Promise<void> {
  await page.goto('/signup');
  await page.getByTestId('signup-fullname').fill(fullName);
  await page.getByTestId('signup-username').fill(`user${id}`);
  await page.getByTestId('signup-email').fill(`user${id}@e2e-test.local`);
  await page.getByTestId('signup-password').fill('password123');
  await page.getByTestId('signup-submit').click();
  // E2E users don't see any rooms initially (Landing Zone is filtered out)
  await expect(page).toHaveURL(/\/chat/);
}

/**
 * Sign out the current user via the user dropdown menu.
 */
export async function signOut(page: Page): Promise<void> {
  await page.getByTestId('user-menu-button').click();
  await page.getByTestId('signout-button').click();
}

/**
 * Convert a room name to its expected slug format.
 * Matches backend slugification: lowercase, spaces to hyphens, remove non-alphanumeric.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Create a new chat room with the given name.
 * Optionally creates a private room if isPrivate is true.
 * Returns the room slug after creation.
 */
export async function createRoom(
  page: Page,
  roomName: string,
  isPrivate = false
): Promise<string> {
  const expectedSlugPrefix = slugify(roomName);

  // Click the Create button (in sidebar or No Rooms Yet screen)
  await page.click('button:has-text("Create")');

  // Wait for modal to appear and fill the form using data-testid
  await page.getByTestId('create-room-name').fill(roomName);
  if (isPrivate) {
    await page.getByTestId('create-room-private').check();
  }
  await page.getByTestId('create-room-submit').click();

  // Wait specifically for the new room URL, not just any /chat/ URL
  await page.waitForURL(new RegExp(`/chat/${expectedSlugPrefix}`));

  // Extract and return the room slug
  const url = page.url();
  return url.split('/chat/')[1];
}

/**
 * Send a text message in the current chat room.
 * Waits for the message to appear in the message list.
 */
export async function sendMessage(page: Page, text: string): Promise<void> {
  const input = page.getByTestId('message-input');
  const sendButton = page.getByTestId('message-send-button');

  // Click to focus, then type the message (triggering React's onChange)
  await input.click();
  await input.pressSequentially(text, { delay: 10 });
  await expect(sendButton).toBeEnabled({ timeout: 10000 });
  await sendButton.click();

  // Wait for the message to appear in the list (allow time for Ably to deliver)
  await expect(page.getByTestId('message-text').filter({ hasText: text })).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Wait for the message list to be ready (loaded and not showing loading state).
 */
export async function waitForMessageList(page: Page): Promise<void> {
  // Wait for either the message list or the empty state
  await expect(
    page.getByTestId('message-list').or(page.getByTestId('message-list-empty'))
  ).toBeVisible();
}
