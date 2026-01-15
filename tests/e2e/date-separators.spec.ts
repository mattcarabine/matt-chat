import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  sendMessage,
  waitForMessageList,
} from './utils/helpers';

test.describe('Date Separators', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test('shows "Today" date separator for messages sent today', async ({ page }) => {
    const id = uniqueId();
    const messageText = `Date separator test ${id}`;

    // Create user and room
    await createUserAndSignIn(page, 'Date Tester', id);
    await createRoom(page, `Date Separator Test ${id}`);
    await waitForMessageList(page);

    // Send a message
    await sendMessage(page, messageText);

    // Verify the date separator appears with "Today" label
    const dateSeparator = page.getByTestId('date-separator');
    await expect(dateSeparator).toBeVisible();
    await expect(dateSeparator).toHaveText(/today/i);
  });

  test('date separator appears before first message of each day', async ({ page }) => {
    const id = uniqueId();
    const messages = [`First message ${id}`, `Second message ${id}`, `Third message ${id}`];

    // Create user and room
    await createUserAndSignIn(page, 'Multi Message Tester', id);
    await createRoom(page, `Multi Message Date Test ${id}`);
    await waitForMessageList(page);

    // Send multiple messages (all on the same day)
    for (const msg of messages) {
      await sendMessage(page, msg);
    }

    // Verify only ONE date separator appears (all messages are on the same day)
    const dateSeparators = page.getByTestId('date-separator');
    await expect(dateSeparators).toHaveCount(1);

    // Verify the separator shows "Today"
    await expect(dateSeparators.first()).toHaveText(/today/i);
  });

  test('date separator has correct visual styling', async ({ page }) => {
    const id = uniqueId();
    const messageText = `Style test message ${id}`;

    // Create user and room
    await createUserAndSignIn(page, 'Style Tester', id);
    await createRoom(page, `Style Test ${id}`);
    await waitForMessageList(page);

    // Send a message
    await sendMessage(page, messageText);

    // Verify the date separator is visible with proper styling
    const dateSeparator = page.getByTestId('date-separator');
    await expect(dateSeparator).toBeVisible();

    // Verify the separator has appropriate dimensions
    const separatorBox = await dateSeparator.boundingBox();
    expect(separatorBox).toBeTruthy();
    // Separator should span a reasonable width and be relatively short in height
    expect(separatorBox!.width).toBeGreaterThan(100);
    expect(separatorBox!.height).toBeLessThan(60);
  });
});
