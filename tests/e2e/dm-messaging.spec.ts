import { test, expect, type Page } from '@playwright/test';
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
 * Helper to create a DM via the user profile popover's "Message" button.
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

test.describe('DM Messaging', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Send and Receive Messages', () => {
    test('can send and receive messages in real-time in 1:1 DM', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `DM Sender ${id}`;
      const user2Name = `DM Receiver ${id}`;
      const roomName = `DM Test Room ${id}`;

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

      // Wait for User 2 in presence and start DM
      await waitForUserInPresence(page, user2Name);
      const dmSlug = await startDmFromProfilePopover(page, user2Name);

      // User 2 opens the DM BEFORE User 1 sends a message (both users subscribed)
      await navigateToDm(page2, dmSlug);

      // Now User 1 sends a message (both users are subscribed)
      const message1 = `Hello from User 1 ${id}`;
      await sendMessage(page, message1);

      // Verify message appears for User 1
      const message1Item = page.getByTestId('message-item').filter({ hasText: message1 });
      await expect(message1Item).toBeVisible();
      await expect(message1Item.getByTestId('message-sender')).toHaveText(user1Name);

      // User 2 should receive the message in real-time
      const message1InPage2 = page2.getByTestId('message-item').filter({ hasText: message1 });
      await expect(message1InPage2).toBeVisible({ timeout: 15000 });
      await expect(message1InPage2.getByTestId('message-sender')).toHaveText(user1Name);

      // User 2 sends a reply
      const message2 = `Reply from User 2 ${id}`;
      await sendMessage(page2, message2);

      // User 2 sees their own message
      const message2InPage2 = page2.getByTestId('message-item').filter({ hasText: message2 });
      await expect(message2InPage2).toBeVisible();

      // User 1 receives the reply in real-time
      const message2InPage1 = page.getByTestId('message-item').filter({ hasText: message2 });
      await expect(message2InPage1).toBeVisible({ timeout: 15000 });
      await expect(message2InPage1.getByTestId('message-sender')).toHaveText(user2Name);

      await context2.close();
    });
  });

  test.describe('Online Indicator', () => {
    test('1:1 DM shows online indicator when both users have DM open', async ({
      page,
      browser,
    }) => {
      const id = uniqueId();
      const user1Name = `Online Test User1 ${id}`;
      const user2Name = `Online Test User2 ${id}`;
      const roomName = `Online Test Room ${id}`;

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

      // User 1 starts a DM with User 2
      await waitForUserInPresence(page, user2Name);
      const dmSlug = await startDmFromProfilePopover(page, user2Name);

      // Initially, User 2 is not in the DM yet, so indicator may be gray
      const onlineIndicator = page.getByTestId('dm-header-online-indicator');
      await expect(onlineIndicator).toBeVisible();

      // User 2 opens the DM
      await navigateToDm(page2, dmSlug);

      // Now both users have the DM open - wait for presence to update
      // User 1 should see User 2 as online
      await expect(onlineIndicator).toHaveClass(/bg-green-500/, { timeout: 15000 });

      // User 2 should see User 1 as online
      const onlineIndicator2 = page2.getByTestId('dm-header-online-indicator');
      await expect(onlineIndicator2).toBeVisible();
      await expect(onlineIndicator2).toHaveClass(/bg-green-500/, { timeout: 15000 });

      await context2.close();
    });

    test('1:1 DM shows offline indicator when other user leaves DM', async ({
      page,
      browser,
    }) => {
      const id = uniqueId();
      const user1Name = `Offline Test User1 ${id}`;
      const user2Name = `Offline Test User2 ${id}`;
      const roomName = `Offline Test Room ${id}`;

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

      // User 1 starts a DM with User 2
      await waitForUserInPresence(page, user2Name);
      const dmSlug = await startDmFromProfilePopover(page, user2Name);

      // User 2 opens the DM
      await navigateToDm(page2, dmSlug);

      // Wait for online indicator (both users in DM)
      const onlineIndicator = page.getByTestId('dm-header-online-indicator');
      await expect(onlineIndicator).toBeVisible();
      await expect(onlineIndicator).toHaveClass(/bg-green-500/, { timeout: 15000 });

      // User 2 disconnects
      await page2.close();
      await context2.close();

      // Wait for offline indicator (Ably has a timeout)
      await expect(onlineIndicator).toHaveClass(/bg-stone-400/, { timeout: 30000 });
    });
  });

  test.describe('Typing Indicator', () => {
    test('typing indicator shows in DM when other user types', async ({
      page,
      browser,
    }) => {
      const id = uniqueId();
      const user1Name = `Typing User1 ${id}`;
      const user2Name = `Typing User2 ${id}`;
      const roomName = `Typing Test Room ${id}`;

      // User 1 creates a room
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // User 2 joins
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);
      await joinRoomViaBrowse(page2, roomName, roomSlug);

      // User 1 starts DM
      await waitForUserInPresence(page, user2Name);
      const dmSlug = await startDmFromProfilePopover(page, user2Name);

      // User 2 opens the DM
      await navigateToDm(page2, dmSlug);

      // Verify no typing indicator initially
      await expect(page.getByTestId('typing-indicator-empty')).toBeVisible();
      await expect(page.getByTestId('typing-indicator')).not.toBeVisible();

      // User 2 starts typing
      const input2 = page2.getByTestId('message-input');
      await input2.click();
      await input2.pressSequentially('Hello from user 2', { delay: 50 });

      // User 1 sees the typing indicator
      const typingIndicator = page.getByTestId('typing-indicator');
      await expect(typingIndicator).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('typing-indicator-text')).toContainText(user2Name);
      await expect(page.getByTestId('typing-indicator-dots')).toBeVisible();

      await context2.close();
    });

    test('typing indicator disappears when user stops typing', async ({
      page,
      browser,
    }) => {
      const id = uniqueId();
      const user1Name = `Stop Typing User1 ${id}`;
      const user2Name = `Stop Typing User2 ${id}`;
      const roomName = `Stop Typing Room ${id}`;

      // User 1 creates a room
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // User 2 joins
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);
      await joinRoomViaBrowse(page2, roomName, roomSlug);

      // User 1 starts DM
      await waitForUserInPresence(page, user2Name);
      const dmSlug = await startDmFromProfilePopover(page, user2Name);

      // User 2 opens DM and starts typing
      await navigateToDm(page2, dmSlug);
      const input2 = page2.getByTestId('message-input');
      await input2.click();
      await input2.pressSequentially('Test message', { delay: 50 });

      // User 1 sees typing indicator
      await expect(page.getByTestId('typing-indicator')).toBeVisible({ timeout: 10000 });

      // User 2 stops typing
      await input2.clear();

      // Typing indicator disappears
      await expect(page.getByTestId('typing-indicator-empty')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('typing-indicator')).not.toBeVisible();

      await context2.close();
    });
  });
});
