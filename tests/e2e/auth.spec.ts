import { test, expect, Page } from '@playwright/test';

// Generate unique identifiers for each test run
const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Helper to sign out via dropdown menu
async function signOut(page: Page) {
  await page.getByTestId('user-menu-button').click();
  await page.getByTestId('signout-button').click();
}

test.describe('Authentication Flow', () => {
  // Set e2e_mode cookie so backend includes test users in member lists
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

  test.describe('Sign Up', () => {
    test('allows user to create an account and redirects to chat', async ({ page }) => {
      const id = uniqueId();

      await page.goto('/signup');

      // Fill out the form
      await page.getByTestId('signup-fullname').fill('Test User');
      await page.getByTestId('signup-username').fill(`testuser${id}`);
      await page.getByTestId('signup-email').fill(`test${id}@e2e-test.local`);
      await page.getByTestId('signup-password').fill('password123');

      // Submit
      await page.getByTestId('signup-submit').click();

      // Should redirect to chat (landing-zone is the default room for new users)
      await expect(page).toHaveURL(/\/chat\/landing-zone/);
    });

    test('shows validation errors for invalid input', async ({ page }) => {
      await page.goto('/signup');

      // Fill with data that passes HTML5 validation but fails Zod validation
      await page.getByTestId('signup-fullname').fill('Test');
      await page.getByTestId('signup-username').fill('ab'); // Too short (min 3)
      await page.getByTestId('signup-email').fill('test@e2e-test.local');
      await page.getByTestId('signup-password').fill('short'); // Too short (min 8)

      // Submit
      await page.getByTestId('signup-submit').click();

      // Should stay on signup page
      await expect(page).toHaveURL('/signup');

      // Should show Zod validation error messages
      await expect(page.locator('text=Username must be at least 3 characters')).toBeVisible();
    });

    test('shows error for duplicate email', async ({ page }) => {
      const id = uniqueId();
      const email = `duplicate${id}@e2e-test.local`;

      // First signup
      await page.goto('/signup');
      await page.getByTestId('signup-fullname').fill('First User');
      await page.getByTestId('signup-username').fill(`first${id}`);
      await page.getByTestId('signup-email').fill(email);
      await page.getByTestId('signup-password').fill('password123');
      await page.getByTestId('signup-submit').click();
      await expect(page).toHaveURL(/\/chat\//);

      // Sign out via dropdown
      await signOut(page);
      await expect(page).toHaveURL('/signin');

      // Try to signup with same email
      await page.goto('/signup');
      await page.getByTestId('signup-fullname').fill('Second User');
      await page.getByTestId('signup-username').fill(`second${id}`);
      await page.getByTestId('signup-email').fill(email);
      await page.getByTestId('signup-password').fill('password123');
      await page.getByTestId('signup-submit').click();

      // Should show error
      await expect(page.locator('.error-banner')).toBeVisible();
    });

    test('shows error for duplicate username (case-insensitive)', async ({ page }) => {
      const id = uniqueId();
      const username = `TestUser${id}`;

      // First signup
      await page.goto('/signup');
      await page.getByTestId('signup-fullname').fill('First User');
      await page.getByTestId('signup-username').fill(username);
      await page.getByTestId('signup-email').fill(`first${id}@e2e-test.local`);
      await page.getByTestId('signup-password').fill('password123');
      await page.getByTestId('signup-submit').click();
      await expect(page).toHaveURL(/\/chat\//);

      // Sign out via dropdown
      await signOut(page);
      await expect(page).toHaveURL('/signin');

      // Try to signup with same username (different case)
      await page.goto('/signup');
      await page.getByTestId('signup-fullname').fill('Second User');
      await page.getByTestId('signup-username').fill(username.toLowerCase());
      await page.getByTestId('signup-email').fill(`second${id}@e2e-test.local`);
      await page.getByTestId('signup-password').fill('password123');
      await page.getByTestId('signup-submit').click();

      // Should show error
      await expect(page.locator('.error-banner')).toBeVisible();
    });
  });

  test.describe('Sign In', () => {
    test('allows user to sign in with username', async ({ page }) => {
      const id = uniqueId();
      const username = `user${id}`;

      // First create an account
      await page.goto('/signup');
      await page.getByTestId('signup-fullname').fill('Username Test');
      await page.getByTestId('signup-username').fill(username);
      await page.getByTestId('signup-email').fill(`${username}@e2e-test.local`);
      await page.getByTestId('signup-password').fill('password123');
      await page.getByTestId('signup-submit').click();
      await expect(page).toHaveURL(/\/chat\//);

      // Sign out via dropdown
      await signOut(page);
      await expect(page).toHaveURL('/signin');

      // Sign in with username
      await page.getByTestId('signin-login').fill(username);
      await page.getByTestId('signin-password').fill('password123');
      await page.getByTestId('signin-submit').click();

      // Should redirect to chat
      await expect(page).toHaveURL(/\/chat\//);
    });

    test('allows user to sign in with email', async ({ page }) => {
      const id = uniqueId();
      const email = `emailtest${id}@e2e-test.local`;

      // First create an account
      await page.goto('/signup');
      await page.getByTestId('signup-fullname').fill('Email Test');
      await page.getByTestId('signup-username').fill(`emailuser${id}`);
      await page.getByTestId('signup-email').fill(email);
      await page.getByTestId('signup-password').fill('password123');
      await page.getByTestId('signup-submit').click();
      await expect(page).toHaveURL(/\/chat\//);

      // Sign out via dropdown
      await signOut(page);
      await expect(page).toHaveURL('/signin');

      // Sign in with email
      await page.getByTestId('signin-login').fill(email);
      await page.getByTestId('signin-password').fill('password123');
      await page.getByTestId('signin-submit').click();

      // Should redirect to chat
      await expect(page).toHaveURL(/\/chat\//);
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/signin');

      await page.getByTestId('signin-login').fill('nonexistent');
      await page.getByTestId('signin-password').fill('wrongpassword');
      await page.getByTestId('signin-submit').click();

      // Should show error
      await expect(page.locator('.error-banner')).toBeVisible();

      // Should stay on signin page
      await expect(page).toHaveURL('/signin');
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects unauthenticated users from chat to signin', async ({ page }) => {
      await page.goto('/chat');

      // Should redirect to signin
      await expect(page).toHaveURL('/signin');
    });

    test('redirects authenticated users from signin to chat', async ({ page }) => {
      const id = uniqueId();

      // Create account and stay logged in
      await page.goto('/signup');
      await page.getByTestId('signup-fullname').fill('Redirect Test');
      await page.getByTestId('signup-username').fill(`redirect${id}`);
      await page.getByTestId('signup-email').fill(`redirect${id}@e2e-test.local`);
      await page.getByTestId('signup-password').fill('password123');
      await page.getByTestId('signup-submit').click();
      await expect(page).toHaveURL(/\/chat\//);

      // Try to visit signin
      await page.goto('/signin');

      // Should redirect back to chat
      await expect(page).toHaveURL(/\/chat\//);
    });
  });

  test.describe('Sign Out', () => {
    test('signs out user and redirects to signin', async ({ page }) => {
      const id = uniqueId();

      // Create account
      await page.goto('/signup');
      await page.getByTestId('signup-fullname').fill('Signout Test');
      await page.getByTestId('signup-username').fill(`signout${id}`);
      await page.getByTestId('signup-email').fill(`signout${id}@e2e-test.local`);
      await page.getByTestId('signup-password').fill('password123');
      await page.getByTestId('signup-submit').click();
      await expect(page).toHaveURL(/\/chat\//);

      // Sign out via dropdown
      await signOut(page);

      // Should redirect to signin
      await expect(page).toHaveURL('/signin');

      // Should not be able to access chat
      await page.goto('/chat');
      await expect(page).toHaveURL('/signin');
    });
  });
});
