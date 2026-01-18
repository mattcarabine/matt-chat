import { test, expect, type Locator } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  sendMessage,
  waitForMessageList,
} from './utils/helpers';

/**
 * Wait for a UserProfileTrigger button to be enabled (profile data loaded) and click it.
 * The button is disabled until the user profile is fetched from the API.
 */
async function clickProfileTrigger(trigger: Locator): Promise<void> {
  await expect(trigger).toBeEnabled({ timeout: 15000 });
  await trigger.click();
}

test.describe('User Profile Popup', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Opening from Message List', () => {
    test('popup opens when clicking avatar in message list', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Avatar Popup ${id}`;

      // Create user and E2E room
      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `Avatar Popup Test ${id}`);
      await waitForMessageList(page);

      // Send a message to have something to click
      await sendMessage(page, `Test message ${id}`);

      // Find the message we sent and click the avatar (via UserProfileTrigger)
      const messageItem = page.getByTestId('message-item').filter({ hasText: `Test message ${id}` });
      await expect(messageItem).toBeVisible();

      // Click the avatar trigger (wait for it to be enabled - profile data must load)
      const avatarTrigger = messageItem.getByTestId('user-profile-trigger').first();
      await clickProfileTrigger(avatarTrigger);

      // Verify popup appears
      const popup = page.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();

      // Verify user info is displayed
      await expect(popup.getByTestId('user-profile-name')).toHaveText(fullName);
    });

    test('popup opens when clicking sender name in message list', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Name Popup ${id}`;

      // Create user and E2E room
      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `Name Popup Test ${id}`);
      await waitForMessageList(page);

      // Send a message to have something to click
      await sendMessage(page, `Test message ${id}`);

      // Find the message we sent
      const messageItem = page.getByTestId('message-item').filter({ hasText: `Test message ${id}` });
      await expect(messageItem).toBeVisible();

      // Click the sender name trigger (second trigger, after avatar)
      const triggers = messageItem.getByTestId('user-profile-trigger');
      const nameTrigger = triggers.nth(1);
      await clickProfileTrigger(nameTrigger);

      // Verify popup appears
      const popup = page.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();

      // Verify user info is displayed
      await expect(popup.getByTestId('user-profile-name')).toHaveText(fullName);
    });
  });

  test.describe('Opening from Presence List', () => {
    test('popup opens when clicking name in presence list', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Presence Popup ${id}`;

      // Create user and E2E room
      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `Presence Popup Test ${id}`);
      await waitForMessageList(page);

      // Wait for presence list to load
      const presenceList = page.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

      // Find user in presence list
      const presenceItem = page.getByTestId('presence-online-section')
        .getByTestId('presence-item')
        .filter({ hasText: fullName });
      await expect(presenceItem).toBeVisible({ timeout: 15000 });

      // Click the presence item trigger
      const presenceTrigger = presenceItem.getByTestId('user-profile-trigger');
      await clickProfileTrigger(presenceTrigger);

      // Verify popup appears
      const popup = page.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();

      // Verify user info is displayed
      await expect(popup.getByTestId('user-profile-name')).toHaveText(fullName);
    });
  });

  test.describe('User Info Display', () => {
    test('popup displays correct user information', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Info Display ${id}`;
      const username = `user${id}`;

      // Create user and E2E room
      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `Info Display Test ${id}`);
      await waitForMessageList(page);

      // Send a message to have something to click
      await sendMessage(page, `Test message ${id}`);

      // Find the message and click the avatar
      const messageItem = page.getByTestId('message-item').filter({ hasText: `Test message ${id}` });
      const avatarTrigger = messageItem.getByTestId('user-profile-trigger').first();
      await clickProfileTrigger(avatarTrigger);

      // Verify popup appears
      const popup = page.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();

      // Verify display name
      await expect(popup.getByTestId('user-profile-name')).toHaveText(fullName);

      // Verify username with @ prefix
      await expect(popup.getByTestId('user-profile-username')).toHaveText(`@${username}`);

      // Verify member since is displayed
      const memberSince = popup.getByTestId('user-profile-member-since');
      await expect(memberSince).toBeVisible();
      // Should contain "Member since" and a month/year
      await expect(memberSince).toContainText('Member since');
    });
  });

  test.describe('Online Status Indicator', () => {
    test('popup shows online status indicator when opened from presence list', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Status Indicator ${id}`;

      // Create user and E2E room
      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `Status Indicator Test ${id}`);
      await waitForMessageList(page);

      // Wait for presence list to load
      const presenceList = page.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

      // Find user in presence list
      const presenceItem = page.getByTestId('presence-online-section')
        .getByTestId('presence-item')
        .filter({ hasText: fullName });
      await expect(presenceItem).toBeVisible({ timeout: 15000 });

      // Click the presence item trigger
      const presenceTrigger = presenceItem.getByTestId('user-profile-trigger');
      await clickProfileTrigger(presenceTrigger);

      // Verify popup appears with status indicator
      const popup = page.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();

      // Verify status indicator is present (online user should have green indicator)
      const statusIndicator = popup.getByTestId('user-profile-status');
      await expect(statusIndicator).toBeVisible();
    });
  });

  test.describe('Closing Behavior', () => {
    test('popup closes when clicking outside', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Click Outside ${id}`;

      // Create user and E2E room
      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `Click Outside Test ${id}`);
      await waitForMessageList(page);

      // Send a message to have something to click
      await sendMessage(page, `Test message ${id}`);

      // Find the message and click the avatar to open popup
      const messageItem = page.getByTestId('message-item').filter({ hasText: `Test message ${id}` });
      const avatarTrigger = messageItem.getByTestId('user-profile-trigger').first();
      await clickProfileTrigger(avatarTrigger);

      // Verify popup is open
      const popup = page.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();

      // Click outside the popup (on the message list background)
      await page.getByTestId('message-list').click({ position: { x: 10, y: 10 } });

      // Verify popup is closed
      await expect(popup).not.toBeVisible();
    });

    test('popup closes when pressing ESC key', async ({ page }) => {
      const id = uniqueId();
      const fullName = `ESC Close ${id}`;

      // Create user and E2E room
      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `ESC Close Test ${id}`);
      await waitForMessageList(page);

      // Send a message to have something to click
      await sendMessage(page, `Test message ${id}`);

      // Find the message and click the avatar to open popup
      const messageItem = page.getByTestId('message-item').filter({ hasText: `Test message ${id}` });
      const avatarTrigger = messageItem.getByTestId('user-profile-trigger').first();
      await clickProfileTrigger(avatarTrigger);

      // Verify popup is open
      const popup = page.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();

      // Press ESC key
      await page.keyboard.press('Escape');

      // Verify popup is closed
      await expect(popup).not.toBeVisible();
    });
  });

  test.describe('Popup Positioning', () => {
    test('own messages show popup on left side', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Own Message Position ${id}`;

      // Create user and E2E room
      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `Own Msg Position Test ${id}`);
      await waitForMessageList(page);

      // Send a message (this will be our own message)
      await sendMessage(page, `Test message ${id}`);

      // Find the message and click the avatar to open popup
      const messageItem = page.getByTestId('message-item').filter({ hasText: `Test message ${id}` });
      const avatarTrigger = messageItem.getByTestId('user-profile-trigger').first();
      await clickProfileTrigger(avatarTrigger);

      // Verify popup is visible
      const popup = page.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();

      // Verify popup has left positioning (right-0 class means positioned on left side)
      // The popup should have 'right-0' in its class when placement is 'left'
      await expect(popup).toHaveClass(/right-0/);
    });

    test('other users messages show popup on right side', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Sender ${id}`;
      const user2Name = `Receiver ${id}`;
      const roomName = `Other Msg Position ${id}`;

      // User1 creates a room
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // User1 sends a message
      await sendMessage(page, `Message from user1 ${id}`);

      // User2 joins the room
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      // User2 joins via browse
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });
      await page2.getByTestId(`browse-room-${roomSlug}-join`).click();

      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // User2 should see user1's message
      const messageItem = page2.getByTestId('message-item').filter({ hasText: `Message from user1 ${id}` });
      await expect(messageItem).toBeVisible({ timeout: 15000 });

      // User2 clicks on user1's avatar (this is another user's message)
      const avatarTrigger = messageItem.getByTestId('user-profile-trigger').first();
      await clickProfileTrigger(avatarTrigger);

      // Verify popup is visible
      const popup = page2.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();

      // Verify popup has right positioning (left-0 class means positioned on right side)
      // The popup should have 'left-0' in its class when placement is 'right'
      await expect(popup).toHaveClass(/left-0/);

      // Verify it shows user1's info (the message sender)
      await expect(popup.getByTestId('user-profile-name')).toHaveText(user1Name);

      // Clean up
      await context2.close();
    });
  });

  test.describe('Multiple Users', () => {
    test('can view different users profiles via popup', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `User One ${id}`;
      const user2Name = `User Two ${id}`;
      const roomName = `Multi User Profile ${id}`;

      // User1 creates a room
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // User1 sends a message
      await sendMessage(page, `Message from user1 ${id}`);

      // User2 joins the room
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      // User2 joins via browse
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });
      await page2.getByTestId(`browse-room-${roomSlug}-join`).click();

      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // User2 sends a message
      await sendMessage(page2, `Message from user2 ${id}`);

      // Wait for user1 to receive user2's message
      const user2Message = page.getByTestId('message-item').filter({ hasText: `Message from user2 ${id}` });
      await expect(user2Message).toBeVisible({ timeout: 15000 });

      // User1 clicks on user2's avatar to view profile
      const user2AvatarTrigger = user2Message.getByTestId('user-profile-trigger').first();
      await clickProfileTrigger(user2AvatarTrigger);

      // Verify popup shows user2's info
      const popup = page.getByTestId('user-profile-popover');
      await expect(popup).toBeVisible();
      await expect(popup.getByTestId('user-profile-name')).toHaveText(user2Name);

      // Close popup by pressing ESC
      await page.keyboard.press('Escape');
      await expect(popup).not.toBeVisible();

      // User1 clicks on their own message avatar
      const user1Message = page.getByTestId('message-item').filter({ hasText: `Message from user1 ${id}` });
      const user1AvatarTrigger = user1Message.getByTestId('user-profile-trigger').first();
      await clickProfileTrigger(user1AvatarTrigger);

      // Verify popup shows user1's info
      const popup2 = page.getByTestId('user-profile-popover');
      await expect(popup2).toBeVisible();
      await expect(popup2.getByTestId('user-profile-name')).toHaveText(user1Name);

      // Clean up
      await context2.close();
    });
  });
});
