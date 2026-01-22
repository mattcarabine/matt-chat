import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  signOut,
} from './utils/helpers';

test.describe('Private Rooms', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Creating Private Rooms', () => {
    test('user can create a private room with the checkbox', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Private Room Creator', id);

      // Click Create button (from No Rooms Yet screen)
      await page.click('button:has-text("Create")');

      // Fill in room details
      await page.getByTestId('create-room-name').fill(`Private Room ${id}`);

      // Check the private room checkbox
      await page.getByTestId('create-room-private').check();

      // Submit
      await page.getByTestId('create-room-submit').click();

      // Should navigate to the new room
      await expect(page).toHaveURL(/\/chat\/private-room-/);

      // Room should show with lock icon in sidebar (check header in chat area)
      await expect(page.locator('h2:has-text("Private Room")')).toBeVisible();
    });

    test('private room does not appear in search results', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Room Creator', id);

      // Create a private room
      await page.click('button:has-text("Create")');
      await page.getByTestId('create-room-name').fill(`Secret Room ${id}`);
      await page.getByTestId('create-room-private').check();
      await page.getByTestId('create-room-submit').click();
      await expect(page).toHaveURL(/\/chat\/secret-room-/);

      // Sign out via dropdown
      await signOut(page);
      await expect(page).toHaveURL('/signin');

      // Create another user
      const id2 = uniqueId();
      await createUserAndSignIn(page, 'Searcher', id2);

      // Click Browse button (from No Rooms Yet screen)
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
      await page.click('button:has-text("Create")');
      await page.getByTestId('create-room-name').fill(`Invite Test ${id}`);
      await page.getByTestId('create-room-private').check();
      await page.getByTestId('create-room-submit').click();
      await expect(page).toHaveURL(/\/chat\/invite-test-/);

      // Create second user in a new context with unique name
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      const inviteeUserName = `Invitee ${id2}`;
      await createUserAndSignIn(page2, inviteeUserName, id2);

      // Back to first user - invite second user
      // Click "Invite Member" button (should be visible in presence list for private rooms)
      await page.click('button:has-text("Invite Member")');

      // Wait for modal to be visible
      await expect(page.getByTestId('invite-user-modal')).toBeVisible();

      // Search for the second user by their unique name
      await page.getByTestId('invite-user-search').fill(inviteeUserName);

      // Wait for search results and click invite (use first() in case multiple users match)
      const inviteButton = page.getByRole('button', { name: 'Invite', exact: true }).first();
      await expect(inviteButton).toBeVisible({ timeout: 15000 });
      await inviteButton.click();

      // Should show "Invited" status
      await expect(page.getByRole('button', { name: 'Invited', exact: true }).first()).toBeVisible({ timeout: 5000 });

      // Close modal
      await page.getByTestId('invite-modal-done').click();

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
      await page.click('button:has-text("Create")');
      await page.getByTestId('create-room-name').fill(`Decline Test ${id}`);
      await page.getByTestId('create-room-private').check();
      await page.getByTestId('create-room-submit').click();

      // Create second user with unique name
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      const declinerUserName = `Decliner ${id2}`;
      await createUserAndSignIn(page2, declinerUserName, id2);

      // Invite second user
      await page.click('button:has-text("Invite Member")');
      await expect(page.getByTestId('invite-user-modal')).toBeVisible();
      await page.getByTestId('invite-user-search').fill(declinerUserName);
      const inviteButton = page.getByRole('button', { name: 'Invite', exact: true }).first();
      await expect(inviteButton).toBeVisible({ timeout: 15000 });
      await inviteButton.click();
      await page.getByTestId('invite-modal-done').click();

      // Second user declines
      await page2.click('text=Invitations');
      await expect(page2.locator(`text=Decline Test ${id}`)).toBeVisible();
      await page2.getByTestId('invitation-decline-button').click();

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
      await page.click('button:has-text("Create")');
      await page.getByTestId('create-room-name').fill(`Badge Test ${id}`);
      await page.getByTestId('create-room-private').check();
      await page.getByTestId('create-room-submit').click();

      // Create second user with unique name
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      const badgeUserName = `Badge ${id2}`;
      await createUserAndSignIn(page2, badgeUserName, id2);

      // Invite second user
      await page.click('button:has-text("Invite Member")');
      await expect(page.getByTestId('invite-user-modal')).toBeVisible();
      await page.getByTestId('invite-user-search').fill(badgeUserName);
      const inviteButton = page.getByRole('button', { name: 'Invite', exact: true }).first();
      await expect(inviteButton).toBeVisible({ timeout: 15000 });
      await inviteButton.click();
      await page.getByTestId('invite-modal-done').click();

      // Second user should see badge in navigation
      // Reload the page to force a fresh fetch of invitation count
      await page2.reload();
      await expect(page2).toHaveURL(/\/chat/);

      // Wait for the badge to appear (invitation count fetched when NavBar mounts)
      await expect(page2.getByTestId('invitation-count-badge')).toContainText('1', { timeout: 15000 });

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
