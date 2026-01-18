import { test, expect, type Page, type BrowserContext, type Browser } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  sendMessage,
  waitForMessageList,
} from './utils/helpers';

/**
 * Helper to wait for DM message list to be ready.
 */
async function waitForDmMessageList(page: Page): Promise<void> {
  await expect(
    page.getByTestId('message-list').or(page.getByTestId('message-list-empty'))
  ).toBeVisible({ timeout: 15000 });
}

/**
 * Helper to create a group DM via the new DM modal.
 * Returns the DM slug.
 */
async function createGroupDm(
  page: Page,
  userNames: string[]
): Promise<string> {
  // Open new DM modal
  await page.getByTestId('new-dm-button').click();
  await expect(page.getByTestId('new-dm-modal')).toBeVisible();

  // Search and select each user
  for (const userName of userNames) {
    await page.getByTestId('new-dm-search').fill(userName);
    // Wait for search results
    await page.waitForTimeout(500); // Allow search debounce
    const userResult = page.locator('[data-testid^="user-result-"]').filter({ hasText: userName });
    await expect(userResult).toBeVisible({ timeout: 10000 });
    await userResult.click();
  }

  // Submit
  await page.getByTestId('new-dm-submit').click();

  // Wait for navigation to DM page
  await expect(page).toHaveURL(/\/dm\//, { timeout: 15000 });
  await waitForDmMessageList(page);

  return page.url().split('/dm/')[1];
}

/**
 * Helper to start a DM from a user in the presence list.
 */
async function startDmFromPresence(page: Page, targetUserName: string): Promise<string> {
  const presenceList = page.getByTestId('presence-list');
  await expect(presenceList).toBeVisible({ timeout: 15000 });

  const onlinePresenceItem = page
    .getByTestId('presence-online-section')
    .getByTestId('presence-item')
    .filter({ hasText: targetUserName });

  const offlinePresenceItem = page
    .getByTestId('presence-offline-section')
    .getByTestId('presence-item')
    .filter({ hasText: targetUserName });

  await expect(onlinePresenceItem.or(offlinePresenceItem)).toBeVisible({ timeout: 15000 });

  const isOnline = await onlinePresenceItem.isVisible().catch(() => false);
  const presenceItem = isOnline ? onlinePresenceItem : offlinePresenceItem;

  const presenceTrigger = presenceItem.getByTestId('user-profile-trigger');
  await expect(presenceTrigger).toBeEnabled({ timeout: 15000 });
  await presenceTrigger.click();

  const popup = page.getByTestId('user-profile-popover');
  await expect(popup).toBeVisible();
  await popup.getByTestId('user-profile-message-button').click();

  await expect(page).toHaveURL(/\/dm\//, { timeout: 15000 });
  await waitForDmMessageList(page);

  return page.url().split('/dm/')[1];
}

/**
 * Helper to navigate to an existing DM by slug.
 */
async function navigateToDm(page: Page, dmSlug: string): Promise<void> {
  await page.goto(`/dm/${dmSlug}`);
  await waitForDmMessageList(page);
}

/**
 * Helper to have a user join a room via browse modal.
 */
async function joinRoomViaBrowse(
  page: Page,
  roomName: string,
  roomSlug: string
): Promise<void> {
  await page.click('button:has-text("Browse")');
  await expect(page.getByTestId('browse-rooms-modal')).toBeVisible();
  await page.getByTestId('browse-rooms-search').fill(roomName);
  const joinButton = page.getByTestId(`browse-room-${roomSlug}-join`);
  await expect(joinButton).toBeVisible({ timeout: 10000 });
  await joinButton.click();
  await expect(page).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
  await waitForMessageList(page);
}

/**
 * Helper to wait for a user to appear in presence list (either online or offline).
 */
async function waitForUserInPresence(page: Page, userName: string): Promise<void> {
  const presenceList = page.getByTestId('presence-list');
  await expect(presenceList).toBeVisible({ timeout: 15000 });

  const onlineItem = page
    .getByTestId('presence-online-section')
    .getByTestId('presence-item')
    .filter({ hasText: userName });
  const offlineItem = page
    .getByTestId('presence-offline-section')
    .getByTestId('presence-item')
    .filter({ hasText: userName });

  await expect(onlineItem.or(offlineItem)).toBeVisible({ timeout: 15000 });
}

interface UserContext {
  page: Page;
  context: BrowserContext;
  name: string;
  id: string;
}

/**
 * Helper to create multiple users and have them join a common room.
 */
async function createUsersInRoom(
  browser: Browser,
  mainContext: BrowserContext,
  count: number,
  roomName: string,
  roomSlug: string,
  baseId: string
): Promise<UserContext[]> {
  const users: UserContext[] = [];

  for (let i = 0; i < count; i++) {
    const ctx = await browser.newContext();
    await setE2eCookie(ctx);
    const pg = await ctx.newPage();
    const userId = `${baseId}_${i}`;
    const userName = `Member ${i + 1} ${baseId}`;

    await createUserAndSignIn(pg, userName, userId);
    await joinRoomViaBrowse(pg, roomName, roomSlug);

    users.push({ page: pg, context: ctx, name: userName, id: userId });
  }

  return users;
}

test.describe('Group DM Members', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test('can add member to group DM', async ({ page, browser }) => {
    const id = uniqueId();
    const user1Name = `DM Owner ${id}`;
    const user2Name = `DM Member2 ${id}`;
    const user3Name = `DM Member3 ${id}`;
    const user4Name = `DM Member4 ${id}`;
    const roomName = `Add Member Test ${id}`;

    // Create user1 and a room (so other users can find each other)
    await createUserAndSignIn(page, user1Name, `${id}_1`);
    const roomSlug = await createRoom(page, roomName);
    await waitForMessageList(page);

    // Create other users and have them join room
    const context2 = await browser.newContext();
    await setE2eCookie(context2);
    const page2 = await context2.newPage();
    await createUserAndSignIn(page2, user2Name, `${id}_2`);
    await joinRoomViaBrowse(page2, roomName, roomSlug);

    const context3 = await browser.newContext();
    await setE2eCookie(context3);
    const page3 = await context3.newPage();
    await createUserAndSignIn(page3, user3Name, `${id}_3`);
    await joinRoomViaBrowse(page3, roomName, roomSlug);

    const context4 = await browser.newContext();
    await setE2eCookie(context4);
    const page4 = await context4.newPage();
    await createUserAndSignIn(page4, user4Name, `${id}_4`);
    await joinRoomViaBrowse(page4, roomName, roomSlug);

    // User1 creates a group DM with user2 and user3 (3 members total)
    await page.goto('/chat');
    await page.getByTestId('new-dm-button').click();
    await expect(page.getByTestId('new-dm-modal')).toBeVisible();

    // Select user2
    await page.getByTestId('new-dm-search').fill(user2Name);
    await page.waitForTimeout(500);
    await page.locator('[data-testid^="user-result-"]').filter({ hasText: user2Name }).click();

    // Select user3
    await page.getByTestId('new-dm-search').fill(user3Name);
    await page.waitForTimeout(500);
    await page.locator('[data-testid^="user-result-"]').filter({ hasText: user3Name }).click();

    // Submit to create group DM
    await page.getByTestId('new-dm-submit').click();
    await expect(page).toHaveURL(/\/dm\//, { timeout: 15000 });
    await waitForDmMessageList(page);

    // Verify we're in the group DM (3 members shown in header)
    await expect(page.locator('span:has-text("3 members")')).toBeVisible({ timeout: 10000 });

    // Open dropdown menu
    await page.getByTestId('dm-menu-button').click();

    // Click "Add Member"
    await page.getByTestId('add-dm-member-button').click();
    await expect(page.getByTestId('add-dm-member-modal')).toBeVisible();

    // Search for user4
    await page.getByTestId('add-dm-member-search').fill(user4Name);
    await page.waitForTimeout(500);

    // Click add button for user4
    const addButton = page.locator('button[data-testid^="add-dm-member-"]').filter({ hasText: 'Add' });
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for "Added" state
    await expect(page.getByText('Added')).toBeVisible({ timeout: 10000 });

    // Close the modal
    await page.getByTestId('add-dm-member-done').click();

    // Wait a moment and refresh the page to ensure updated data loads
    await page.waitForTimeout(1000);

    // Get current DM slug from URL
    const currentUrl = page.url();
    const dmSlugMatch = currentUrl.match(/\/dm\/([^/]+)/);

    if (dmSlugMatch) {
      // Navigate to DM page again to trigger fresh data fetch
      await page.goto(`/dm/${dmSlugMatch[1]}`);
      await waitForDmMessageList(page);
    }

    // Verify member count increased to 4
    // The header member count should show 4 after adding a member
    await expect(page.locator('span:has-text("4 members")')).toBeVisible({ timeout: 15000 });

    // Clean up
    await context2.close();
    await context3.close();
    await context4.close();
  });

  test('added member sees existing message history', async ({ browser }) => {
    const context1 = await browser.newContext();
    await setE2eCookie(context1);
    const page = await context1.newPage();

    const id = uniqueId();
    const user1Name = `History Owner ${id}`;
    const user2Name = `History Member2 ${id}`;
    const user3Name = `History Member3 ${id}`;
    const user4Name = `History Joiner ${id}`;
    const roomName = `History Test Room ${id}`;

    // Create user1 and a room
    await createUserAndSignIn(page, user1Name, `${id}_1`);
    const roomSlug = await createRoom(page, roomName);
    await waitForMessageList(page);

    // Create other users
    const context2 = await browser.newContext();
    await setE2eCookie(context2);
    const page2 = await context2.newPage();
    await createUserAndSignIn(page2, user2Name, `${id}_2`);
    await joinRoomViaBrowse(page2, roomName, roomSlug);

    const context3 = await browser.newContext();
    await setE2eCookie(context3);
    const page3 = await context3.newPage();
    await createUserAndSignIn(page3, user3Name, `${id}_3`);
    await joinRoomViaBrowse(page3, roomName, roomSlug);

    const context4 = await browser.newContext();
    await setE2eCookie(context4);
    const page4 = await context4.newPage();
    await createUserAndSignIn(page4, user4Name, `${id}_4`);
    await joinRoomViaBrowse(page4, roomName, roomSlug);

    // User1 creates a group DM with user2 and user3
    await page.goto('/chat');
    await page.getByTestId('new-dm-button').click();
    await expect(page.getByTestId('new-dm-modal')).toBeVisible();

    await page.getByTestId('new-dm-search').fill(user2Name);
    await page.waitForTimeout(500);
    await page.locator('[data-testid^="user-result-"]').filter({ hasText: user2Name }).click();

    await page.getByTestId('new-dm-search').fill(user3Name);
    await page.waitForTimeout(500);
    await page.locator('[data-testid^="user-result-"]').filter({ hasText: user3Name }).click();

    await page.getByTestId('new-dm-submit').click();
    await expect(page).toHaveURL(/\/dm\//, { timeout: 15000 });
    await waitForDmMessageList(page);

    const groupDmSlug = page.url().split('/dm/')[1];

    // Send some messages
    const message1 = `First message ${id}`;
    const message2 = `Second message ${id}`;
    await sendMessage(page, message1);
    await sendMessage(page, message2);

    // Verify messages are visible
    await expect(page.getByTestId('message-text').filter({ hasText: message1 })).toBeVisible();
    await expect(page.getByTestId('message-text').filter({ hasText: message2 })).toBeVisible();

    // Now add user4 to the group DM
    await page.getByTestId('dm-menu-button').click();
    await page.getByTestId('add-dm-member-button').click();
    await expect(page.getByTestId('add-dm-member-modal')).toBeVisible();

    await page.getByTestId('add-dm-member-search').fill(user4Name);
    await page.waitForTimeout(500);
    // Use button tag to avoid matching the modal
    const addButton = page.locator('button[data-testid^="add-dm-member-"]').filter({ hasText: 'Add' });
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();
    await expect(page.getByText('Added')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('add-dm-member-done').click();

    // User4 navigates to the DM
    await navigateToDm(page4, groupDmSlug);

    // Verify user4 sees the existing messages
    await expect(page4.getByTestId('message-text').filter({ hasText: message1 })).toBeVisible({ timeout: 15000 });
    await expect(page4.getByTestId('message-text').filter({ hasText: message2 })).toBeVisible();

    // Clean up
    await context1.close();
    await context2.close();
    await context3.close();
    await context4.close();
  });

  test('cannot add member when group has 5 members', async ({ browser }) => {
    const context1 = await browser.newContext();
    await setE2eCookie(context1);
    const page = await context1.newPage();

    const id = uniqueId();
    const user1Name = `Max Owner ${id}`;
    const user2Name = `Max Member2 ${id}`;
    const user3Name = `Max Member3 ${id}`;
    const user4Name = `Max Member4 ${id}`;
    const user5Name = `Max Member5 ${id}`;
    const user6Name = `Max Blocked ${id}`;
    const roomName = `Max Members Test ${id}`;

    // Create user1 and a room
    await createUserAndSignIn(page, user1Name, `${id}_1`);
    const roomSlug = await createRoom(page, roomName);
    await waitForMessageList(page);

    // Create all other users and have them join the room
    const contexts: BrowserContext[] = [];
    for (let i = 2; i <= 6; i++) {
      const ctx = await browser.newContext();
      await setE2eCookie(ctx);
      const pg = await ctx.newPage();
      const userName = i <= 5 ? `Max Member${i} ${id}` : `Max Blocked ${id}`;
      await createUserAndSignIn(pg, userName, `${id}_${i}`);
      await joinRoomViaBrowse(pg, roomName, roomSlug);
      contexts.push(ctx);
    }

    // User1 creates a group DM with 4 other users (total 5 members - the max)
    await page.goto('/chat');
    await page.getByTestId('new-dm-button').click();
    await expect(page.getByTestId('new-dm-modal')).toBeVisible();

    // Add 4 users to reach 5 total (including self)
    const usersToAdd = [user2Name, user3Name, user4Name, user5Name];
    for (const userName of usersToAdd) {
      await page.getByTestId('new-dm-search').fill(userName);
      await page.waitForTimeout(500);
      const userResult = page.locator('[data-testid^="user-result-"]').filter({ hasText: userName });
      await expect(userResult).toBeVisible({ timeout: 10000 });
      await userResult.click();
      await page.getByTestId('new-dm-search').clear();
    }

    await page.getByTestId('new-dm-submit').click();
    await expect(page).toHaveURL(/\/dm\//, { timeout: 15000 });
    await waitForDmMessageList(page);

    // Verify member count shows 5 members
    // Check header member count (use span selector to match DM header)
    await expect(page.locator('span:has-text("5 members")')).toBeVisible();

    // Try to add user6
    await page.getByTestId('dm-menu-button').click();
    await page.getByTestId('add-dm-member-button').click();
    await expect(page.getByTestId('add-dm-member-modal')).toBeVisible();

    await page.getByTestId('add-dm-member-search').fill(user6Name);
    await page.waitForTimeout(500);
    // Use button tag to avoid matching the modal
    const addButton = page.locator('button[data-testid^="add-dm-member-"]').filter({ hasText: 'Add' });
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Should see an error message
    await expect(page.getByText(/cannot exceed 5 members/i)).toBeVisible({ timeout: 10000 });

    // Member count should still be 5
    await page.getByTestId('add-dm-member-done').click();
    // Check header member count (use span selector to match DM header)
    await expect(page.locator('span:has-text("5 members")')).toBeVisible();

    // Clean up
    await context1.close();
    for (const ctx of contexts) {
      await ctx.close();
    }
  });
});
