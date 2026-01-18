import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  sendMessage,
  waitForMessageList,
} from '../utils/helpers';

test.describe('User Profile Popover', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Opening Popover', () => {
    test('popover opens on message avatar click', async ({ page }) => {
      const id = uniqueId();
      const userName = `Avatar Clicker ${id}`;
      const messageText = `Test message ${id}`;

      // Create user and room, send a message
      await createUserAndSignIn(page, userName, id);
      await createRoom(page, `Avatar Test ${id}`);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // Wait for message to appear and get the userId from the avatar data-testid
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible();

      // Find the avatar button within the message item
      const avatarButton = messageItem.locator('[data-testid^="message-avatar-"]');
      await expect(avatarButton).toBeVisible();
      await avatarButton.click();

      // Verify popover appears
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Verify display name is shown
      await expect(page.getByTestId('user-profile-display-name')).toHaveText(userName);
    });

    test('popover opens on message name click', async ({ page }) => {
      const id = uniqueId();
      const userName = `Name Clicker ${id}`;
      const messageText = `Name click test ${id}`;

      // Create user and room, send a message
      await createUserAndSignIn(page, userName, id);
      await createRoom(page, `Name Test ${id}`);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // Find the message and click the name
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible();

      const nameButton = messageItem.locator('[data-testid^="message-name-"]');
      await expect(nameButton).toBeVisible();
      await nameButton.click();

      // Verify popover appears
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Verify display name is shown
      await expect(page.getByTestId('user-profile-display-name')).toHaveText(userName);
    });

    test('popover opens on presence list click', async ({ page }) => {
      const id = uniqueId();
      const userName = `Presence Clicker ${id}`;

      // Create user and room
      await createUserAndSignIn(page, userName, id);
      await createRoom(page, `Presence Test ${id}`);
      await waitForMessageList(page);

      // Wait for presence list to load
      const presenceList = page.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

      // Find user in presence list and click
      const onlineSection = page.getByTestId('presence-online-section');
      const presenceItem = onlineSection.locator('[data-testid^="presence-item-"]').filter({
        hasText: userName,
      });
      await expect(presenceItem).toBeVisible({ timeout: 15000 });
      await presenceItem.click();

      // Verify popover appears
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Verify display name is shown
      await expect(page.getByTestId('user-profile-display-name')).toHaveText(userName);
    });
  });

  test.describe('Popover Content', () => {
    test('self profile shows email and edit link', async ({ page }) => {
      const id = uniqueId();
      const userName = `Self Profile ${id}`;
      const userEmail = `user${id}@e2e-test.local`;
      const messageText = `Self profile test ${id}`;

      // Create user and room, send a message
      await createUserAndSignIn(page, userName, id);
      await createRoom(page, `Self Profile Test ${id}`);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // Click on own avatar to open popover
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      const avatarButton = messageItem.locator('[data-testid^="message-avatar-"]');
      await avatarButton.click();

      // Verify popover appears
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Verify email is shown for self
      const emailElement = page.getByTestId('user-profile-email');
      await expect(emailElement).toBeVisible();
      await expect(emailElement).toContainText(userEmail);

      // Verify Edit Profile link is shown
      const editLink = page.getByTestId('user-profile-edit-link');
      await expect(editLink).toBeVisible();
      await expect(editLink).toHaveText('Edit Profile');
    });

    test('other user profile hides email and edit link', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Profile Owner ${id}`;
      const user2Name = `Profile Viewer ${id}`;
      const roomName = `Other Profile Test ${id}`;
      const messageText = `Message from user1 ${id}`;

      // User1 creates room and sends a message
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // User2 joins the room
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      // User2 joins via Browse modal
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);
      await expect(page2.getByTestId(`browse-room-${roomSlug}`)).toBeVisible({ timeout: 10000 });
      await page2.getByTestId(`browse-room-${roomSlug}-join`).click();
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // Wait for message history to load
      const messageItem = page2.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });

      // User2 clicks on User1's avatar to view their profile
      const avatarButton = messageItem.locator('[data-testid^="message-avatar-"]');
      await avatarButton.click();

      // Verify popover appears with User1's name
      const popover = page2.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();
      await expect(page2.getByTestId('user-profile-display-name')).toHaveText(user1Name);

      // Verify email is NOT shown for other users
      const emailElement = page2.getByTestId('user-profile-email');
      await expect(emailElement).not.toBeVisible();

      // Verify Edit Profile link is NOT shown for other users
      const editLink = page2.getByTestId('user-profile-edit-link');
      await expect(editLink).not.toBeVisible();

      // Clean up
      await context2.close();
    });

    test('popover shows online status correctly', async ({ page }) => {
      const id = uniqueId();
      const userName = `Online Status ${id}`;
      const messageText = `Status test ${id}`;

      // Create user and room, send a message
      await createUserAndSignIn(page, userName, id);
      await createRoom(page, `Status Test ${id}`);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // Click on avatar to open popover
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      const avatarButton = messageItem.locator('[data-testid^="message-avatar-"]');
      await avatarButton.click();

      // Verify popover appears
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Verify status indicator is shown and shows "Online"
      const statusElement = page.getByTestId('user-profile-status');
      await expect(statusElement).toBeVisible();
      await expect(statusElement).toContainText('Online');
    });
  });

  test.describe('Popover Closing', () => {
    test('popover closes on outside click', async ({ page }) => {
      const id = uniqueId();
      const userName = `Outside Click ${id}`;
      const messageText = `Outside click test ${id}`;

      // Create user and room, send a message
      await createUserAndSignIn(page, userName, id);
      await createRoom(page, `Outside Click Test ${id}`);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // Open the popover
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      const avatarButton = messageItem.locator('[data-testid^="message-avatar-"]');
      await avatarButton.click();

      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Click outside the popover (on the message list area)
      const messageList = page.getByTestId('message-list');
      await messageList.click({ position: { x: 10, y: 10 } });

      // Verify popover closes
      await expect(popover).not.toBeVisible();
    });

    test('popover closes on Escape key', async ({ page }) => {
      const id = uniqueId();
      const userName = `Escape Key ${id}`;
      const messageText = `Escape key test ${id}`;

      // Create user and room, send a message
      await createUserAndSignIn(page, userName, id);
      await createRoom(page, `Escape Key Test ${id}`);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // Open the popover
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      const avatarButton = messageItem.locator('[data-testid^="message-avatar-"]');
      await avatarButton.click();

      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Press Escape key
      await page.keyboard.press('Escape');

      // Verify popover closes
      await expect(popover).not.toBeVisible();
    });
  });
});
