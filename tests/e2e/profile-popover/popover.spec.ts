import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  sendMessage,
  waitForMessageList,
} from '../utils/helpers';

test.describe('Profile Popover', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Bio Editing in Settings', () => {
    test('can edit and save bio in settings', async ({ page }) => {
      const id = uniqueId();
      const bioText = `Test bio for user ${id}`;

      await createUserAndSignIn(page, 'Bio Editor', id);

      // Navigate to settings tab
      await page.goto('/profile?tab=settings');
      await expect(page.getByTestId('settings-bio-section')).toBeVisible();

      // Enter bio text - use click and type to trigger React's onChange
      const bioTextarea = page.getByTestId('settings-bio-textarea');
      await bioTextarea.click();
      await bioTextarea.fill(bioText);

      // Verify character count updates (wait for it since state might be async)
      await expect(page.getByTestId('settings-bio-char-count')).toContainText(`${bioText.length}/160`, { timeout: 5000 });

      // Save bio
      await page.getByTestId('settings-bio-save-button').click();

      // Wait for success message
      await expect(page.getByTestId('settings-bio-success')).toBeVisible();

      // Refresh page and verify bio persists
      await page.reload();
      await expect(page.getByTestId('settings-bio-section')).toBeVisible();
      await expect(bioTextarea).toHaveValue(bioText);
    });

    test('bio textarea enforces character limit', async ({ page }) => {
      const id = uniqueId();

      await createUserAndSignIn(page, 'Char Limit Tester', id);

      // Navigate to settings tab
      await page.goto('/profile?tab=settings');
      await expect(page.getByTestId('settings-bio-section')).toBeVisible();

      // Try to enter text longer than 160 characters
      const longText = 'A'.repeat(200);
      const bioTextarea = page.getByTestId('settings-bio-textarea');
      await bioTextarea.fill(longText);

      // Verify textarea enforces maxLength (should be truncated to 160)
      const value = await bioTextarea.inputValue();
      expect(value.length).toBeLessThanOrEqual(160);

      // Verify character count shows max
      await expect(page.getByTestId('settings-bio-char-count')).toContainText('160/160');
    });
  });

  test.describe('Popover Display from Message', () => {
    test('clicking sender name in message opens profile popover', async ({ page }) => {
      const id = uniqueId();
      const fullName = 'Message Popover Test';
      const messageText = `Test message ${id}`;

      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `Popover Test ${id}`);
      await waitForMessageList(page);

      // Send a message
      await sendMessage(page, messageText);

      // Find the message and click on sender name
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible();

      // Click the clickable username (sender name)
      await messageItem.getByTestId('clickable-username').click();

      // Verify popover appears with correct info
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();
      await expect(popover.getByTestId('profile-display-name')).toContainText(fullName);
      await expect(popover.getByTestId('profile-username')).toContainText(`@user${id}`);
    });

    test('clicking outside popover closes it', async ({ page }) => {
      const id = uniqueId();
      const messageText = `Outside click test ${id}`;

      await createUserAndSignIn(page, 'Outside Click Test', id);
      await createRoom(page, `Close Test ${id}`);
      await waitForMessageList(page);

      await sendMessage(page, messageText);

      // Open popover
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await messageItem.getByTestId('clickable-username').click();

      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Click outside the popover (on the message list area)
      await page.getByTestId('message-list').click({ position: { x: 10, y: 10 } });

      // Verify popover closes
      await expect(popover).not.toBeVisible();
    });

    test('pressing Escape key closes popover', async ({ page }) => {
      const id = uniqueId();
      const messageText = `Escape key test ${id}`;

      await createUserAndSignIn(page, 'Escape Key Test', id);
      await createRoom(page, `Escape Test ${id}`);
      await waitForMessageList(page);

      await sendMessage(page, messageText);

      // Open popover
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await messageItem.getByTestId('clickable-username').click();

      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      // Press Escape key
      await page.keyboard.press('Escape');

      // Verify popover closes
      await expect(popover).not.toBeVisible();
    });
  });

  test.describe('Popover Display from Presence List', () => {
    test('clicking username in presence list opens popover with online status', async ({
      page,
      browser,
    }) => {
      const id = uniqueId();
      const roomName = `Presence Popover ${id}`;

      // Create first user and room
      await createUserAndSignIn(page, 'Presence Test User', id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // Create second user in a new context
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      const user2Name = `Presence User ${id2}`;
      await createUserAndSignIn(page2, user2Name, id2);

      // Second user joins the same room via browse
      await page2.click('button:has-text("Browse")');
      await page2.fill('input[placeholder*="Search"]', roomName);
      const roomItem = page2.locator('div').filter({ hasText: roomName }).first();
      await expect(roomItem.getByRole('button', { name: 'Join' })).toBeVisible({ timeout: 10000 });
      await roomItem.getByRole('button', { name: 'Join' }).click();
      await page2.waitForURL(/\/chat\//);
      await waitForMessageList(page2);

      // On first page, wait for second user to appear in presence list
      const presenceItem = page.getByTestId('presence-item').filter({ hasText: user2Name });
      await expect(presenceItem).toBeVisible({ timeout: 15000 });

      // Click on second user's name in presence list
      await presenceItem.getByTestId('clickable-username').click();

      // Verify popover shows with online status
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();
      await expect(popover.getByTestId('profile-display-name')).toContainText(user2Name);
      await expect(popover.getByTestId('online-indicator')).toBeVisible();

      await context2.close();
    });
  });

  test.describe('Popover Display from Invitations Page', () => {
    test('clicking inviter name on invitations page opens popover', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Invitation Popover ${id}`;

      // Create first user and private room
      await createUserAndSignIn(page, 'Inviter User', id);
      await page.click('button:has-text("Create")');
      await page.getByTestId('create-room-name').fill(roomName);
      await page.getByTestId('create-room-private').check();
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\//);

      // Create second user in new context
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      const inviteeName = `Invitee ${id2}`;
      await createUserAndSignIn(page2, inviteeName, id2);

      // First user invites second user
      await page.click('button:has-text("Invite Member")');
      await expect(page.getByTestId('invite-user-modal')).toBeVisible();
      await page.getByTestId('invite-user-search').fill(inviteeName);
      const inviteButton = page.getByRole('button', { name: 'Invite', exact: true }).first();
      await expect(inviteButton).toBeVisible({ timeout: 15000 });
      await inviteButton.click();
      await expect(page.getByRole('button', { name: 'Invited', exact: true }).first()).toBeVisible({
        timeout: 5000,
      });
      await page.getByTestId('invite-modal-done').click();

      // Second user goes to invitations page
      await page2.goto('/invitations');
      await expect(page2.locator(`text=${roomName}`)).toBeVisible();

      // Click on inviter name
      await page2.getByTestId('clickable-username').first().click();

      // Verify popover appears
      const popover = page2.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();
      await expect(popover.getByTestId('profile-display-name')).toContainText('Inviter User');

      await context2.close();
    });
  });

  test.describe('Popover Display from Invite Modal', () => {
    test('clicking user name in invite modal search results opens popover', async ({
      page,
      browser,
    }) => {
      const id = uniqueId();
      const roomName = `Modal Popover ${id}`;

      // Create first user and private room
      await createUserAndSignIn(page, 'Modal Test User', id);
      await page.click('button:has-text("Create")');
      await page.getByTestId('create-room-name').fill(roomName);
      await page.getByTestId('create-room-private').check();
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\//);

      // Create second user so they appear in search results
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      const searchUserName = `Searchable ${id2}`;
      await createUserAndSignIn(page2, searchUserName, id2);

      // First user opens invite modal and searches
      await page.click('button:has-text("Invite Member")');
      await expect(page.getByTestId('invite-user-modal')).toBeVisible();
      await page.getByTestId('invite-user-search').fill(searchUserName);

      // Wait for search results inside modal
      const modal = page.getByTestId('invite-user-modal');
      await expect(modal.getByText(searchUserName)).toBeVisible({ timeout: 15000 });

      // Click on the user's name (ClickableUsername) inside the modal
      await modal.getByTestId('clickable-username').click();

      // Verify popover appears
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();
      await expect(popover.getByTestId('profile-display-name')).toContainText(searchUserName);

      await context2.close();
    });
  });

  test.describe('Shared Rooms Count', () => {
    test('popover displays accurate shared rooms count', async ({ page, browser }) => {
      const id = uniqueId();
      const room1Name = `Shared Room 1 ${id}`;
      const room2Name = `Shared Room 2 ${id}`;

      // Create first user and two rooms
      await createUserAndSignIn(page, 'Shared Rooms User', id);
      await createRoom(page, room1Name);
      await waitForMessageList(page);

      // Create second room
      await page.click('button:has-text("Create")');
      await page.getByTestId('create-room-name').fill(room2Name);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\//);
      await waitForMessageList(page);

      // Create second user
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      const user2Name = `Counter User ${id2}`;
      await createUserAndSignIn(page2, user2Name, id2);

      // Second user joins both rooms
      await page2.click('button:has-text("Browse")');
      await page2.fill('input[placeholder*="Search"]', room1Name);
      const roomItem1 = page2.locator('div').filter({ hasText: room1Name }).first();
      await expect(roomItem1.getByRole('button', { name: 'Join' })).toBeVisible({ timeout: 10000 });
      await roomItem1.getByRole('button', { name: 'Join' }).click();
      await page2.waitForURL(/\/chat\//);

      await page2.click('button:has-text("Browse")');
      await page2.fill('input[placeholder*="Search"]', room2Name);
      const roomItem2 = page2.locator('div').filter({ hasText: room2Name }).first();
      await expect(roomItem2.getByRole('button', { name: 'Join' })).toBeVisible({ timeout: 10000 });
      await roomItem2.getByRole('button', { name: 'Join' }).click();
      await page2.waitForURL(/\/chat\//);

      // Send a message so the avatar shows
      await waitForMessageList(page2);
      await sendMessage(page2, `Test message from ${user2Name}`);

      // First user navigates to room2 where user2 is
      // Click on room2 in the sidebar (user1 created it, so they're already a member)
      await page.getByTestId(`room-item-${room2Name.toLowerCase().replace(/\s+/g, '-')}`).click();
      await page.waitForURL(/\/chat\//);
      await waitForMessageList(page);

      // Wait for second user's message to appear (filter by the message text, not the name)
      const messageItem = page.getByTestId('message-item').filter({ hasText: `Test message from ${user2Name}` });
      await expect(messageItem).toBeVisible({ timeout: 15000 });

      // Click on second user's name to open popover
      await messageItem.getByTestId('clickable-username').click();

      // Verify shared rooms count shows at least 2 (they share room1 and room2)
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();
      const sharedRoomsText = await popover.getByTestId('profile-shared-rooms').textContent();
      expect(sharedRoomsText).toMatch(/\d+ shared rooms?/);
      // Extract the number and verify it's at least 2
      const match = sharedRoomsText?.match(/(\d+)/);
      const count = match ? parseInt(match[1], 10) : 0;
      expect(count).toBeGreaterThanOrEqual(2);

      await context2.close();
    });
  });

  test.describe('Bio Display in Popover', () => {
    test('popover shows user bio when set', async ({ page, browser }) => {
      const id = uniqueId();
      const bioText = `This is my bio ${id}`;
      const roomName = `Bio Display ${id}`;

      // Create first user with a bio
      await createUserAndSignIn(page, 'Bio Display User', id);

      // Set bio in settings
      await page.goto('/profile?tab=settings');
      await expect(page.getByTestId('settings-bio-section')).toBeVisible();
      await page.getByTestId('settings-bio-textarea').fill(bioText);
      await page.getByTestId('settings-bio-save-button').click();
      await expect(page.getByTestId('settings-bio-success')).toBeVisible();

      // Create a public room
      await page.goto('/chat');
      await createRoom(page, roomName);
      await waitForMessageList(page);
      await sendMessage(page, `Hello from bio user ${id}`);

      // Create second user to view the popover
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Bio Viewer', id2);

      // Join the room
      await page2.click('button:has-text("Browse")');
      await page2.fill('input[placeholder*="Search"]', roomName);
      const roomItem = page2.locator('div').filter({ hasText: roomName }).first();
      await expect(roomItem.getByRole('button', { name: 'Join' })).toBeVisible({ timeout: 10000 });
      await roomItem.getByRole('button', { name: 'Join' }).click();
      await page2.waitForURL(/\/chat\//);
      await waitForMessageList(page2);

      // Find the message from first user and click on their name
      const messageItem = page2
        .getByTestId('message-item')
        .filter({ hasText: `Hello from bio user ${id}` });
      await expect(messageItem).toBeVisible({ timeout: 15000 });
      await messageItem.getByTestId('clickable-username').click();

      // Verify popover shows the bio
      const popover = page2.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();
      await expect(popover.getByTestId('profile-bio')).toContainText(bioText);

      await context2.close();
    });
  });

  test.describe('Member Since Date', () => {
    test('popover shows member since date', async ({ page }) => {
      const id = uniqueId();
      const messageText = `Date test ${id}`;

      await createUserAndSignIn(page, 'Date Test User', id);
      await createRoom(page, `Date Test ${id}`);
      await waitForMessageList(page);

      await sendMessage(page, messageText);

      // Click on sender name
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await messageItem.getByTestId('clickable-username').click();

      // Verify popover shows member since (should be current month/year)
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();

      const memberSince = popover.getByTestId('profile-member-since');
      await expect(memberSince).toBeVisible();

      // Should contain a month and year (e.g., "January 2024")
      const text = await memberSince.textContent();
      expect(text).toMatch(/\w+ \d{4}/);
    });
  });
});
