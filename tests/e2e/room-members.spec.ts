import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  waitForMessageList,
} from './utils/helpers';

test.describe('Room Members', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Header Online Count', () => {
    test('room header shows online member count', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Header Count User ${id}`;

      // Create user and navigate to chat (lands in default room)
      await createUserAndSignIn(page, fullName, id);
      await waitForMessageList(page);

      // Wait for the online count to appear in the header
      const onlineCount = page.getByTestId('room-header-online-count');
      await expect(onlineCount).toBeVisible({ timeout: 15000 });

      // Verify it shows at least "1 online" (the current user)
      await expect(onlineCount).toContainText('online');

      // The count should be a number followed by "online"
      await expect(onlineCount).toHaveText(/\d+\s*online/);
    });
  });

  test.describe('Presence List', () => {
    test('presence list shows online members with names', async ({ page }) => {
      const id = uniqueId();
      const fullName = 'Presence Test User';

      // Create user and navigate to chat (lands in default room)
      await createUserAndSignIn(page, fullName, id);
      await waitForMessageList(page);

      // Wait for presence list to load
      const presenceList = page.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

      // Verify online section header shows at least 1 online member
      const onlineCountHeader = page.getByTestId('presence-online-count');
      await expect(onlineCountHeader).toBeVisible();
      await expect(onlineCountHeader).toContainText('Online (');

      // Verify the online section contains our user
      const onlineSection = page.getByTestId('presence-online-section');
      await expect(onlineSection).toBeVisible();

      // Find our user in the presence list
      const presenceItem = onlineSection.getByTestId('presence-item').filter({
        hasText: fullName,
      });
      await expect(presenceItem).toBeVisible({ timeout: 15000 });

      // Verify the user's name is displayed
      const presenceName = presenceItem.getByTestId('presence-name');
      await expect(presenceName).toBeVisible();
      await expect(presenceName).toContainText(fullName);

      // Verify the "(you)" indicator is shown for current user
      await expect(presenceName).toContainText('(you)');

      // Verify the green status indicator is present (online)
      const statusIndicator = presenceItem.getByTestId('presence-status-indicator');
      await expect(statusIndicator).toBeVisible();
    });

    test('user appears in presence when joining room', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Presence Owner ${id}`;
      const user2Name = `Presence Joiner ${id}`;
      const roomName = `Presence Join Room ${id}`;

      // User1 creates a public room
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // Wait for presence list to load and verify user1 is there
      const presenceList = page.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

      const onlineSection = page.getByTestId('presence-online-section');
      await expect(
        onlineSection.getByTestId('presence-item').filter({ hasText: user1Name })
      ).toBeVisible({ timeout: 15000 });

      // User2 joins the room via Browse modal
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, user2Name, id2);

      // Open Browse modal and join the room
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });

      const joinButton = page2.getByTestId(`browse-room-${roomSlug}-join`);
      await joinButton.click();

      // Wait for user2 to enter the room
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // Wait for user2's presence list to load
      const presenceList2 = page2.getByTestId('presence-list');
      await expect(presenceList2).toBeVisible({ timeout: 15000 });

      // User2 should see themselves in the presence list with "(you)" indicator
      const onlineSection2 = page2.getByTestId('presence-online-section');
      const user2SelfPresence = onlineSection2
        .getByTestId('presence-item')
        .filter({ hasText: user2Name });
      await expect(user2SelfPresence).toBeVisible({ timeout: 15000 });

      // Verify "(you)" indicator shows for self
      const user2PresenceName = user2SelfPresence.getByTestId('presence-name');
      await expect(user2PresenceName).toContainText(user2Name);
      await expect(user2PresenceName).toContainText('(you)');

      // User2 should also see user1 (the room creator) in the presence list
      const user1InUser2Presence = onlineSection2
        .getByTestId('presence-item')
        .filter({ hasText: user1Name });
      await expect(user1InUser2Presence).toBeVisible({ timeout: 15000 });

      // Verify user1's name is displayed correctly (without "(you)" since it's not the current user)
      const user1PresenceName = user1InUser2Presence.getByTestId('presence-name');
      await expect(user1PresenceName).toContainText(user1Name);
      await expect(user1PresenceName).not.toContainText('(you)');

      // Clean up
      await context2.close();
    });

    test('multiple users show in presence simultaneously', async ({ page, browser }) => {
      const id = uniqueId();
      const user1Name = `Presence User1 ${id}`;
      const user2Name = `Presence User2 ${id}`;
      const user3Name = `Presence User3 ${id}`;
      const roomName = `Multi Presence Room ${id}`;

      // User1 creates a public room
      await createUserAndSignIn(page, user1Name, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // Wait for user1's presence to load
      const presenceList = page.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

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

      // User3 joins the room
      const context3 = await browser.newContext();
      await setE2eCookie(context3);
      const page3 = await context3.newPage();
      const id3 = uniqueId();
      await createUserAndSignIn(page3, user3Name, id3);

      await page3.click('button:has-text("Browse")');
      await expect(page3.getByTestId('browse-rooms-modal')).toBeVisible();
      await page3.getByTestId('browse-rooms-search').fill(roomName);
      await expect(page3.getByTestId(`browse-room-${roomSlug}`)).toBeVisible({ timeout: 10000 });
      await page3.getByTestId(`browse-room-${roomSlug}-join`).click();
      await expect(page3).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page3);

      // Wait for presence list to update for user3
      const presenceList3 = page3.getByTestId('presence-list');
      await expect(presenceList3).toBeVisible({ timeout: 15000 });

      const onlineSection3 = page3.getByTestId('presence-online-section');

      // User3 should see all three users in the presence list
      await expect(
        onlineSection3.getByTestId('presence-item').filter({ hasText: user1Name })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        onlineSection3.getByTestId('presence-item').filter({ hasText: user2Name })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        onlineSection3.getByTestId('presence-item').filter({ hasText: user3Name })
      ).toBeVisible({ timeout: 15000 });

      // Verify online count shows 3
      const onlineCount3 = page3.getByTestId('presence-online-count');
      await expect(onlineCount3).toContainText('Online (3)');

      // Verify user3's own presence has "(you)" indicator
      const user3Presence = onlineSection3
        .getByTestId('presence-item')
        .filter({ hasText: user3Name });
      const user3PresenceName = user3Presence.getByTestId('presence-name');
      await expect(user3PresenceName).toContainText('(you)');

      // Verify other users don't have "(you)" indicator from user3's perspective
      const user1Presence = onlineSection3
        .getByTestId('presence-item')
        .filter({ hasText: user1Name });
      await expect(user1Presence.getByTestId('presence-name')).not.toContainText('(you)');

      const user2Presence = onlineSection3
        .getByTestId('presence-item')
        .filter({ hasText: user2Name });
      await expect(user2Presence.getByTestId('presence-name')).not.toContainText('(you)');

      // Clean up
      await context2.close();
      await context3.close();
    });

    test('user disappears from presence when leaving room', async ({ page, browser }) => {
      const id = uniqueId();
      const creatorName = `Room Creator ${id}`;
      const joinerName = `Room Joiner ${id}`;
      const roomName = `Presence Leave Test ${id}`;

      // Creator creates the room (page1 = creator)
      await createUserAndSignIn(page, creatorName, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // Wait for creator's presence to load
      const presenceList = page.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

      // Joiner joins the room (page2 = joiner)
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, joinerName, id2);

      // Open Browse modal and join the room
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });

      const joinButton = page2.getByTestId(`browse-room-${roomSlug}-join`);
      await joinButton.click();

      // Wait for joiner to enter the room
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // Wait for joiner's presence list to load and verify they see both users
      const presenceList2 = page2.getByTestId('presence-list');
      await expect(presenceList2).toBeVisible({ timeout: 15000 });

      const onlineSection2 = page2.getByTestId('presence-online-section');

      // Joiner should see themselves
      await expect(
        onlineSection2.getByTestId('presence-item').filter({ hasText: joinerName })
      ).toBeVisible({ timeout: 15000 });

      // Joiner should see the creator (since joiner's member list includes creator)
      await expect(
        onlineSection2.getByTestId('presence-item').filter({ hasText: creatorName })
      ).toBeVisible({ timeout: 15000 });

      // Verify both are showing as online (from joiner's perspective)
      const onlineCount2 = page2.getByTestId('presence-online-count');
      await expect(onlineCount2).toContainText('Online (2)');

      // Now creator closes their browser (simulating leaving/disconnect)
      await page.close();

      // Joiner should see creator disappear from presence list
      // Ably presence has a timeout for detecting disconnection
      await expect(
        onlineSection2.getByTestId('presence-item').filter({ hasText: creatorName })
      ).not.toBeVisible({ timeout: 30000 });

      // Joiner should still see themselves in presence
      await expect(
        onlineSection2.getByTestId('presence-item').filter({ hasText: joinerName })
      ).toBeVisible();

      // Online count should show 1 now
      await expect(onlineCount2).toContainText('Online (1)');

      // Clean up
      await context2.close();
    });

    test('presence updates in real-time when users join/leave', async ({ page, browser }) => {
      const id = uniqueId();
      const observerName = `Observer ${id}`;
      const joinerName = `Joiner ${id}`;
      const roomName = `Realtime Presence ${id}`;

      // Observer creates the room and stays in it
      await createUserAndSignIn(page, observerName, id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // Wait for observer's presence list to load
      const presenceList = page.getByTestId('presence-list');
      await expect(presenceList).toBeVisible({ timeout: 15000 });

      const onlineSection = page.getByTestId('presence-online-section');
      const onlineCount = page.getByTestId('presence-online-count');

      // Observer should see only themselves initially
      await expect(
        onlineSection.getByTestId('presence-item').filter({ hasText: observerName })
      ).toBeVisible({ timeout: 15000 });
      await expect(onlineCount).toContainText('Online (1)');

      // Joiner opens a new browser context and joins the room
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, joinerName, id2);

      // Joiner joins via Browse modal
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);
      await expect(page2.getByTestId(`browse-room-${roomSlug}`)).toBeVisible({ timeout: 10000 });
      await page2.getByTestId(`browse-room-${roomSlug}-join`).click();
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });
      await waitForMessageList(page2);

      // === REAL-TIME JOIN: Observer should see joiner appear without refresh ===
      await expect(
        onlineSection.getByTestId('presence-item').filter({ hasText: joinerName })
      ).toBeVisible({ timeout: 15000 });
      await expect(onlineCount).toContainText('Online (2)');

      // === REAL-TIME LEAVE: Joiner closes their page ===
      await page2.close();
      await context2.close();

      // Observer should see joiner disappear in real-time (Ably has a disconnect timeout)
      await expect(
        onlineSection.getByTestId('presence-item').filter({ hasText: joinerName })
      ).not.toBeVisible({ timeout: 30000 });

      // Observer should still be there and count should update back to 1
      await expect(
        onlineSection.getByTestId('presence-item').filter({ hasText: observerName })
      ).toBeVisible();
      await expect(onlineCount).toContainText('Online (1)');
    });
  });
});
