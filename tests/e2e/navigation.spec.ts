import { test, expect } from '@playwright/test';
import { uniqueId, setE2eCookie, createUserAndSignIn } from './utils/helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('User Dropdown', () => {
    test('user dropdown shows user name and email', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Nav Dropdown ${id}`;
      const expectedEmail = `user${id}@e2e-test.local`;

      await createUserAndSignIn(page, fullName, id);

      // Open user dropdown
      await page.getByTestId('user-menu-button').click();

      // Verify user info section is visible
      await expect(page.getByTestId('user-dropdown-info')).toBeVisible();

      // Verify user name is displayed
      await expect(page.getByTestId('user-dropdown-name')).toHaveText(fullName);

      // Verify user email is displayed
      await expect(page.getByTestId('user-dropdown-email')).toHaveText(expectedEmail);
    });

    test('user dropdown has working profile link', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Nav Profile ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Open user dropdown
      await page.getByTestId('user-menu-button').click();

      // Click profile link
      await page.getByTestId('user-dropdown-profile').click();

      // Verify navigation to profile page
      await expect(page).toHaveURL('/profile');

      // Verify profile page loaded (page title visible)
      await expect(page.getByTestId('profile-page-title')).toBeVisible();
    });

    test('user dropdown has working settings link', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Nav Settings ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Open user dropdown
      await page.getByTestId('user-menu-button').click();

      // Click settings link
      await page.getByTestId('user-dropdown-settings').click();

      // Verify navigation to profile page with settings tab
      await expect(page).toHaveURL('/profile?tab=settings');

      // Verify settings tab content is visible
      await expect(page.getByTestId('settings-tab-content')).toBeVisible();

      // Verify page title shows Settings
      await expect(page.getByTestId('profile-page-title')).toHaveText('Settings');
    });

    test('user dropdown has working signout button', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Nav Signout ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Open user dropdown
      await page.getByTestId('user-menu-button').click();

      // Click sign out button
      await page.getByTestId('signout-button').click();

      // Verify redirect to signin page
      await expect(page).toHaveURL('/signin');

      // Verify we're actually logged out by checking for signin form
      await expect(page.getByTestId('signin-submit')).toBeVisible();
    });
  });

  test.describe('Connection Status', () => {
    test('connection status indicator shows connected state', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Nav Connection ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Wait for chat to load and connection to be established
      await expect(page.getByTestId('room-sidebar')).toBeVisible();

      // Verify connection status indicator is visible and shows connected state
      const connectionStatus = page.getByTestId('connection-status');
      await expect(connectionStatus).toBeVisible();
      await expect(connectionStatus).toHaveAttribute('data-status', 'connected');
      await expect(connectionStatus).toHaveText('Connected');
    });
  });

  test.describe('Sidebar', () => {
    test('sidebar highlights current room', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Nav Sidebar ${id}`;
      const newRoomName = `Sidebar Test ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Wait for sidebar to load
      await expect(page.getByTestId('room-sidebar')).toBeVisible();

      // Get the current URL to extract the default room slug
      const initialUrl = page.url();
      const defaultRoomSlug = initialUrl.split('/chat/')[1];

      // Verify the default room is highlighted (data-active="true")
      const defaultRoomItem = page.getByTestId(`room-item-${defaultRoomSlug}`);
      await expect(defaultRoomItem).toHaveAttribute('data-active', 'true');

      // Create a new room
      await page.click('button:has-text("Create")');
      await page.fill('input#room-name', newRoomName);
      await page.click('button:has-text("Create Room")');

      // Wait for navigation to new room
      await expect(page).toHaveURL(/\/chat\/sidebar-test-/);

      // Extract new room slug
      const newUrl = page.url();
      const newRoomSlug = newUrl.split('/chat/')[1];

      // Verify the new room is now highlighted
      const newRoomItem = page.getByTestId(`room-item-${newRoomSlug}`);
      await expect(newRoomItem).toHaveAttribute('data-active', 'true');

      // Verify the default room is no longer highlighted
      await expect(defaultRoomItem).toHaveAttribute('data-active', 'false');

      // Click on the default room to navigate back
      await defaultRoomItem.click();

      // Verify URL changed back to default room
      await expect(page).toHaveURL(`/chat/${defaultRoomSlug}`);

      // Verify highlight moved back to default room
      await expect(defaultRoomItem).toHaveAttribute('data-active', 'true');
      await expect(newRoomItem).toHaveAttribute('data-active', 'false');
    });
  });
});
