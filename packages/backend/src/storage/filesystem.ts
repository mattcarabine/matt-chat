/**
 * Filesystem storage provider.
 * Stores images locally with signed URL shim for access control.
 */

import { mkdir, unlink, access, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { nanoid } from 'nanoid';
import {
  type StorageProvider,
  type UploadUrlParams,
  type UploadUrlResult,
  type DownloadUrlResult,
  UPLOAD_URL_EXPIRY_SECONDS,
  DOWNLOAD_URL_EXPIRY_SECONDS,
  getExtensionFromMimeType,
  type AllowedImageType,
} from './types';
import {
  createSignedToken,
  verifySignedToken,
  type UploadTokenPayload,
  type DownloadTokenPayload,
} from './signed-token';

function getStoragePath(): string {
  return process.env.IMAGE_STORAGE_PATH || './uploads';
}

function getBaseUrl(): string {
  return process.env.API_BASE_URL || 'http://localhost:3000';
}

function buildKey(roomId: string, mimeType: AllowedImageType): string {
  const timestamp = Date.now();
  const id = nanoid(12);
  const ext = getExtensionFromMimeType(mimeType);
  return `${roomId}/${timestamp}_${id}.${ext}`;
}

function getFilePath(key: string): string {
  return join(getStoragePath(), key);
}

export class FilesystemStorage implements StorageProvider {
  async generateUploadUrl(params: UploadUrlParams): Promise<UploadUrlResult> {
    const { roomId, userId, mimeType, sizeBytes } = params;
    const key = buildKey(roomId, mimeType as AllowedImageType);

    const expiresAt = new Date(Date.now() + UPLOAD_URL_EXPIRY_SECONDS * 1000);

    const payload: UploadTokenPayload = {
      operation: 'upload',
      key,
      roomId,
      userId,
      mimeType,
      maxSize: sizeBytes,
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
    };

    const token = createSignedToken(payload);
    const url = `${getBaseUrl()}/api/images/upload/${token}`;

    return { url, key, expiresAt };
  }

  async generateDownloadUrl(key: string): Promise<DownloadUrlResult> {
    // Extract roomId from key (format: {roomId}/{timestamp}_{id}.{ext})
    const roomId = key.split('/')[0];

    const expiresAt = new Date(Date.now() + DOWNLOAD_URL_EXPIRY_SECONDS * 1000);

    const payload: DownloadTokenPayload = {
      operation: 'download',
      key,
      roomId,
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
    };

    const token = createSignedToken(payload);
    const url = `${getBaseUrl()}/api/images/download/${token}`;

    return { url, expiresAt };
  }

  async deleteImage(key: string): Promise<void> {
    const filePath = getFilePath(key);
    try {
      await unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = getFilePath(key);
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save file data to disk. Called by the upload route handler.
   */
  async saveFile(key: string, data: Buffer): Promise<void> {
    const filePath = getFilePath(key);
    const dir = dirname(filePath);

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    await writeFile(filePath, data);
  }

  /**
   * Read file data from disk. Called by the download route handler.
   */
  async readFile(key: string): Promise<Buffer> {
    const filePath = getFilePath(key);
    return readFile(filePath);
  }
}

// Token verification exports for route handlers
export { verifySignedToken };
export type { UploadTokenPayload, DownloadTokenPayload };
