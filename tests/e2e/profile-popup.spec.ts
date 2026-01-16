import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  sendMessage,
  waitForMessageList,
} from './utils/helpers';

test.describe('Profile Popup', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Opening from Message', () => {
    test('clicking message sender name shows profile popup', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Profile Popup Test ${id}`;
      const messageText = `Test message ${id}`;

      // Create first user and room
      const senderId = uniqueId();
      await createUserAndSignIn(page, 'Sender User', senderId);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Send a message
      await sendMessage(page, messageText);

      // Create second user to view the sender's profile
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const viewerId = uniqueId();
      await createUserAndSignIn(page2, 'Viewer User', viewerId);

      // Second user joins the room
      await page2.click('button:has-text("Browse")');
      await page2.fill('input[placeholder*="Search"]', roomName);
      const roomItem = page2.locator('div').filter({ hasText: roomName }).first();
      await expect(roomItem.getByRole('button', { name: 'Join' })).toBeVisible({ timeout: 10000 });
      await roomItem.getByRole('button', { name: 'Join' }).click();
      await page2.waitForURL(/\/chat\//);
      await waitForMessageList(page2);

      // Wait for the message from sender to appear
      const messageItem = page2.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });

      // Click on the sender name
      await messageItem.getByTestId('message-sender').click();

      // Verify popup appears with correct info
      const popup = page2.getByTestId('user-profile-popup');
      await expect(popup).toBeVisible({ timeout: 5000 });
      await expect(popup.getByTestId('user-profile-displayname')).toHaveText('Sender User');

      await context2.close();
    });

    test('clicking message avatar shows profile popup', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Avatar Popup Test ${id}`;
      const messageText = `Avatar test message ${id}`;

      // Create first user and room
      const senderId = uniqueId();
      await createUserAndSignIn(page, 'Avatar Sender', senderId);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Send a message
      await sendMessage(page, messageText);

      // Create second user to view the sender's profile
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const viewerId = uniqueId();
      await createUserAndSignIn(page2, 'Avatar Viewer', viewerId);

      // Second user joins the room
      await page2.click('button:has-text("Browse")');
      await page2.fill('input[placeholder*="Search"]', roomName);
      const roomItem = page2.locator('div').filter({ hasText: roomName }).first();
      await expect(roomItem.getByRole('button', { name: 'Join' })).toBeVisible({ timeout: 10000 });
      await roomItem.getByRole('button', { name: 'Join' }).click();
      await page2.waitForURL(/\/chat\//);
      await waitForMessageList(page2);

      // Wait for the message from sender to appear
      const messageItem = page2.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });

      // Click on the avatar
      await messageItem.getByTestId('message-avatar').click();

      // Verify popup appears with correct info
      const popup = page2.getByTestId('user-profile-popup');
      await expect(popup).toBeVisible({ timeout: 5000 });
      await expect(popup.getByTestId('user-profile-displayname')).toHaveText('Avatar Sender');

      await context2.close();
    });
  });

  test.describe('Opening from Presence List', () => {
    test('clicking presence list member shows profile popup', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Presence Popup Test ${id}`;

      // Create first user and room
      const user1Id = uniqueId();
      await createUserAndSignIn(page, 'Presence User One', user1Id);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Create second user to join the room
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const user2Id = uniqueId();
      await createUserAndSignIn(page2, 'Presence User Two', user2Id);

      // Second user joins the room
      await page2.click('button:has-text("Browse")');
      await page2.fill('input[placeholder*="Search"]', roomName);
      const roomItem = page2.locator('div').filter({ hasText: roomName }).first();
      await expect(roomItem.getByRole('button', { name: 'Join' })).toBeVisible({ timeout: 10000 });
      await roomItem.getByRole('button', { name: 'Join' }).click();
      await page2.waitForURL(/\/chat\//);
      await waitForMessageList(page2);

      // Wait for presence list to show the first user
      const presenceItem = page2.getByTestId('presence-item').filter({ hasText: 'Presence User One' });
      await expect(presenceItem).toBeVisible({ timeout: 15000 });

      // Click on the presence name
      await presenceItem.getByTestId('presence-name').click();

      // Verify popup appears with correct info
      const popup = page2.getByTestId('user-profile-popup');
      await expect(popup).toBeVisible({ timeout: 5000 });
      await expect(popup.getByTestId('user-profile-displayname')).toHaveText('Presence User One');

      await context2.close();
    });
  });

  test.describe('Popup Behavior', () => {
    test('clicking outside popup closes it', async ({ page }) => {
      const id = uniqueId();
      const roomName = `Close Popup Test ${id}`;
      const messageText = `Close test message ${id}`;

      await createUserAndSignIn(page, 'Close Tester', id);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Send a message
      await sendMessage(page, messageText);

      // Click on own sender name to open popup
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });
      await messageItem.getByTestId('message-sender').click();

      // Verify popup is visible
      const popup = page.getByTestId('user-profile-popup');
      await expect(popup).toBeVisible({ timeout: 5000 });

      // Click outside the popup (on the message list background)
      await page.getByTestId('message-list').click({ position: { x: 10, y: 10 } });

      // Verify popup closes
      await expect(popup).not.toBeVisible({ timeout: 3000 });
    });

    test('pressing Escape key closes popup', async ({ page }) => {
      const id = uniqueId();
      const roomName = `Escape Popup Test ${id}`;
      const messageText = `Escape test message ${id}`;

      await createUserAndSignIn(page, 'Escape Tester', id);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Send a message
      await sendMessage(page, messageText);

      // Click on own sender name to open popup
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });
      await messageItem.getByTestId('message-sender').click();

      // Verify popup is visible
      const popup = page.getByTestId('user-profile-popup');
      await expect(popup).toBeVisible({ timeout: 5000 });

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Verify popup closes
      await expect(popup).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Popup Content', () => {
    test('popup displays correct user information', async ({ page }) => {
      const id = uniqueId();
      const fullName = 'Profile Display Test';
      const roomName = `Content Popup Test ${id}`;
      const messageText = `Content test message ${id}`;

      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Send a message
      await sendMessage(page, messageText);

      // Click on own sender name to open popup
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });
      await messageItem.getByTestId('message-sender').click();

      // Verify popup shows correct information
      const popup = page.getByTestId('user-profile-popup');
      await expect(popup).toBeVisible({ timeout: 5000 });

      // Verify display name
      await expect(popup.getByTestId('user-profile-displayname')).toHaveText(fullName);

      // Verify avatar shows first initial
      await expect(popup.getByTestId('user-profile-avatar')).toHaveText('P');

      // Verify username is shown (since it's different from display name)
      await expect(popup.getByTestId('user-profile-username')).toHaveText(`@user${id}`);

      // Verify member since is shown
      await expect(popup.getByTestId('user-profile-member-since')).toBeVisible();
      await expect(popup.getByTestId('user-profile-member-since')).toContainText('Member since');
    });
  });
});
