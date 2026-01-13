/**
 * Storage provider interface for image uploads.
 * Designed to be pluggable - filesystem for development, S3 for production.
 */

export interface UploadUrlParams {
  roomId: string;
  userId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadUrlResult {
  url: string;
  key: string;
  expiresAt: Date;
}

export interface DownloadUrlResult {
  url: string;
  expiresAt: Date;
}

export interface StorageProvider {
  /**
   * Generate a presigned URL for uploading an image.
   * For S3: returns actual presigned PUT URL
   * For filesystem: returns URL to our upload endpoint with signed token
   */
  generateUploadUrl(params: UploadUrlParams): Promise<UploadUrlResult>;

  /**
   * Generate a presigned URL for downloading an image.
   * For S3: returns actual presigned GET URL
   * For filesystem: returns URL to our download endpoint with signed token
   */
  generateDownloadUrl(key: string): Promise<DownloadUrlResult>;

  /**
   * Delete an image from storage.
   */
  deleteImage(key: string): Promise<void>;

  /**
   * Check if an image exists.
   */
  exists(key: string): Promise<boolean>;
}

// Allowed image MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// Max file size: 5MB
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// Max images per message
export const MAX_IMAGES_PER_MESSAGE = 5;

// URL expiry times
export const UPLOAD_URL_EXPIRY_SECONDS = 5 * 60; // 5 minutes
export const DOWNLOAD_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

export function isAllowedImageType(mimeType: string): mimeType is AllowedImageType {
  return ALLOWED_IMAGE_TYPES.includes(mimeType as AllowedImageType);
}

export function getExtensionFromMimeType(mimeType: AllowedImageType): string {
  const map: Record<AllowedImageType, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[mimeType];
}
