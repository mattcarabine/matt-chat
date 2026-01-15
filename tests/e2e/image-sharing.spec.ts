import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';
import {
  uniqueId,
  setE2eCookie,
  createUserAndSignIn,
  waitForMessageList,
} from './utils/helpers';

// Path to test fixtures (ESM-compatible)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE_PATH = path.join(__dirname, 'fixtures', 'test-image.png');
const TEST_IMAGE_2_PATH = path.join(__dirname, 'fixtures', 'test-image-2.png');
const TEST_INVALID_FILE_PATH = path.join(__dirname, 'fixtures', 'test-document.txt');

test.describe('Image Sharing', () => {
  test.beforeEach(async ({ context }) => {
    await setE2eCookie(context);
  });

  test.describe('Upload Button', () => {
    test('image upload button is visible in message input', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Image Test User', id);
      await waitForMessageList(page);

      // Verify the image upload button is visible
      const uploadButton = page.getByTestId('image-upload-button');
      await expect(uploadButton).toBeVisible();

      // Verify the hidden file input exists
      const fileInput = page.getByTestId('image-upload-input');
      await expect(fileInput).toBeAttached();

      // Verify button has correct title/tooltip
      await expect(uploadButton).toHaveAttribute('title', 'Add images');
    });
  });

  test.describe('File Selection', () => {
    test('can select an image file for upload', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Image Select User', id);
      await waitForMessageList(page);

      // Get the file input
      const fileInput = page.getByTestId('image-upload-input');

      // Select a test image file
      await fileInput.setInputFiles(TEST_IMAGE_PATH);

      // Verify the image preview container appears
      const previewContainer = page.getByTestId('image-preview-container');
      await expect(previewContainer).toBeVisible();

      // Verify at least one preview item is shown
      const previewItem = page.getByTestId('image-preview-item');
      await expect(previewItem).toBeVisible();

      // Verify the preview contains an image element with the file preview
      const previewImage = previewItem.locator('img');
      await expect(previewImage).toBeVisible();
      await expect(previewImage).toHaveAttribute('alt', 'test-image.png');
    });
  });

  test.describe('Image Preview', () => {
    test('selected image shows preview before sending', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Preview Show User', id);
      await waitForMessageList(page);

      // Select a test image file
      const fileInput = page.getByTestId('image-upload-input');
      await fileInput.setInputFiles(TEST_IMAGE_PATH);

      // Verify preview container appears
      const previewContainer = page.getByTestId('image-preview-container');
      await expect(previewContainer).toBeVisible();

      // Verify preview item is displayed
      const previewItem = page.getByTestId('image-preview-item');
      await expect(previewItem).toBeVisible();

      // Verify the preview image has correct attributes
      const previewImage = previewItem.locator('img');
      await expect(previewImage).toBeVisible();
      await expect(previewImage).toHaveAttribute('alt', 'test-image.png');

      // Verify the preview image has a valid src (data URL for local preview)
      const src = await previewImage.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).toMatch(/^(data:image\/|blob:)/);

      // Verify the remove button is present for the preview
      const removeButton = page.getByTestId('image-preview-remove');
      await expect(removeButton).toBeVisible();
      await expect(removeButton).toHaveAttribute('title', 'Remove image');

      // Verify the preview shows before the message is sent (send button still enabled with text)
      const messageInput = page.getByTestId('message-input');
      await messageInput.fill('Test message with image');
      const sendButton = page.getByTestId('message-send-button');
      await expect(sendButton).toBeEnabled();

      // Verify preview is still visible (hasn't been cleared yet)
      await expect(previewContainer).toBeVisible();
      await expect(previewItem).toBeVisible();
    });

    test('can remove image from preview before sending', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Preview Remove User', id);
      await waitForMessageList(page);

      // Select a test image file
      const fileInput = page.getByTestId('image-upload-input');
      await fileInput.setInputFiles(TEST_IMAGE_PATH);

      // Verify preview appears
      const previewContainer = page.getByTestId('image-preview-container');
      const previewItem = page.getByTestId('image-preview-item');
      await expect(previewContainer).toBeVisible();
      await expect(previewItem).toBeVisible();

      // Click the remove button
      const removeButton = page.getByTestId('image-preview-remove');
      await expect(removeButton).toBeVisible();
      await removeButton.click();

      // Verify the preview item is removed
      await expect(previewItem).not.toBeVisible();

      // Verify the preview container is also hidden (no images left)
      await expect(previewContainer).not.toBeVisible();

      // Verify the file input is cleared (can select a new file)
      // We verify this by selecting another file and checking preview appears again
      await fileInput.setInputFiles(TEST_IMAGE_PATH);
      await expect(previewContainer).toBeVisible();
      await expect(previewItem).toBeVisible();
    });
  });

  test.describe('Sending Images', () => {
    test('sent image appears in message list', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Image Send User', id);
      await waitForMessageList(page);

      // Select a test image file
      const fileInput = page.getByTestId('image-upload-input');
      await fileInput.setInputFiles(TEST_IMAGE_PATH);

      // Verify preview appears
      const previewContainer = page.getByTestId('image-preview-container');
      await expect(previewContainer).toBeVisible();

      // Click send button to send the image
      const sendButton = page.getByTestId('message-send-button');
      await expect(sendButton).toBeEnabled();
      await sendButton.click();

      // Wait for the image to appear in message list (use last() as other images may exist)
      // The message-images container holds the sent images
      const messageImages = page.getByTestId('message-images').last();
      await expect(messageImages).toBeVisible({ timeout: 30000 });

      // Verify the thumbnail is visible within the message (use last() for most recent)
      const thumbnail = page.getByTestId('message-image-thumbnail').last();
      await expect(thumbnail).toBeVisible();

      // Verify the thumbnail contains an image element
      const thumbnailImage = thumbnail.locator('img');
      await expect(thumbnailImage).toBeVisible({ timeout: 15000 });

      // Verify the image has the correct alt text (original filename)
      await expect(thumbnailImage).toHaveAttribute('alt', 'test-image.png');

      // Verify the preview was cleared after sending
      await expect(previewContainer).not.toBeVisible();
    });

    test('image thumbnail is clickable', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Thumbnail Click User', id);
      await waitForMessageList(page);

      // Select and send a test image
      const fileInput = page.getByTestId('image-upload-input');
      await fileInput.setInputFiles(TEST_IMAGE_PATH);

      const sendButton = page.getByTestId('message-send-button');
      await expect(sendButton).toBeEnabled();
      await sendButton.click();

      // Wait for the thumbnail to appear - find specifically by alt text to avoid interference from parallel tests
      const thumbnail = page.getByTestId('message-image-thumbnail').filter({ has: page.locator('img[alt="test-image.png"]') }).last();
      await expect(thumbnail).toBeVisible({ timeout: 30000 });

      // Verify thumbnail is a button element (clickable)
      await expect(thumbnail).toHaveRole('button');

      // Verify thumbnail image is loaded before clicking
      const thumbnailImage = thumbnail.locator('img');
      await expect(thumbnailImage).toBeVisible({ timeout: 15000 });

      // Click the thumbnail and verify lightbox opens
      await thumbnail.click();

      // Verify lightbox container appeared
      const lightbox = page.getByTestId('image-lightbox');
      await expect(lightbox).toBeVisible();

      // Verify the lightbox contains the image
      const lightboxImage = page.getByTestId('image-lightbox-image');
      await expect(lightboxImage).toBeVisible({ timeout: 15000 });
      await expect(lightboxImage).toHaveAttribute('alt', 'test-image.png');
    });

    test('can send multiple images in one message', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Multi Image User', id);
      await waitForMessageList(page);

      // Select multiple image files at once
      const fileInput = page.getByTestId('image-upload-input');
      await fileInput.setInputFiles([TEST_IMAGE_PATH, TEST_IMAGE_2_PATH]);

      // Verify preview shows both images
      const previewContainer = page.getByTestId('image-preview-container');
      await expect(previewContainer).toBeVisible();

      // Verify two preview items are shown
      const previewItems = page.getByTestId('image-preview-item');
      await expect(previewItems).toHaveCount(2);

      // Verify each preview has a remove button
      const removeButtons = page.getByTestId('image-preview-remove');
      await expect(removeButtons).toHaveCount(2);

      // Send the message with both images
      const sendButton = page.getByTestId('message-send-button');
      await expect(sendButton).toBeEnabled();
      await sendButton.click();

      // Wait for a message-images container with 2-column grid (only multi-image messages have this)
      // This avoids interference from single-image messages uploaded by other parallel tests
      const messageImages = page.locator('[data-testid="message-images"].grid-cols-2').last();
      await expect(messageImages).toBeVisible({ timeout: 30000 });

      // Verify both thumbnails are visible within the message
      const thumbnails = messageImages.getByTestId('message-image-thumbnail');
      await expect(thumbnails).toHaveCount(2);

      // Verify both images are loaded
      const firstThumbnail = thumbnails.first();
      const secondThumbnail = thumbnails.last();
      await expect(firstThumbnail.locator('img')).toBeVisible({ timeout: 15000 });
      await expect(secondThumbnail.locator('img')).toBeVisible({ timeout: 15000 });

      // Verify the images have correct alt text (original filenames)
      await expect(firstThumbnail.locator('img')).toHaveAttribute('alt', 'test-image.png');
      await expect(secondThumbnail.locator('img')).toHaveAttribute('alt', 'test-image-2.png');

      // Verify the preview was cleared after sending
      await expect(previewContainer).not.toBeVisible();
    });
  });

  test.describe('Lightbox', () => {
    test('lightbox opens when clicking image', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Lightbox Open User', id);
      await waitForMessageList(page);

      // Select and send a test image
      const fileInput = page.getByTestId('image-upload-input');
      await fileInput.setInputFiles(TEST_IMAGE_PATH);

      const sendButton = page.getByTestId('message-send-button');
      await expect(sendButton).toBeEnabled();
      await sendButton.click();

      // Wait for the thumbnail to appear - find specifically by alt text to avoid interference from parallel tests
      const thumbnail = page.getByTestId('message-image-thumbnail').filter({ has: page.locator('img[alt="test-image.png"]') }).last();
      await expect(thumbnail).toBeVisible({ timeout: 30000 });

      // Wait for the thumbnail image to load
      const thumbnailImage = thumbnail.locator('img');
      await expect(thumbnailImage).toBeVisible({ timeout: 15000 });

      // Click the thumbnail to open lightbox
      await thumbnail.click();

      // Verify lightbox is visible
      const lightbox = page.getByTestId('image-lightbox');
      await expect(lightbox).toBeVisible();

      // Verify lightbox image loads with correct attributes
      const lightboxImage = page.getByTestId('image-lightbox-image');
      await expect(lightboxImage).toBeVisible({ timeout: 15000 });
      await expect(lightboxImage).toHaveAttribute('alt', 'test-image.png');

      // Verify the image has a valid src URL
      const src = await lightboxImage.getAttribute('src');
      expect(src).toBeTruthy();

      // Verify the lightbox shows the filename at the bottom
      await expect(lightbox.getByText('test-image.png')).toBeVisible();

      // Verify the close button is visible
      const closeButton = page.getByTestId('image-lightbox-close');
      await expect(closeButton).toBeVisible();
      await expect(closeButton).toHaveAttribute('aria-label', 'Close');

      // Verify body scroll is disabled when lightbox is open
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(bodyOverflow).toBe('hidden');
    });

    test('lightbox can be closed', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Lightbox Close User', id);
      await waitForMessageList(page);

      // Select and send a test image
      const fileInput = page.getByTestId('image-upload-input');
      await fileInput.setInputFiles(TEST_IMAGE_PATH);

      const sendButton = page.getByTestId('message-send-button');
      await expect(sendButton).toBeEnabled();
      await sendButton.click();

      // Wait for the thumbnail to appear - find specifically by alt text to avoid interference from parallel tests
      const thumbnail = page.getByTestId('message-image-thumbnail').filter({ has: page.locator('img[alt="test-image.png"]') }).last();
      await expect(thumbnail).toBeVisible({ timeout: 30000 });
      const thumbnailImage = thumbnail.locator('img');
      await expect(thumbnailImage).toBeVisible({ timeout: 15000 });
      await thumbnail.click();

      // Verify lightbox is open
      const lightbox = page.getByTestId('image-lightbox');
      await expect(lightbox).toBeVisible();

      // Close via close button
      const closeButton = page.getByTestId('image-lightbox-close');
      await closeButton.click();

      // Verify lightbox is closed
      await expect(lightbox).not.toBeVisible();

      // Verify body scroll is restored
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(bodyOverflow).toBe('');

      // Re-open lightbox to test Escape key closing
      await thumbnail.click();
      await expect(lightbox).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Verify lightbox is closed
      await expect(lightbox).not.toBeVisible();
    });
  });

  test.describe('Validation', () => {
    test('invalid file type shows error message', async ({ page }) => {
      const id = uniqueId();

      // Create user and navigate to chat
      await createUserAndSignIn(page, 'Invalid Type User', id);
      await waitForMessageList(page);

      // Get the file input
      const fileInput = page.getByTestId('image-upload-input');

      // Try to select an invalid file type (text file)
      await fileInput.setInputFiles(TEST_INVALID_FILE_PATH);

      // Verify validation error message appears
      const errorMessage = page.getByTestId('image-validation-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Invalid file type');
      await expect(errorMessage).toContainText('Only JPEG, PNG, GIF, and WebP images are allowed');

      // Verify the preview container does NOT appear (file was rejected)
      const previewContainer = page.getByTestId('image-preview-container');
      await expect(previewContainer).not.toBeVisible();

      // Verify the error can be dismissed
      const dismissButton = errorMessage.getByRole('button', { name: 'Dismiss error' });
      await expect(dismissButton).toBeVisible();
      await dismissButton.click();

      // Verify error is gone after dismissal
      await expect(errorMessage).not.toBeVisible();

      // Verify a valid image can still be uploaded after error
      await fileInput.setInputFiles(TEST_IMAGE_PATH);
      await expect(previewContainer).toBeVisible();
    });
  });
});
