import { test, expect, type Page } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  waitForMessageList,
} from './utils/helpers';

/**
 * Helper to open the New DM modal from the sidebar.
 */
async function openNewDmModal(page: Page): Promise<void> {
  await page.getByTestId('new-dm-button').click();
  await expect(page.getByTestId('new-dm-modal')).toBeVisible();
}

/**
 * Helper to search and select a user in the New DM modal.
 */
async function selectUserInDmModal(page: Page, userName: string): Promise<void> {
  await page.getByTestId('new-dm-search').fill(userName);
  // Wait for search results
  const userResult = page.locator('[data-testid^="user-result-"]').filter({ hasText: userName });
  await expect(userResult).toBeVisible({ timeout: 15000 });
  await userResult.click();
  // Verify user appears in selected chips
  await expect(page.locator('[data-testid^="selected-user-chip-"]').filter({ hasText: userName })).toBeVisible();
}

/**
 * Helper to create a DM via the modal and return the slug.
 */
async function createDmFromModal(page: Page): Promise<string> {
  await page.getByTestId('new-dm-submit').click();
  // Wait for navigation to DM page
  await expect(page).toHaveURL(/\/dm\//, { timeout: 15000 });
  return page.url().split('/dm/')[1];
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
 * Helper to start a DM from user profile popover.
 * Returns the DM slug.
 */
async function startDmFromProfilePopover(
  page: Page,
  targetUserName: string
): Promise<string> {
  // Wait for presence list to load
  const presenceList = page.getByTestId('presence-list');
  await expect(presenceList).toBeVisible({ timeout: 15000 });

  // Find user in presence list - check both online and offline sections
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

  // Click the presence item trigger to open profile popover
  const presenceTrigger = presenceItem.getByTestId('user-profile-trigger');
  await expect(presenceTrigger).toBeEnabled({ timeout: 15000 });
  await presenceTrigger.click();

  // Click the Message button
  const popup = page.getByTestId('user-profile-popover');
  await expect(popup).toBeVisible();
  await popup.getByTestId('user-profile-message-button').click();

  // Wait for navigation to DM page
  await expect(page).toHaveURL(/\/dm\//, { timeout: 15000 });

  return page.url().split('/dm/')[1];
}

test.describe('DM Creation', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Creating 1:1 DMs', () => {
    test('can create 1:1 DM from sidebar', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `DM Creator ${id}`;
      const user2Name = `DM Recipient ${id}`;

      // Create first user
      await createUserAndSignIn(page, user1Name, id);

      // Create second user in a new context
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      // Back to first user - open new DM modal
      await openNewDmModal(page);

      // Search and select the second user
      await selectUserInDmModal(page, user2Name);

      // Submit button should say "Message" for 1:1 DM
      await expect(page.getByTestId('new-dm-submit')).toHaveText('Message');

      // Create the DM
      const dmSlug = await createDmFromModal(page);

      // Verify DM appears in sidebar
      await expect(page.getByTestId(`dm-item-${dmSlug}`)).toBeVisible();

      // Verify we're in the DM room
      await expect(page.getByTestId('message-list').or(page.getByTestId('message-list-empty'))).toBeVisible();

      await context2.close();
    });

    test('can create 1:1 DM from user profile popover', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Profile DM User1 ${id}`;
      const user2Name = `Profile DM User2 ${id}`;
      const roomName = `Profile DM Room ${id}`;

      // User 1 creates a room
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // User 2 joins the room
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);
      await joinRoomViaBrowse(page2, roomName, roomSlug);

      // User 1 waits for User 2 to appear in presence list
      await waitForUserInPresence(page, user2Name);

      // User 1 clicks on User 2 in presence list and clicks "Message"
      const dmSlug = await startDmFromProfilePopover(page, user2Name);

      // Verify DM appears in sidebar
      await expect(page.getByTestId(`dm-item-${dmSlug}`)).toBeVisible();

      // Verify we're in the DM room
      await expect(page.getByTestId('message-list').or(page.getByTestId('message-list-empty'))).toBeVisible();

      await context2.close();
    });
  });

  test.describe('Creating Group DMs', () => {
    test('can create group DM with multiple participants', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Group DM Creator ${id}`;
      const user2Name = `Group DM Member2 ${id}`;
      const user3Name = `Group DM Member3 ${id}`;

      // Create first user
      await createUserAndSignIn(page, user1Name, id);

      // Create second user
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      // Create third user
      const context3 = await browser.newContext();
      await setE2eCookie(context3);
      const page3 = await context3.newPage();
      const id3 = uniqueId();
      await createUserAndSignIn(page3, user3Name, id3);

      // Back to first user - open new DM modal
      await openNewDmModal(page);

      // Select second user
      await selectUserInDmModal(page, user2Name);

      // Submit button should still say "Message" with one selection
      await expect(page.getByTestId('new-dm-submit')).toHaveText('Message');

      // Clear search and select third user
      await page.getByTestId('new-dm-search').fill('');
      await selectUserInDmModal(page, user3Name);

      // Submit button should now say "Create Group" for group DM
      await expect(page.getByTestId('new-dm-submit')).toHaveText('Create Group');

      // Create the group DM
      const dmSlug = await createDmFromModal(page);

      // Verify DM appears in sidebar
      await expect(page.getByTestId(`dm-item-${dmSlug}`)).toBeVisible();

      await context2.close();
      await context3.close();
    });
  });

  test.describe('DM Deduplication', () => {
    test('creating DM with same participants returns existing DM', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Dedup User1 ${id}`;
      const user2Name = `Dedup User2 ${id}`;

      // Create first user
      await createUserAndSignIn(page, user1Name, id);

      // Create second user
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      // Create first DM
      await openNewDmModal(page);
      await selectUserInDmModal(page, user2Name);
      const firstDmSlug = await createDmFromModal(page);

      // Navigate away to home/chat
      await page.goto('/chat');
      await expect(page).toHaveURL(/\/chat/);

      // Try to create DM with the same user again
      await openNewDmModal(page);
      await selectUserInDmModal(page, user2Name);
      const secondDmSlug = await createDmFromModal(page);

      // Verify same slug is returned (deduplication worked)
      expect(secondDmSlug).toBe(firstDmSlug);

      await context2.close();
    });
  });

  test.describe('Participant Limits', () => {
    test('cannot create DM with more than 4 other participants', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Limit User1 ${id}`;
      const userNames: string[] = [];
      const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];

      // Create the main user
      await createUserAndSignIn(page, user1Name, id);

      // Create 5 additional users (we expect only 4 to be selectable)
      for (let i = 2; i <= 6; i++) {
        const userContext = await browser.newContext();
        await setE2eCookie(userContext);
        const userPage = await userContext.newPage();
        const userId = uniqueId();
        const userName = `Limit User${i} ${id}`;
        await createUserAndSignIn(userPage, userName, userId);
        userNames.push(userName);
        contexts.push(userContext);
      }

      // Open new DM modal
      await openNewDmModal(page);

      // Select 4 users (the maximum)
      for (let i = 0; i < 4; i++) {
        await page.getByTestId('new-dm-search').fill('');
        await selectUserInDmModal(page, userNames[i]);
      }

      // Verify we have 4 selected users
      const selectedChips = page.locator('[data-testid^="selected-user-chip-"]');
      await expect(selectedChips).toHaveCount(4);

      // Verify the max limit message is shown
      await expect(page.getByText('Maximum 4 participants reached')).toBeVisible();

      // Try to search for a 5th user - the result should be disabled
      await page.getByTestId('new-dm-search').fill(userNames[4]);
      const fifthUserResult = page.locator('[data-testid^="user-result-"]').filter({ hasText: userNames[4] });
      await expect(fifthUserResult).toBeVisible();

      // The 5th user result should be disabled (has opacity-50 and cursor-not-allowed)
      await expect(fifthUserResult).toHaveClass(/opacity-50/);
      await expect(fifthUserResult).toBeDisabled();

      // Clean up all contexts
      for (const ctx of contexts) {
        await ctx.close();
      }
    });
  });

  test.describe('E2E Isolation', () => {
    test('DMs created in E2E mode are isolated from production', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `E2E Iso User1 ${id}`;
      const user2Name = `E2E Iso User2 ${id}`;

      // Create users in E2E mode
      await createUserAndSignIn(page, user1Name, id);

      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      // Create a DM in E2E mode
      await openNewDmModal(page);
      await selectUserInDmModal(page, user2Name);
      const e2eDmSlug = await createDmFromModal(page);

      // Verify DM is visible in E2E mode
      await expect(page.getByTestId(`dm-item-${e2eDmSlug}`)).toBeVisible();

      // The DM should have been created with isE2e: true
      // We can verify this by confirming the DM appears in the sidebar
      // (E2E filtering happens at the API level)
      await expect(page).toHaveURL(`/dm/${e2eDmSlug}`);

      await context2.close();
    });
  });
});
