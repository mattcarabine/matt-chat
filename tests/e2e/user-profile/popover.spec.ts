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

  test.describe('Message Sender Popover', () => {
    test('clicking another user message sender opens popover with correct info', async ({
      page,
      browser,
    }) => {
      const id = uniqueId();
      const user1Name = `Sender User ${id}`;
      const user2Name = `Viewer User ${id}`;
      const roomName = `Popover Test ${id}`;
      const messageText = `Hello from user1 ${id}`;

      // User1 creates a room and sends a message
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // User2 joins the same room
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

      // User2 should see User1's message
      const messageItem = page2.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });

      // Click on the message sender's avatar (not own message, so should be clickable)
      const clickableAvatar = messageItem.getByTestId('message-sender-clickable');
      await expect(clickableAvatar).toBeVisible();
      await clickableAvatar.click();

      // Verify popover appears with correct user info
      const popover = page2.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Check display name
      await expect(page2.getByTestId('profile-popover-name')).toHaveText(user1Name);

      // Check username
      await expect(page2.getByTestId('profile-popover-username')).toContainText(`user${id}`);

      // Check email
      await expect(page2.getByTestId('profile-popover-email')).toContainText(`user${id}@e2e-test.local`);

      // Check member since is visible
      await expect(page2.getByTestId('profile-popover-member-since')).toContainText('Member since');

      // Check View Profile link is visible
      await expect(page2.getByTestId('profile-popover-view-link')).toBeVisible();
      await expect(page2.getByTestId('profile-popover-view-link')).toHaveText(/View Profile/);

      // Clean up
      await context2.close();
    });

    test('clicking own message does not show popover', async ({ page }) => {
      const id = uniqueId();
      const userName = `Self Sender ${id}`;
      const roomName = `Self Popover Test ${id}`;
      const messageText = `My own message ${id}`;

      await createUserAndSignIn(page, userName, id);
      await createRoom(page, roomName);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // Find own message
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });

      // Own message should not have clickable avatar (data-testid not set for own messages)
      const clickableAvatar = messageItem.getByTestId('message-sender-clickable');
      await expect(clickableAvatar).not.toBeVisible();

      // Click on message sender name - should not open popover
      const senderName = messageItem.getByTestId('message-sender');
      await senderName.click();

      // Popover should not appear
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).not.toBeVisible();
    });
  });

  test.describe('Presence List Popover', () => {
    test('clicking presence list member opens popover', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Presence Owner ${id}`;
      const user2Name = `Presence Viewer ${id}`;
      const roomName = `Presence Popover Test ${id}`;

      // User1 creates the room
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // User2 joins the room
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);
      await expect(page2.getByTestId(`browse-room-${roomSlug}`)).toBeVisible({ timeout: 10000 });
      await page2.getByTestId(`browse-room-${roomSlug}-join`).click();
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // Wait for presence list to show User1
      const presenceList = page2.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

      const onlineSection = page2.getByTestId('presence-online-section');
      const user1Presence = onlineSection
        .getByTestId('presence-item')
        .filter({ hasText: user1Name });
      await expect(user1Presence).toBeVisible({ timeout: 15000 });

      // Click on User1 in the presence list (not self, so should be clickable)
      const clickableItem = user1Presence.getByTestId('presence-item-clickable');
      await expect(clickableItem).toBeVisible();
      await clickableItem.click();

      // Verify popover appears with correct user info
      const popover = page2.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      await expect(page2.getByTestId('profile-popover-name')).toHaveText(user1Name);
      await expect(page2.getByTestId('profile-popover-username')).toContainText(`user${id}`);
      await expect(page2.getByTestId('profile-popover-email')).toContainText(`user${id}@e2e-test.local`);

      // Clean up
      await context2.close();
    });

    test('clicking own presence does not show popover', async ({ page }) => {
      const id = uniqueId();
      const userName = `Self Presence ${id}`;
      const roomName = `Self Presence Test ${id}`;

      await createUserAndSignIn(page, userName, id);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Wait for presence list
      const presenceList = page.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

      // Find own presence item (should have "(you)" indicator)
      const onlineSection = page.getByTestId('presence-online-section');
      const selfPresence = onlineSection
        .getByTestId('presence-item')
        .filter({ hasText: userName });
      await expect(selfPresence).toBeVisible({ timeout: 15000 });
      await expect(selfPresence.getByTestId('presence-name')).toContainText('(you)');

      // Own presence should not have clickable testid
      const clickableItem = selfPresence.getByTestId('presence-item-clickable');
      await expect(clickableItem).not.toBeVisible();

      // Click on presence name - should not open popover
      await selfPresence.getByTestId('presence-name').click();

      // Popover should not appear
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).not.toBeVisible();
    });
  });

  test.describe('Popover Information Display', () => {
    test('popover shows displayName, username, email, and member since', async ({
      page,
      browser,
    }) => {
      const id = uniqueId();
      const user1Name = `Info Display User ${id}`;
      const user2Name = `Info Viewer ${id}`;
      const roomName = `Info Popover Test ${id}`;
      const messageText = `Info test message ${id}`;

      // User1 creates a room and sends a message
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // User2 joins and views User1's profile
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);
      await expect(page2.getByTestId(`browse-room-${roomSlug}`)).toBeVisible({ timeout: 10000 });
      await page2.getByTestId(`browse-room-${roomSlug}-join`).click();
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // Click on User1's message
      const messageItem = page2.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });
      await messageItem.getByTestId('message-sender-clickable').click();

      // Verify all profile info is displayed
      const popover = page2.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Display name
      const nameElement = page2.getByTestId('profile-popover-name');
      await expect(nameElement).toBeVisible();
      await expect(nameElement).toHaveText(user1Name);

      // Username (shows in format @username)
      const usernameElement = page2.getByTestId('profile-popover-username');
      await expect(usernameElement).toBeVisible();
      await expect(usernameElement).toContainText(`user${id}`);

      // Email
      const emailElement = page2.getByTestId('profile-popover-email');
      await expect(emailElement).toBeVisible();
      await expect(emailElement).toContainText(`user${id}@e2e-test.local`);

      // Member since (just verify it contains the expected text pattern)
      const memberSinceElement = page2.getByTestId('profile-popover-member-since');
      await expect(memberSinceElement).toBeVisible();
      await expect(memberSinceElement).toContainText('Member since');

      // Clean up
      await context2.close();
    });
  });

  test.describe('Popover Navigation', () => {
    test('View Profile link navigates to profile page', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Nav Target ${id}`;
      const user2Name = `Nav User ${id}`;
      const roomName = `Nav Popover Test ${id}`;
      const messageText = `Nav test message ${id}`;

      // User1 creates room and sends message
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // User2 joins
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);
      await expect(page2.getByTestId(`browse-room-${roomSlug}`)).toBeVisible({ timeout: 10000 });
      await page2.getByTestId(`browse-room-${roomSlug}-join`).click();
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // Open popover for User1
      const messageItem = page2.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });
      await messageItem.getByTestId('message-sender-clickable').click();

      // Click View Profile link
      const viewProfileLink = page2.getByTestId('profile-popover-view-link');
      await expect(viewProfileLink).toBeVisible();
      await viewProfileLink.click();

      // Verify navigation to profile page (should be /profile/{userId} for other users)
      await expect(page2).toHaveURL(/\/profile\//);

      // Clean up
      await context2.close();
    });
  });

  test.describe('Popover Dismissal', () => {
    test('click outside closes popover', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Click Outside Target ${id}`;
      const user2Name = `Click Outside User ${id}`;
      const roomName = `Click Outside Test ${id}`;
      const messageText = `Click outside test ${id}`;

      // User1 creates room and sends message
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // User2 joins
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);
      await expect(page2.getByTestId(`browse-room-${roomSlug}`)).toBeVisible({ timeout: 10000 });
      await page2.getByTestId(`browse-room-${roomSlug}-join`).click();
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // Open popover
      const messageItem = page2.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });
      await messageItem.getByTestId('message-sender-clickable').click();

      // Verify popover is open
      const popover = page2.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Click outside the popover (on the message list area)
      await page2.getByTestId('message-list').click({ position: { x: 10, y: 10 } });

      // Verify popover is closed
      await expect(popover).not.toBeVisible();

      // Clean up
      await context2.close();
    });

    test('Escape key closes popover', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Escape Target ${id}`;
      const user2Name = `Escape User ${id}`;
      const roomName = `Escape Key Test ${id}`;
      const messageText = `Escape key test ${id}`;

      // User1 creates room and sends message
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);
      await sendMessage(page, messageText);

      // Wait for Ably to persist the message to history (eventual consistency)
      await page.waitForTimeout(2000);

      // User2 joins
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);
      await expect(page2.getByTestId(`browse-room-${roomSlug}`)).toBeVisible({ timeout: 10000 });
      await page2.getByTestId(`browse-room-${roomSlug}-join`).click();
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // Open popover - wait for message from history
      const messageItem = page2.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 20000 });
      await messageItem.getByTestId('message-sender-clickable').click();

      // Verify popover is open
      const popover = page2.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Press Escape key
      await page2.keyboard.press('Escape');

      // Verify popover is closed
      await expect(popover).not.toBeVisible();

      // Clean up
      await context2.close();
    });
  });

  test.describe('Navbar User Menu', () => {
    test('current user navbar avatar shows dropdown, not popover', async ({ page }) => {
      const id = uniqueId();
      const userName = `Navbar User ${id}`;
      const roomName = `Navbar Test ${id}`;

      await createUserAndSignIn(page, userName, id);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Click on the user menu button in the navbar
      const userMenuButton = page.getByTestId('user-menu-button');
      await expect(userMenuButton).toBeVisible();
      await userMenuButton.click();

      // Verify the dropdown menu appears (not a popover)
      // The dropdown should have the Profile link and Sign out button
      await expect(page.getByTestId('user-dropdown-profile')).toBeVisible();
      await expect(page.getByTestId('signout-button')).toBeVisible();

      // Verify the user profile popover does NOT appear
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).not.toBeVisible();

      // Click elsewhere to close the dropdown
      await page.keyboard.press('Escape');

      // Dropdown should close
      await expect(page.getByTestId('user-dropdown-profile')).not.toBeVisible();
    });
  });
});
