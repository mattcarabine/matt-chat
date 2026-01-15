import { test, expect } from '@playwright/test';
import { uniqueId, setE2eCookie, createUserAndSignIn } from './utils/helpers';

test.describe('User Profile', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Navigation', () => {
    test('can navigate to profile page from user dropdown', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Profile Nav ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Open user dropdown
      await page.getByTestId('user-menu-button').click();

      // Click Profile link
      await page.getByTestId('user-dropdown-profile').click();

      // Verify navigation to profile page
      await expect(page).toHaveURL('/profile');

      // Verify profile page title is visible
      await expect(page.getByTestId('profile-page-title')).toHaveText('Profile');
    });
  });

  test.describe('Profile Display', () => {
    test('profile displays user full name', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Display Name ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Navigate to profile page
      await page.goto('/profile');

      // Verify full name is displayed in header
      await expect(page.getByTestId('profile-display-name')).toHaveText(fullName);

      // Verify full name is also displayed in the input field
      await expect(page.getByTestId('profile-field-full-name')).toHaveValue(fullName);
    });

    test('profile displays user username', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Username Display ${id}`;
      const expectedUsername = `user${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Navigate to profile page
      await page.goto('/profile');

      // Verify username is displayed in header with @ prefix
      await expect(page.getByTestId('profile-display-username')).toHaveText(`@${expectedUsername}`);

      // Verify username is also displayed in the input field with @ prefix
      await expect(page.getByTestId('profile-field-username')).toHaveValue(`@${expectedUsername}`);
    });

    test('profile displays user email', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Email Display ${id}`;
      const expectedEmail = `user${id}@e2e-test.local`;

      await createUserAndSignIn(page, fullName, id);

      // Navigate to profile page
      await page.goto('/profile');

      // Verify email is displayed in the input field
      await expect(page.getByTestId('profile-field-email-address')).toHaveValue(expectedEmail);
    });
  });

  test.describe('Settings Tab', () => {
    test('settings tab shows display name preference', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Settings Display ${id}`;
      const username = `user${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Navigate to settings tab
      await page.goto('/profile?tab=settings');

      // Verify settings tab content is visible
      await expect(page.getByTestId('settings-tab-content')).toBeVisible();

      // Verify display name section is present
      await expect(page.getByTestId('settings-display-name-section')).toBeVisible();
      await expect(page.getByTestId('settings-display-name-heading')).toHaveText('Display Name');

      // Verify both display name options are visible
      await expect(page.getByTestId('settings-display-name-fullname')).toBeVisible();
      await expect(page.getByTestId('settings-display-name-username')).toBeVisible();

      // Verify full name option shows the user's full name
      await expect(page.getByTestId('settings-display-name-fullname')).toContainText('Full name');
      await expect(page.getByTestId('settings-display-name-fullname')).toContainText(`Display as "${fullName}"`);

      // Verify username option shows the user's username
      await expect(page.getByTestId('settings-display-name-username')).toContainText('Username');
      await expect(page.getByTestId('settings-display-name-username')).toContainText(`Display as "@${username}"`);

      // Verify full name is selected by default
      await expect(page.getByTestId('settings-display-name-fullname-input')).toBeChecked();
      await expect(page.getByTestId('settings-display-name-username-input')).not.toBeChecked();
    });

    test('can change display name preference to username', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Change Pref ${id}`;
      const username = `user${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Navigate to settings tab
      await page.goto('/profile?tab=settings');

      // Verify full name is selected by default
      await expect(page.getByTestId('settings-display-name-fullname-input')).toBeChecked();
      await expect(page.getByTestId('settings-display-name-username-input')).not.toBeChecked();

      // Click the username option to change preference
      await page.getByTestId('settings-display-name-username').click();

      // Verify username option is now selected
      await expect(page.getByTestId('settings-display-name-username-input')).toBeChecked();
      await expect(page.getByTestId('settings-display-name-fullname-input')).not.toBeChecked();

      // Refresh the page to verify persistence
      await page.reload();

      // Wait for settings content to load
      await expect(page.getByTestId('settings-tab-content')).toBeVisible();

      // Verify username preference persisted after refresh
      await expect(page.getByTestId('settings-display-name-username-input')).toBeChecked();
      await expect(page.getByTestId('settings-display-name-fullname-input')).not.toBeChecked();
    });

    test('display name change reflects in chat messages', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Display Chat ${id}`;
      const username = `user${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Create a room and send a message with default full name preference
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', `FullName Room ${id}`);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\//);

      // Send a message - should display full name by default
      const fullNameMessage = `FullName msg ${id}`;
      const input1 = page.getByTestId('message-input');
      await input1.click();
      await input1.pressSequentially(fullNameMessage, { delay: 10 });
      await expect(page.getByTestId('message-send-button')).toBeEnabled({ timeout: 10000 });
      await page.getByTestId('message-send-button').click();

      // Wait for message to appear and verify sender shows full name
      const fullNameMsgItem = page.getByTestId('message-item').filter({ hasText: fullNameMessage });
      await expect(fullNameMsgItem).toBeVisible({ timeout: 15000 });
      await expect(fullNameMsgItem.getByTestId('message-sender')).toHaveText(fullName);

      // Navigate to settings and change display name preference to username
      await page.goto('/profile?tab=settings');
      await expect(page.getByTestId('settings-tab-content')).toBeVisible();
      await page.getByTestId('settings-display-name-username').click();
      await expect(page.getByTestId('settings-display-name-username-input')).toBeChecked();

      // Navigate to chat to create a NEW room to test the updated preference
      // (new room ensures fresh message group, avoiding grouping with previous messages)
      await page.goto('/chat');
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', `Username Room ${id}`);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\//);

      // Wait for message list to be ready before sending
      await expect(page.getByTestId('message-list').or(page.getByTestId('message-list-empty'))).toBeVisible({ timeout: 15000 });

      // Send a message - should now display username with @ prefix
      const usernameMessage = `Username msg ${id}`;
      const input2 = page.getByTestId('message-input');
      await input2.click();
      await input2.pressSequentially(usernameMessage, { delay: 10 });
      await expect(page.getByTestId('message-send-button')).toBeEnabled({ timeout: 10000 });
      await page.getByTestId('message-send-button').click();

      // Wait for message to appear and verify sender shows username (without @ prefix)
      // Note: The backend returns the raw username, the @ prefix is only shown in the settings UI
      const usernameMsgItem = page.getByTestId('message-item').filter({ hasText: usernameMessage });
      await expect(usernameMsgItem).toBeVisible({ timeout: 15000 });
      await expect(usernameMsgItem.getByTestId('message-sender')).toHaveText(username);
    });
  });

  test.describe('Theme Settings', () => {
    test('theme toggle switches between light/dark/system', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Theme Toggle ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Navigate to settings tab
      await page.goto('/profile?tab=settings');
      await expect(page.getByTestId('settings-tab-content')).toBeVisible();

      // Verify theme options are visible
      await expect(page.getByTestId('settings-theme-options')).toBeVisible();
      await expect(page.getByTestId('settings-theme-light')).toBeVisible();
      await expect(page.getByTestId('settings-theme-dark')).toBeVisible();
      await expect(page.getByTestId('settings-theme-system')).toBeVisible();

      // Verify system is selected by default
      await expect(page.getByTestId('settings-theme-system-input')).toBeChecked();
      await expect(page.getByTestId('settings-theme-light-input')).not.toBeChecked();
      await expect(page.getByTestId('settings-theme-dark-input')).not.toBeChecked();

      // Switch to light theme
      await page.getByTestId('settings-theme-light').click();
      await expect(page.getByTestId('settings-theme-light-input')).toBeChecked();
      await expect(page.getByTestId('settings-theme-system-input')).not.toBeChecked();
      // Verify document has light class
      await expect(page.locator('html')).toHaveClass(/light/);

      // Switch to dark theme
      await page.getByTestId('settings-theme-dark').click();
      await expect(page.getByTestId('settings-theme-dark-input')).toBeChecked();
      await expect(page.getByTestId('settings-theme-light-input')).not.toBeChecked();
      // Verify document has dark class
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Switch back to system theme
      await page.getByTestId('settings-theme-system').click();
      await expect(page.getByTestId('settings-theme-system-input')).toBeChecked();
      await expect(page.getByTestId('settings-theme-dark-input')).not.toBeChecked();
    });

    test('theme preference persists after page refresh', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Theme Persist ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Navigate to settings tab
      await page.goto('/profile?tab=settings');
      await expect(page.getByTestId('settings-tab-content')).toBeVisible();

      // Verify system is selected by default
      await expect(page.getByTestId('settings-theme-system-input')).toBeChecked();

      // Switch to dark theme
      await page.getByTestId('settings-theme-dark').click();
      await expect(page.getByTestId('settings-theme-dark-input')).toBeChecked();
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Refresh the page
      await page.reload();

      // Wait for settings content to load
      await expect(page.getByTestId('settings-tab-content')).toBeVisible();

      // Verify dark theme persisted after refresh
      await expect(page.getByTestId('settings-theme-dark-input')).toBeChecked();
      await expect(page.getByTestId('settings-theme-system-input')).not.toBeChecked();
      await expect(page.getByTestId('settings-theme-light-input')).not.toBeChecked();
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Also test switching to light and verify persistence
      await page.getByTestId('settings-theme-light').click();
      await expect(page.getByTestId('settings-theme-light-input')).toBeChecked();
      await expect(page.locator('html')).toHaveClass(/light/);

      // Refresh again
      await page.reload();
      await expect(page.getByTestId('settings-tab-content')).toBeVisible();

      // Verify light theme persisted
      await expect(page.getByTestId('settings-theme-light-input')).toBeChecked();
      await expect(page.locator('html')).toHaveClass(/light/);
    });
  });

  test.describe('Tab Navigation', () => {
    test('can switch between Profile and Settings tabs', async ({ page }) => {
      const id = uniqueId();
      const fullName = `Tab Switch ${id}`;

      await createUserAndSignIn(page, fullName, id);

      // Navigate to profile page
      await page.goto('/profile');

      // Verify Profile tab is active by default
      await expect(page.getByTestId('profile-tab-content')).toBeVisible();
      await expect(page.getByTestId('settings-tab-content')).not.toBeVisible();
      await expect(page.getByTestId('profile-page-title')).toHaveText('Profile');

      // Click Settings tab
      await page.getByTestId('profile-tab-settings').click();

      // Verify Settings tab is now active
      await expect(page.getByTestId('settings-tab-content')).toBeVisible();
      await expect(page.getByTestId('profile-tab-content')).not.toBeVisible();
      await expect(page.getByTestId('profile-page-title')).toHaveText('Settings');
      await expect(page).toHaveURL(/\?tab=settings/);

      // Click Profile tab to switch back
      await page.getByTestId('profile-tab-profile').click();

      // Verify Profile tab is active again
      await expect(page.getByTestId('profile-tab-content')).toBeVisible();
      await expect(page.getByTestId('settings-tab-content')).not.toBeVisible();
      await expect(page.getByTestId('profile-page-title')).toHaveText('Profile');
      // Profile tab doesn't add query param, so URL should be clean
      await expect(page).toHaveURL('/profile');
    });
  });
});
