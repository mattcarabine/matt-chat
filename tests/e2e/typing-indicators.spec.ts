import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  waitForMessageList,
} from './utils/helpers';

test.describe('Typing Indicators', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test('typing indicator appears when other user types', async ({ page, browser }) => {
    const id = uniqueId();
    const roomName = `Typing Test ${id}`;

    // Create first user (the typer) and a room
    await createUserAndSignIn(page, 'Typing User', id);
    const roomSlug = await createRoom(page, roomName);
    await waitForMessageList(page);

    // Create second user (the observer) in a new context
    const context2 = await browser.newContext();
    await setE2eCookie(context2);
    const page2 = await context2.newPage();
    const id2 = uniqueId();
    await createUserAndSignIn(page2, 'Observer User', id2);

    // Second user joins the same room via browse
    await page2.click('button:has-text("Browse")');
    await page2.fill('input[placeholder*="Search"]', roomName);
    // Wait for search results and click Join button
    const joinButton = page2.getByTestId(`browse-room-${roomSlug}-join`);
    await expect(joinButton).toBeVisible({ timeout: 10000 });
    await joinButton.click();
    await page2.waitForURL(new RegExp(`/chat/${roomSlug}`));
    await waitForMessageList(page2);

    // Verify no typing indicator initially on observer's page
    await expect(page2.getByTestId('typing-indicator-empty')).toBeVisible();
    await expect(page2.getByTestId('typing-indicator')).not.toBeVisible();

    // First user starts typing (type slowly to trigger typing events)
    const input = page.getByTestId('message-input');
    await input.click();
    await input.pressSequentially('Hello there', { delay: 50 });

    // Observer should see the typing indicator with the typer's name
    const typingIndicator = page2.getByTestId('typing-indicator');
    await expect(typingIndicator).toBeVisible({ timeout: 10000 });

    // Verify the typing text shows the correct user
    const typingText = page2.getByTestId('typing-indicator-text');
    await expect(typingText).toHaveText('Typing User is typing');

    // Verify the animated dots are visible
    await expect(page2.getByTestId('typing-indicator-dots')).toBeVisible();

    // Clean up
    await context2.close();
  });

  test('typing indicator disappears after user stops typing', async ({ page, browser }) => {
    const id = uniqueId();
    const roomName = `Typing Stop ${id}`;

    // Create first user (the typer) and a room
    await createUserAndSignIn(page, 'Typer Stop', id);
    const roomSlug = await createRoom(page, roomName);
    await waitForMessageList(page);

    // Create second user (the observer) in a new context
    const context2 = await browser.newContext();
    await setE2eCookie(context2);
    const page2 = await context2.newPage();
    const id2 = uniqueId();
    await createUserAndSignIn(page2, 'Observer Stop', id2);

    // Second user joins the same room via browse
    await page2.click('button:has-text("Browse")');
    await page2.fill('input[placeholder*="Search"]', roomName);
    const joinButton = page2.getByTestId(`browse-room-${roomSlug}-join`);
    await expect(joinButton).toBeVisible({ timeout: 10000 });
    await joinButton.click();
    await page2.waitForURL(new RegExp(`/chat/${roomSlug}`));
    await waitForMessageList(page2);

    // Verify no typing indicator initially
    await expect(page2.getByTestId('typing-indicator-empty')).toBeVisible();

    // First user starts typing
    const input = page.getByTestId('message-input');
    await input.click();
    await input.pressSequentially('Test message', { delay: 50 });

    // Observer sees the typing indicator appear
    const typingIndicator = page2.getByTestId('typing-indicator');
    await expect(typingIndicator).toBeVisible({ timeout: 10000 });
    await expect(page2.getByTestId('typing-indicator-text')).toHaveText('Typer Stop is typing');

    // First user stops typing (clears input and waits)
    await input.clear();

    // Observer should see the typing indicator disappear after timeout
    // Ably's default typing timeout is ~5 seconds
    await expect(page2.getByTestId('typing-indicator-empty')).toBeVisible({ timeout: 10000 });
    await expect(typingIndicator).not.toBeVisible();

    // Clean up
    await context2.close();
  });

  test('multiple users typing shows multiple indicators', async ({ page, browser }) => {
    const id = uniqueId();
    const roomName = `Multi Type ${id}`;

    // Create observer user and a room
    await createUserAndSignIn(page, 'Observer Multi', id);
    const roomSlug = await createRoom(page, roomName);
    await waitForMessageList(page);

    // Create second user (typer1) in a new context
    const context2 = await browser.newContext();
    await setE2eCookie(context2);
    const page2 = await context2.newPage();
    const id2 = uniqueId();
    await createUserAndSignIn(page2, 'Typer One', id2);

    // Typer1 joins the same room via browse
    await page2.click('button:has-text("Browse")');
    await page2.fill('input[placeholder*="Search"]', roomName);
    const joinButton2 = page2.getByTestId(`browse-room-${roomSlug}-join`);
    await expect(joinButton2).toBeVisible({ timeout: 10000 });
    await joinButton2.click();
    await page2.waitForURL(new RegExp(`/chat/${roomSlug}`));
    await waitForMessageList(page2);

    // Create third user (typer2) in a new context
    const context3 = await browser.newContext();
    await setE2eCookie(context3);
    const page3 = await context3.newPage();
    const id3 = uniqueId();
    await createUserAndSignIn(page3, 'Typer Two', id3);

    // Typer2 joins the same room via browse
    await page3.click('button:has-text("Browse")');
    await page3.fill('input[placeholder*="Search"]', roomName);
    const joinButton3 = page3.getByTestId(`browse-room-${roomSlug}-join`);
    await expect(joinButton3).toBeVisible({ timeout: 10000 });
    await joinButton3.click();
    await page3.waitForURL(new RegExp(`/chat/${roomSlug}`));
    await waitForMessageList(page3);

    // Verify no typing indicator initially on observer's page
    await expect(page.getByTestId('typing-indicator-empty')).toBeVisible();

    // First typer starts typing
    const input2 = page2.getByTestId('message-input');
    await input2.click();
    await input2.pressSequentially('Hello from typer one', { delay: 50 });

    // Observer should see one typer
    const typingIndicator = page.getByTestId('typing-indicator');
    await expect(typingIndicator).toBeVisible({ timeout: 10000 });
    const typingText = page.getByTestId('typing-indicator-text');
    await expect(typingText).toHaveText('Typer One is typing');

    // Second typer starts typing
    const input3 = page3.getByTestId('message-input');
    await input3.click();
    await input3.pressSequentially('Hello from typer two', { delay: 50 });

    // Observer should see both typers with "and" format
    await expect(typingText).toContainText(/Typer (One|Two) and Typer (One|Two) are typing/, {
      timeout: 10000,
    });

    // Clean up
    await context2.close();
    await context3.close();
  });

  test('own typing does not show indicator to self', async ({ page }) => {
    const id = uniqueId();

    // Create user and E2E room
    await createUserAndSignIn(page, 'Solo Typer', id);
    await createRoom(page, `Self Typing ${id}`);
    await waitForMessageList(page);

    // Verify typing indicator shows empty state initially
    await expect(page.getByTestId('typing-indicator-empty')).toBeVisible();
    await expect(page.getByTestId('typing-indicator')).not.toBeVisible();

    // User starts typing in the message input
    const input = page.getByTestId('message-input');
    await input.click();
    await input.pressSequentially('Testing my own typing', { delay: 50 });

    // Wait a moment for any typing events to propagate
    await page.waitForTimeout(500);

    // User should NOT see their own typing indicator
    await expect(page.getByTestId('typing-indicator-empty')).toBeVisible();
    await expect(page.getByTestId('typing-indicator')).not.toBeVisible();

    // Type more to ensure typing events are continuously sent
    await input.pressSequentially(' and more text', { delay: 50 });

    // Still should not see own typing indicator
    await expect(page.getByTestId('typing-indicator-empty')).toBeVisible();
    await expect(page.getByTestId('typing-indicator')).not.toBeVisible();
  });
});
