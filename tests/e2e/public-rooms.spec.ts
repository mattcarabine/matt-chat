import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
} from './utils/helpers';

test.describe('Public Rooms', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Creating Public Rooms', () => {
    test('user can create a public room with name and description', async ({ page }) => {
      const id = uniqueId();
      const roomName = `Public Room ${id}`;
      const roomDescription = `A test public room created by e2e test ${id}`;

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Public Room Creator', id);

      // Click Create button to open create room modal
      await page.click('button:has-text("Create")');

      // Fill in room details
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.fill('[data-testid="create-room-description"]', roomDescription);

      // Ensure private checkbox is NOT checked (default should be public)
      const privateCheckbox = page.getByTestId('create-room-private');
      await expect(privateCheckbox).not.toBeChecked();

      // Submit the form
      await page.getByTestId('create-room-submit').click();

      // Should navigate to the new room
      await expect(page).toHaveURL(/\/chat\/public-room-/);

      // Room name should appear in the header
      await expect(page.locator('h2').filter({ hasText: roomName })).toBeVisible();
    });

    test('created room appears in user sidebar', async ({ page }) => {
      const id = uniqueId();
      const roomName = `Sidebar Test Room ${id}`;

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Sidebar Tester', id);

      // Create a new room
      await createRoom(page, roomName);

      // Wait for navigation to complete and sidebar to update
      await expect(page).toHaveURL(/\/chat\//);

      // Verify the room appears in the sidebar
      const sidebar = page.getByTestId('room-sidebar');
      await expect(sidebar.getByText(roomName)).toBeVisible();
    });
  });

  test.describe('Browsing Public Rooms', () => {
    test('search finds rooms by name', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Searchable Room ${id}`;
      const roomDescription = `Description for searchable room ${id}`;

      // First user creates a public room with a unique name
      await createUserAndSignIn(page, 'Search Creator', id);
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.fill('[data-testid="create-room-description"]', roomDescription);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\/searchable-room-/);

      // Get the room slug from URL
      const url = page.url();
      const roomSlug = url.split('/chat/')[1];

      // Second user searches by room name
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Room Searcher', id2);

      // Open Browse modal
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();

      // Search using a partial name (just the unique ID part)
      await page2.getByTestId('browse-rooms-search').fill(id);

      // The room should appear in search results
      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });
      await expect(roomItem).toContainText(roomName);

      // Clean up
      await context2.close();
    });

    test('search finds rooms by description', async ({ page, browser }) => {
      const id = uniqueId();
      // Use a generic name that won't be matched by the description search term
      const roomName = `Generic Room ${id}`;
      // Use a unique term in description that is NOT in the room name
      const uniqueDescriptionTerm = `unicornpizza${id}`;
      const roomDescription = `A room about ${uniqueDescriptionTerm} topics`;

      // First user creates a public room
      await createUserAndSignIn(page, 'Desc Search Creator', id);
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.fill('[data-testid="create-room-description"]', roomDescription);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\/generic-room-/);

      // Get the room slug from URL
      const url = page.url();
      const roomSlug = url.split('/chat/')[1];

      // Second user searches by description term (not in room name)
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Desc Searcher', id2);

      // Open Browse modal
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();

      // Search using the unique description term (not in room name)
      await page2.getByTestId('browse-rooms-search').fill(uniqueDescriptionTerm);

      // The room should appear in search results based on description match
      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });
      await expect(roomItem).toContainText(roomName);
      await expect(roomItem).toContainText(uniqueDescriptionTerm);

      // Clean up
      await context2.close();
    });

    test('public room appears in browse results', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Browse Visible ${id}`;
      const roomDescription = `Test room for browse visibility ${id}`;

      // First user creates a public room
      await createUserAndSignIn(page, 'Room Creator', id);
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.fill('[data-testid="create-room-description"]', roomDescription);
      await page.getByTestId('create-room-submit').click();

      // Wait for navigation to the newly created room (matches the slug pattern)
      await page.waitForURL(/\/chat\/browse-visible-/);

      // Get the room slug from URL for later assertion
      const url = page.url();
      const roomSlug = url.split('/chat/')[1];

      // Second user opens Browse modal and searches for the room
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Room Browser', id2);

      // Open Browse modal
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();

      // Search for the room by its unique name
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      // The room should appear in search results
      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });
      await expect(roomItem).toContainText(roomName);
      await expect(roomItem).toContainText(roomDescription);

      // Clean up
      await context2.close();
    });
  });

  test.describe('Joining Public Rooms', () => {
    test('user can join a public room from browse modal', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Joinable Room ${id}`;
      const roomDescription = `Test room for join flow ${id}`;

      // First user creates a public room
      await createUserAndSignIn(page, 'Room Owner', id);
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.fill('[data-testid="create-room-description"]', roomDescription);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\/joinable-room-/);

      // Get the room slug from URL
      const url = page.url();
      const roomSlug = url.split('/chat/')[1];

      // Second user joins the room via Browse modal
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Room Joiner', id2);

      // Open Browse modal
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();

      // Search for the room
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      // Wait for the room to appear in results
      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });

      // Click Join button
      const joinButton = page2.getByTestId(`browse-room-${roomSlug}-join`);
      await expect(joinButton).toBeVisible();
      await joinButton.click();

      // Should navigate to the room after joining
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });

      // Room header should show the room name
      await expect(page2.locator('h2').filter({ hasText: roomName })).toBeVisible();

      // Clean up
      await context2.close();
    });

    test('joined room appears in sidebar after joining', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Sidebar Join Room ${id}`;
      const roomDescription = `Test room for sidebar after join ${id}`;

      // First user creates a public room
      await createUserAndSignIn(page, 'Sidebar Room Owner', id);
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.fill('[data-testid="create-room-description"]', roomDescription);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\/sidebar-join-room-/);

      // Get the room slug from URL
      const url = page.url();
      const roomSlug = url.split('/chat/')[1];

      // Second user joins the room via Browse modal
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Sidebar Joiner', id2);

      // Open Browse modal
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();

      // Search for the room
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      // Wait for the room to appear in results
      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });

      // Click Join button
      const joinButton = page2.getByTestId(`browse-room-${roomSlug}-join`);
      await joinButton.click();

      // Should navigate to the room after joining
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });

      // Verify the room appears in the sidebar
      const sidebar = page2.getByTestId('room-sidebar');
      await expect(sidebar.getByText(roomName)).toBeVisible();

      // Clean up
      await context2.close();
    });

    test('browse modal shows Joined badge for member rooms', async ({ page }) => {
      const id = uniqueId();
      const roomName = `Badge Test Room ${id}`;
      const roomDescription = `Test room for joined badge ${id}`;

      // Create user and a room (user becomes a member automatically)
      await createUserAndSignIn(page, 'Badge Tester', id);
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.fill('[data-testid="create-room-description"]', roomDescription);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\/badge-test-room-/);

      // Get the room slug from URL
      const url = page.url();
      const roomSlug = url.split('/chat/')[1];

      // Open Browse modal and search for own room
      await page.click('button:has-text("Browse")');
      await expect(page.getByTestId('browse-rooms-modal')).toBeVisible();

      // Search for the room
      await page.getByTestId('browse-rooms-search').fill(roomName);

      // The room should appear in search results
      const roomItem = page.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });

      // Should show "Joined" badge instead of "Join" button
      const joinedBadge = page.getByTestId(`browse-room-${roomSlug}-joined`);
      await expect(joinedBadge).toBeVisible();
      await expect(joinedBadge).toHaveText('Joined');

      // Join button should NOT be visible
      const joinButton = page.getByTestId(`browse-room-${roomSlug}-join`);
      await expect(joinButton).not.toBeVisible();
    });

    test('cannot join a room user is already a member of', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Already Member Room ${id}`;
      const roomDescription = `Test room for already member check ${id}`;

      // First user creates a public room
      await createUserAndSignIn(page, 'Room Creator', id);
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.fill('[data-testid="create-room-description"]', roomDescription);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\/already-member-room-/);

      // Get the room slug from URL
      const url = page.url();
      const roomSlug = url.split('/chat/')[1];

      // Second user joins the room via Browse modal
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Room Joiner', id2);

      // Open Browse modal and join the room
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });

      // Click Join button
      const joinButton = page2.getByTestId(`browse-room-${roomSlug}-join`);
      await expect(joinButton).toBeVisible();
      await joinButton.click();

      // Should navigate to the room after joining
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });

      // Now open Browse modal again and search for the same room
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      // The room should appear but with Joined badge (not Join button)
      const roomItemAgain = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItemAgain).toBeVisible({ timeout: 10000 });

      // Should show "Joined" badge - user is already a member
      const joinedBadge = page2.getByTestId(`browse-room-${roomSlug}-joined`);
      await expect(joinedBadge).toBeVisible();
      await expect(joinedBadge).toHaveText('Joined');

      // Join button should NOT be visible - cannot join again
      const joinButtonAgain = page2.getByTestId(`browse-room-${roomSlug}-join`);
      await expect(joinButtonAgain).not.toBeVisible();

      // Clean up
      await context2.close();
    });

    test('room shows correct member count in browse', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Member Count Room ${id}`;
      const roomDescription = `Test room for member count ${id}`;

      // First user creates a public room (member 1)
      await createUserAndSignIn(page, 'Member Count Creator', id);
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.fill('[data-testid="create-room-description"]', roomDescription);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\/member-count-room-/);

      // Get the room slug from URL
      const url = page.url();
      const roomSlug = url.split('/chat/')[1];

      // Second user joins the room (member 2)
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Member Count Joiner', id2);

      // Open Browse modal and join the room
      await page2.click('button:has-text("Browse")');
      await expect(page2.getByTestId('browse-rooms-modal')).toBeVisible();
      await page2.getByTestId('browse-rooms-search').fill(roomName);

      const roomItem = page2.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem).toBeVisible({ timeout: 10000 });

      // Should initially show 1 member (the creator)
      const memberCount = page2.getByTestId(`browse-room-${roomSlug}-member-count`);
      await expect(memberCount).toHaveText('1 member');

      // Click Join button
      const joinButton = page2.getByTestId(`browse-room-${roomSlug}-join`);
      await joinButton.click();

      // Should navigate to the room after joining
      await expect(page2).toHaveURL(`/chat/${roomSlug}`, { timeout: 10000 });

      // Third user checks the member count
      const context3 = await browser.newContext();
      await setE2eCookie(context3);
      const page3 = await context3.newPage();
      const id3 = uniqueId();
      await createUserAndSignIn(page3, 'Member Count Checker', id3);

      // Open Browse modal and search for the room
      await page3.click('button:has-text("Browse")');
      await expect(page3.getByTestId('browse-rooms-modal')).toBeVisible();
      await page3.getByTestId('browse-rooms-search').fill(roomName);

      // The room should show 2 members now
      const roomItem3 = page3.getByTestId(`browse-room-${roomSlug}`);
      await expect(roomItem3).toBeVisible({ timeout: 10000 });

      const memberCount3 = page3.getByTestId(`browse-room-${roomSlug}-member-count`);
      await expect(memberCount3).toHaveText('2 members');

      // Clean up
      await context2.close();
      await context3.close();
    });
  });
});
