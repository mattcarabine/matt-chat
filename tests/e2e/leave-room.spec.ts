import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
} from './utils/helpers';

test.describe('Leave Room', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Room Menu Dropdown', () => {
    test('room menu button is visible in chat header', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Menu Test User', id);
      await createRoom(page, `Menu Test Room ${id}`);

      // Should be in chat with room menu visible
      await expect(page.getByTestId('room-menu-button')).toBeVisible();
    });

    test('clicking room menu shows dropdown with Leave Room option', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Dropdown Test User', id);
      await createRoom(page, `Dropdown Test Room ${id}`);

      // Click room menu
      await page.getByTestId('room-menu-button').click();

      // Should show Leave Room in dropdown
      await expect(page.locator('text=Leave Room')).toBeVisible();
    });

    test('Leave Room is available for any room', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Any Room Test', id);
      await createRoom(page, `Any Room Test ${id}`);

      // Click room menu
      await page.getByTestId('room-menu-button').click();

      // Should show enabled Leave Room button
      await expect(page.getByTestId('leave-room-button')).toBeVisible();
    });
  });

  test.describe('Leave Room Modal', () => {
    test('clicking Leave Room shows confirmation modal', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Modal Test User', id);

      // Create a new room
      const roomName = `Leave Modal Test ${id}`;
      await createRoom(page, roomName);

      // Click room menu and then Leave Room
      await page.getByTestId('room-menu-button').click();
      await page.getByTestId('leave-room-button').click();

      // Should show confirmation modal with room name (use heading to be specific)
      await expect(page.getByRole('heading', { name: 'Leave Room' })).toBeVisible();
      // Room name appears in the modal body as a span
      await expect(page.locator('.font-medium:has-text("' + roomName + '")')).toBeVisible();

      // Should have Cancel and Leave Room buttons
      await expect(page.getByTestId('leave-room-cancel')).toBeVisible();
      await expect(page.getByTestId('leave-room-confirm')).toBeVisible();
    });

    test('clicking Cancel closes the modal without leaving', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Cancel Test User', id);

      // Create a new room
      const roomName = `Cancel Test ${id}`;
      await createRoom(page, roomName);

      // Wait for navigation to complete and get the URL
      await page.waitForURL(/\/chat\/cancel-test-/);
      const roomUrl = page.url();

      // Click room menu and then Leave Room
      await page.getByTestId('room-menu-button').click();
      await page.getByTestId('leave-room-button').click();

      // Click Cancel
      await page.getByTestId('leave-room-cancel').click();

      // Modal should close
      await expect(page.getByRole('heading', { name: 'Leave Room' })).not.toBeVisible();

      // Should still be in the same room
      await expect(page).toHaveURL(roomUrl);
    });
  });

  test.describe('Leave Room Flow', () => {
    test('leaving a room redirects to another room and removes it from sidebar', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Leave Flow User', id);

      // Create two rooms so we have somewhere to go after leaving one
      await createRoom(page, `Fallback Room ${id}`);
      const roomName = `Leave Flow Test ${id}`;
      await createRoom(page, roomName);

      // Verify we're in the new room and it's in the sidebar
      await expect(page.getByRole('heading', { name: roomName })).toBeVisible();
      await expect(page.locator(`a[href*="/chat/leave-flow-test-"]`)).toBeVisible();

      // Leave the room
      await page.getByTestId('room-menu-button').click();
      await page.getByTestId('leave-room-button').click();
      await page.getByTestId('leave-room-confirm').click();

      // Should be redirected to the fallback room and leave-flow-test room removed from sidebar
      await expect(page).toHaveURL(/\/chat\/fallback-room-/);
      await expect(page.locator(`a[href*="/chat/leave-flow-test-"]`)).not.toBeVisible();
    });

    test('leaving one room and then leaving another shows navigation to remaining room', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Leave Multi User', id);

      // Create two rooms
      const room1Name = `First Room ${id}`;
      const room2Name = `Second Room ${id}`;
      await createRoom(page, room1Name);
      await createRoom(page, room2Name);

      // We should be in the second room
      await expect(page.getByRole('heading', { name: room2Name })).toBeVisible();

      // Leave the second room
      await page.getByTestId('room-menu-button').click();
      await page.getByTestId('leave-room-button').click();
      await page.getByTestId('leave-room-confirm').click();

      // Should be redirected to the first room
      await expect(page).toHaveURL(/\/chat\/first-room-/);
      await expect(page.getByRole('heading', { name: room1Name })).toBeVisible();
    });

    test('leaving all rooms shows No Rooms Yet screen', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'No Rooms User', id);

      // Create a single room
      const roomName = `Only Room ${id}`;
      await createRoom(page, roomName);
      await expect(page).toHaveURL(/\/chat\/only-room-/);

      // Leave the only room
      await page.getByTestId('room-menu-button').click();
      await page.getByTestId('leave-room-button').click();
      await page.getByTestId('leave-room-confirm').click();

      // Should be redirected to /chat (no room slug)
      await expect(page).toHaveURL(/\/chat$/);

      // Should show "No Rooms Yet" message
      await expect(page.getByRole('heading', { name: 'No Rooms Yet' })).toBeVisible();
      await expect(page.getByText('Create a room or browse existing ones to get started')).toBeVisible();

      // Should show Create Room and Browse Rooms buttons
      await expect(page.getByRole('button', { name: 'Create Room' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Browse Rooms' })).toBeVisible();
    });
  });

  test.describe('Private Room Leave', () => {
    test('dropdown shows both Invite Member and Leave Room for private rooms', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Private Menu User', id);

      // Create a private room
      await createRoom(page, `Private Menu Test ${id}`, true);

      // Click room menu
      await page.getByTestId('room-menu-button').click();

      // Should show both options
      await expect(page.locator('text=Invite Member')).toBeVisible();
      await expect(page.getByTestId('leave-room-button')).toBeVisible();
    });

    test('user can leave a private room', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Leave Private User', id);

      // Create a private room (this will be the user's only room)
      const roomName = `Leave Private Test ${id}`;
      await createRoom(page, roomName, true);
      await page.waitForURL(/\/chat\/leave-private-test-/);

      // Leave the room
      await page.getByTestId('room-menu-button').click();
      await page.getByTestId('leave-room-button').click();
      await page.getByTestId('leave-room-confirm').click();

      // Should be redirected to /chat (no rooms left) and room removed from sidebar
      await expect(page).toHaveURL(/\/chat$/);
      await expect(page.locator('nav').getByText(roomName)).not.toBeVisible();
    });
  });
});
