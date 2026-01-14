import { test, expect } from '@playwright/test';

// Generate unique identifiers for each test run
const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Helper to create a user and navigate to chat
async function createUserAndSignIn(page: any, name: string, id: string) {
  await page.goto('/signup');
  await page.getByTestId('signup-fullname').fill(name);
  await page.getByTestId('signup-username').fill(`user${id}`);
  await page.getByTestId('signup-email').fill(`user${id}@e2e-test.local`);
  await page.getByTestId('signup-password').fill('password123');
  await page.getByTestId('signup-submit').click();
  await expect(page).toHaveURL('/dashboard');
}

test.describe('Private Rooms', () => {
  // Set e2e_mode cookie so backend includes test users
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'e2e_mode',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test.describe('Creating Private Rooms', () => {
    test('user can create a private room with the checkbox', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Private Room Creator', id);

      // Navigate to chat
      await page.click('text=Chat');
      await expect(page).toHaveURL(/\/chat\//);

      // Click Create button
      await page.click('button:has-text("Create")');

      // Fill in room details
      await page.fill('input#room-name', `Private Room ${id}`);
      await page.fill('textarea#room-description', 'A private test room');

      // Check the private room checkbox
      await page.check('input[type="checkbox"]');

      // Submit
      await page.click('button:has-text("Create Room")');

      // Should navigate to the new room
      await expect(page).toHaveURL(/\/chat\/private-room-/);

      // Room should show with lock icon in sidebar (we can check for the room name)
      await expect(page.locator('text=Private Room')).toBeVisible();
    });

    test('private room does not appear in search results', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Room Creator', id);

      // Navigate to chat and create a private room
      await page.click('text=Chat');
      await page.click('button:has-text("Create")');
      await page.fill('input#room-name', `Secret Room ${id}`);
      await page.check('input[type="checkbox"]');
      await page.click('button:has-text("Create Room")');
      await expect(page).toHaveURL(/\/chat\/secret-room-/);

      // Sign out
      await page.click('[data-testid="signout-button"]');
      await expect(page).toHaveURL('/signin');

      // Create another user
      const id2 = uniqueId();
      await createUserAndSignIn(page, 'Searcher', id2);

      // Navigate to chat and browse rooms
      await page.click('text=Chat');
      await page.click('button:has-text("Browse")');

      // Search for the private room
      await page.fill('input[placeholder*="Search"]', `Secret Room ${id}`);

      // Wait for search results
      await page.waitForTimeout(500);

      // Should not find the private room
      await expect(page.locator(`text=Secret Room ${id}`)).not.toBeVisible();
    });
  });

  test.describe('Room Invitations', () => {
    test('room member can invite another user to a private room', async ({ page, browser }) => {
      const id = uniqueId();

      // Create first user and private room
      await createUserAndSignIn(page, 'Room Owner', id);
      await page.click('text=Chat');
      await page.click('button:has-text("Create")');
      await page.fill('input#room-name', `Invite Test ${id}`);
      await page.check('input[type="checkbox"]');
      await page.click('button:has-text("Create Room")');
      await expect(page).toHaveURL(/\/chat\/invite-test-/);

      // Create second user in a new context
      const context2 = await browser.newContext();
      await context2.addCookies([
        { name: 'e2e_mode', value: 'true', domain: 'localhost', path: '/' },
      ]);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Invitee User', id2);

      // Back to first user - invite second user
      // Click "Invite Member" button (should be visible in presence list for private rooms)
      await page.click('button:has-text("Invite Member")');

      // Search for the second user
      await page.fill('input[placeholder*="Search"]', `Invitee User`);

      // Wait for search results and click invite
      await page.waitForTimeout(500);
      await page.click('button:has-text("Invite")');

      // Should show "Invited" status
      await expect(page.locator('button:has-text("Invited")')).toBeVisible();

      // Close modal
      await page.click('button:has-text("Done")');

      // Second user should see invitation
      await page2.click('text=Invitations');
      await expect(page2).toHaveURL('/invitations');

      // Should see the invitation
      await expect(page2.locator(`text=Invite Test ${id}`)).toBeVisible();
      await expect(page2.locator('text=Room Owner')).toBeVisible();

      // Accept the invitation
      await page2.click('button:has-text("Accept")');

      // Should navigate to the room
      await expect(page2).toHaveURL(/\/chat\/invite-test-/);

      // Clean up
      await context2.close();
    });

    test('user can decline an invitation', async ({ page, browser }) => {
      const id = uniqueId();

      // Create first user and private room
      await createUserAndSignIn(page, 'Decliner Test Owner', id);
      await page.click('text=Chat');
      await page.click('button:has-text("Create")');
      await page.fill('input#room-name', `Decline Test ${id}`);
      await page.check('input[type="checkbox"]');
      await page.click('button:has-text("Create Room")');

      // Create second user
      const context2 = await browser.newContext();
      await context2.addCookies([
        { name: 'e2e_mode', value: 'true', domain: 'localhost', path: '/' },
      ]);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Decliner User', id2);

      // Invite second user
      await page.click('button:has-text("Invite Member")');
      await page.fill('input[placeholder*="Search"]', `Decliner User`);
      await page.waitForTimeout(500);
      await page.click('button:has-text("Invite")');
      await page.click('button:has-text("Done")');

      // Second user declines
      await page2.click('text=Invitations');
      await expect(page2.locator(`text=Decline Test ${id}`)).toBeVisible();
      await page2.click('button:has-text("Decline")');

      // Invitation should disappear
      await expect(page2.locator(`text=Decline Test ${id}`)).not.toBeVisible();

      // Should show empty state
      await expect(page2.locator('text=No pending invitations')).toBeVisible();

      await context2.close();
    });
  });

  test.describe('Navigation', () => {
    test('navigation badge shows invitation count', async ({ page, browser }) => {
      const id = uniqueId();

      // Create first user and private room
      await createUserAndSignIn(page, 'Badge Test Owner', id);
      await page.click('text=Chat');
      await page.click('button:has-text("Create")');
      await page.fill('input#room-name', `Badge Test ${id}`);
      await page.check('input[type="checkbox"]');
      await page.click('button:has-text("Create Room")');

      // Create second user
      const context2 = await browser.newContext();
      await context2.addCookies([
        { name: 'e2e_mode', value: 'true', domain: 'localhost', path: '/' },
      ]);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Badge User', id2);

      // Invite second user
      await page.click('button:has-text("Invite Member")');
      await page.fill('input[placeholder*="Search"]', `Badge User`);
      await page.waitForTimeout(500);
      await page.click('button:has-text("Invite")');
      await page.click('button:has-text("Done")');

      // Second user should see badge in navigation
      await page2.click('text=Chat');

      // Wait for polling to update the count (up to 30s)
      // The badge should show "1"
      await expect(page2.locator('text=Invitations').locator('xpath=following-sibling::span')).toContainText('1');

      await context2.close();
    });

    test('invitations page is accessible from navigation', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Nav Test User', id);

      // Click on Invitations in navigation
      await page.click('text=Invitations');

      // Should navigate to invitations page
      await expect(page).toHaveURL('/invitations');

      // Should show empty state
      await expect(page.locator('text=No pending invitations')).toBeVisible();
    });
  });
});
