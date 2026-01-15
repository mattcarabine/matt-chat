import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  createRoom,
  sendMessage,
  waitForMessageList,
} from './utils/helpers';

test.describe('Chat Messaging', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Send Messages', () => {
    test('user can send a text message and see it in message list', async ({ page }) => {
      const id = uniqueId();
      const messageText = `Hello from test ${id}`;

      // Create user, create E2E room, and navigate to chat
      await createUserAndSignIn(page, 'Message Sender', id);
      await createRoom(page, `Send Test ${id}`);
      await waitForMessageList(page);

      // Send a message
      await page.getByTestId('message-input').fill(messageText);
      await page.getByTestId('message-send-button').click();

      // Verify message appears in the list (use unique message text as identifier)
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible();

      // Verify the sender name is displayed within our message
      await expect(messageItem.getByTestId('message-sender')).toHaveText('Message Sender');
    });

    test('user can send multiple messages in sequence', async ({ page }) => {
      const id = uniqueId();
      const messages = [
        `First message ${id}`,
        `Second message ${id}`,
        `Third message ${id}`,
      ];

      // Create user, create E2E room, and navigate to chat
      await createUserAndSignIn(page, 'Multi Sender', id);
      await createRoom(page, `Multi Send Test ${id}`);
      await waitForMessageList(page);

      // Send multiple messages using the helper
      for (const msg of messages) {
        await sendMessage(page, msg);
      }

      // Verify each message is visible by its unique text
      for (const msg of messages) {
        const messageItem = page.getByTestId('message-item').filter({ hasText: msg });
        await expect(messageItem).toBeVisible();
        await expect(messageItem.getByTestId('message-text')).toHaveText(msg);
      }
    });

    test('message displays sender name correctly', async ({ page }) => {
      const id = uniqueId();
      const fullName = 'Sender Display Test';
      const messageText = `Display sender test ${id}`;

      // Create user with a specific full name and create E2E room
      await createUserAndSignIn(page, fullName, id);
      await createRoom(page, `Sender Display Test ${id}`);
      await waitForMessageList(page);

      // Send a message
      await sendMessage(page, messageText);

      // Find the message we sent by its unique text
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible();

      // Verify the sender name matches the user's full name
      const senderElement = messageItem.getByTestId('message-sender');
      await expect(senderElement).toBeVisible();
      await expect(senderElement).toHaveText(fullName);
    });

    test('long messages display correctly without breaking layout', async ({ page }) => {
      const id = uniqueId();
      // Generate a long message with various challenging content:
      // - Long continuous string (no spaces)
      // - Normal text with spaces
      // - Multiple lines
      const longWord = 'supercalifragilisticexpialidocious'.repeat(5);
      const longSentence = 'This is a very long sentence that should wrap properly when it reaches the edge of the container. '.repeat(3);
      const messageText = `Long message test ${id}\n\n${longWord}\n\n${longSentence}`;

      // Create user, create E2E room, and navigate to chat
      await createUserAndSignIn(page, 'Long Message Tester', id);
      await createRoom(page, `Long Message Test ${id}`);
      await waitForMessageList(page);

      // Send the long message directly (sendMessage helper uses pressSequentially which doesn't work well with long multiline text)
      const input = page.getByTestId('message-input');
      const sendButton = page.getByTestId('message-send-button');
      await input.fill(messageText);
      await expect(sendButton).toBeEnabled({ timeout: 10000 });
      await sendButton.click();

      // Wait for message to appear
      await expect(page.getByTestId('message-text').filter({ hasText: `Long message test ${id}` })).toBeVisible({
        timeout: 15000,
      });

      // Find the message by its unique identifier
      const messageItem = page.getByTestId('message-item').filter({ hasText: `Long message test ${id}` });
      await expect(messageItem).toBeVisible();

      // Verify the message text is fully displayed
      const messageTextEl = messageItem.getByTestId('message-text');
      await expect(messageTextEl).toBeVisible();
      await expect(messageTextEl).toContainText(`Long message test ${id}`);
      await expect(messageTextEl).toContainText(longWord);

      // Verify the message bubble doesn't overflow the container
      // The message content has max-w-[70%] constraint
      const messageList = page.getByTestId('message-list');
      const listBox = await messageList.boundingBox();
      const messageBox = await messageItem.boundingBox();

      // Message should be within the bounds of the message list
      expect(messageBox).toBeTruthy();
      expect(listBox).toBeTruthy();
      if (messageBox && listBox) {
        expect(messageBox.x).toBeGreaterThanOrEqual(listBox.x);
        expect(messageBox.x + messageBox.width).toBeLessThanOrEqual(listBox.x + listBox.width);
      }
    });
  });

  test.describe('Message History', () => {
    test('message history loads when entering a room', async ({ page }) => {
      const id = uniqueId();
      const messageText = `History message ${id}`;
      const roomName = `History Test ${id}`;

      // Create user and create E2E room
      await createUserAndSignIn(page, 'History Tester', id);
      const roomSlug = await createRoom(page, roomName);
      await waitForMessageList(page);

      // Send a message to the room
      await sendMessage(page, messageText);

      // Verify message is visible
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible();

      // Navigate away by going to invitations page
      await page.goto('/invitations');
      await expect(page).toHaveURL('/invitations');

      // Navigate back to the specific room
      await page.goto(`/chat/${roomSlug}`);
      await waitForMessageList(page);

      // Verify the message history is loaded - the message should still be there
      const historyMessage = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(historyMessage).toBeVisible({ timeout: 15000 });
      await expect(historyMessage.getByTestId('message-text')).toHaveText(messageText);
    });

    test('messages persist after page refresh via Ably history', async ({ page }) => {
      const id = uniqueId();
      const roomName = `Persist Refresh Test ${id}`;
      const messageText = `Persisted message ${id}`;

      // Create user and create a room for this test
      await createUserAndSignIn(page, 'Persist Tester', id);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Get the current URL to verify we return to the same room
      const roomUrl = page.url();

      // Send a message
      await sendMessage(page, messageText);

      // Verify message is visible before refresh
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible();

      // Wait for Ably to persist the message to history (eventual consistency)
      // This is needed because Ably's history API has a short delay before messages appear
      await page.waitForTimeout(2000);

      // Perform a full page refresh
      await page.reload();

      // Wait for the page to fully reload and message list to be ready
      await waitForMessageList(page);

      // Verify we're still on the same room URL
      await expect(page).toHaveURL(roomUrl);

      // Verify the message persists after refresh (loaded from Ably history)
      const persistedMessage = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(persistedMessage).toBeVisible({ timeout: 15000 });
      await expect(persistedMessage.getByTestId('message-text')).toHaveText(messageText);
      await expect(persistedMessage.getByTestId('message-sender')).toHaveText('Persist Tester');
    });
  });

  test.describe('Empty State', () => {
    test('empty room shows appropriate empty state', async ({ page }) => {
      const id = uniqueId();
      const roomName = `Empty State Test ${id}`;

      // Create user and create a new room (which will have no messages)
      await createUserAndSignIn(page, 'Empty State Tester', id);
      await createRoom(page, roomName);

      // Verify empty state is shown
      const emptyState = page.getByTestId('message-list-empty');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('No messages yet');
      await expect(emptyState).toContainText('Be the first to say hello!');
    });
  });

  test.describe('Input Behavior', () => {
    test('message input is focused when entering a room', async ({ page }) => {
      const id = uniqueId();

      // Create user and E2E room
      await createUserAndSignIn(page, 'Focus Tester', id);
      await createRoom(page, `Focus Test Room ${id}`);
      await waitForMessageList(page);

      // Verify the message input is focused
      const input = page.getByTestId('message-input');
      await expect(input).toBeFocused();

      // Create another room and verify focus transfers
      const roomName = `Focus Test Room 2 ${id}`;
      await page.click('button:has-text("Create")');
      await page.fill('[data-testid="create-room-name"]', roomName);
      await page.getByTestId('create-room-submit').click();
      await page.waitForURL(/\/chat\//);
      await waitForMessageList(page);

      // Verify input is focused in the new room
      await expect(input).toBeFocused();
    });

    test('pressing Enter sends the message', async ({ page }) => {
      const id = uniqueId();
      const messageText = `Enter key message ${id}`;

      // Create user, create E2E room, and navigate to chat
      await createUserAndSignIn(page, 'Enter Key Tester', id);
      await createRoom(page, `Enter Key Test ${id}`);
      await waitForMessageList(page);

      // Type a message and press Enter to send (instead of clicking button)
      const input = page.getByTestId('message-input');
      await input.click();
      await input.pressSequentially(messageText, { delay: 10 });
      await input.press('Enter');

      // Verify message appears in the list
      const messageItem = page.getByTestId('message-item').filter({ hasText: messageText });
      await expect(messageItem).toBeVisible({ timeout: 15000 });
      await expect(messageItem.getByTestId('message-text')).toHaveText(messageText);

      // Verify input is cleared after sending
      await expect(input).toHaveValue('');
    });
  });

  test.describe('Real-time Messaging', () => {
    test('user receives messages from other users in real-time', async ({ page, browser }) => {
      const id = uniqueId();
      const roomName = `Realtime Test ${id}`;
      const messageText = `Real-time message ${id}`;

      // Create first user and a room
      await createUserAndSignIn(page, 'Sender User', id);
      await createRoom(page, roomName);
      await waitForMessageList(page);

      // Create second user in a new context
      const context2 = await browser.newContext();
      await setE2eCookie(context2);
      const page2 = await context2.newPage();
      const id2 = uniqueId();
      await createUserAndSignIn(page2, 'Receiver User', id2);

      // Second user joins the same room via browse
      await page2.click('button:has-text("Browse")');
      await page2.fill('input[placeholder*="Search"]', roomName);
      // Wait for search results and click Join button for this room
      const roomItem = page2.locator('div').filter({ hasText: roomName }).first();
      await expect(roomItem.getByRole('button', { name: 'Join' })).toBeVisible({ timeout: 10000 });
      await roomItem.getByRole('button', { name: 'Join' }).click();
      await page2.waitForURL(/\/chat\//);
      await waitForMessageList(page2);

      // First user sends a message
      await sendMessage(page, messageText);

      // Second user should receive the message in real-time
      const receivedMessage = page2.getByTestId('message-item').filter({ hasText: messageText });
      await expect(receivedMessage).toBeVisible({ timeout: 15000 });
      await expect(receivedMessage.getByTestId('message-sender')).toHaveText('Sender User');
      await expect(receivedMessage.getByTestId('message-text')).toHaveText(messageText);

      // Clean up
      await context2.close();
    });
  });
});
