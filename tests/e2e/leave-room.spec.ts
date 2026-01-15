import { test, expect, Page } from '@playwright/test';

// Generate unique identifiers for each test run
const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Helper to create a user and navigate to chat
async function createUserAndSignIn(page: Page, name: string, id: string) {
  await page.goto('/signup');
  await page.getByTestId('signup-fullname').fill(name);
  await page.getByTestId('signup-username').fill(`user${id}`);
  await page.getByTestId('signup-email').fill(`user${id}@e2e-test.local`);
  await page.getByTestId('signup-password').fill('password123');
  await page.getByTestId('signup-submit').click();
  await expect(page).toHaveURL(/\/chat\//);
}

// Helper to create a room
async function createRoom(page: Page, roomName: string, isPrivate = false) {
  await page.click('button:has-text("Create")');
  await page.fill('input#room-name', roomName);
  if (isPrivate) {
    await page.check('input[type="checkbox"]');
  }
  await page.click('button:has-text("Create Room")');
  // Wait for navigation to the new room
  await page.waitForURL(/\/chat\//);
}

test.describe('Leave Room', () => {
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

  test.describe('Room Menu Dropdown', () => {
    test('room menu button is visible in chat header', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Menu Test User', id);

      // Should be in chat with room menu visible
      await expect(page.getByTestId('room-menu-button')).toBeVisible();
    });

    test('clicking room menu shows dropdown with Leave Room option', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Dropdown Test User', id);

      // Click room menu
      await page.getByTestId('room-menu-button').click();

      // Should show Leave Room in dropdown
      await expect(page.locator('text=Leave Room')).toBeVisible();
    });

    test('Leave Room is available for any room including default room', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Default Room Test', id);

      // Should be in Landing Zone (default room)
      await expect(page).toHaveURL(/\/chat\/landing-zone/);

      // Click room menu
      await page.getByTestId('room-menu-button').click();

      // Should show enabled Leave Room button (no longer disabled for default rooms)
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

      // Create a new room
      const roomName = `Leave Flow Test ${id}`;
      await createRoom(page, roomName);

      // Verify we're in the new room and it's in the sidebar
      await expect(page.getByRole('heading', { name: roomName })).toBeVisible();
      await expect(page.locator(`a[href*="/chat/leave-flow-test-"]`)).toBeVisible();

      // Leave the room
      await page.getByTestId('room-menu-button').click();
      await page.getByTestId('leave-room-button').click();
      await page.getByTestId('leave-room-confirm').click();

      // Should be redirected to Landing Zone and room removed from sidebar
      await expect(page).toHaveURL(/\/chat\/landing-zone/);
      await expect(page.locator(`a[href*="/chat/leave-flow-test-"]`)).not.toBeVisible();
    });

    test('user can leave the default room', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'Leave Default User', id);

      // Should be in Landing Zone (default room)
      await expect(page).toHaveURL(/\/chat\/landing-zone/);

      // Create another room first so we have somewhere to go
      await createRoom(page, `Fallback Room ${id}`);

      // Navigate back to Landing Zone
      await page.click(`a[href*="/chat/landing-zone"]`);
      await expect(page).toHaveURL(/\/chat\/landing-zone/);

      // Leave the default room
      await page.getByTestId('room-menu-button').click();
      await page.getByTestId('leave-room-button').click();
      await page.getByTestId('leave-room-confirm').click();

      // Should be redirected to the fallback room with Landing Zone removed from sidebar
      await expect(page).toHaveURL(/\/chat\/fallback-room-/);
      await expect(page.locator(`a[href*="/chat/landing-zone"]`)).not.toBeVisible();
    });

    test('leaving all rooms shows No Rooms Yet screen', async ({ page }) => {
      const id = uniqueId();
      await createUserAndSignIn(page, 'No Rooms User', id);

      // Should be in Landing Zone (default room)
      await expect(page).toHaveURL(/\/chat\/landing-zone/);

      // Leave the default room (user's only room)
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

      // Create a private room
      const roomName = `Leave Private Test ${id}`;
      await createRoom(page, roomName, true);
      await page.waitForURL(/\/chat\/leave-private-test-/);

      // Leave the room
      await page.getByTestId('room-menu-button').click();
      await page.getByTestId('leave-room-button').click();
      await page.getByTestId('leave-room-confirm').click();

      // Should be redirected and room removed from sidebar
      await expect(page).toHaveURL(/\/chat\/landing-zone/);
      await expect(page.locator('nav').getByText(roomName)).not.toBeVisible();
    });
  });
});
