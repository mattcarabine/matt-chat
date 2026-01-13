/**
 * Storage provider factory.
 * Currently only supports filesystem, but designed for easy S3 addition.
 */

import type { StorageProvider } from './types';
import { FilesystemStorage } from './filesystem';

export type StorageType = 'filesystem' | 's3';

function getStorageType(): StorageType {
  const type = process.env.IMAGE_STORAGE_TYPE || 'filesystem';
  if (type !== 'filesystem' && type !== 's3') {
    throw new Error(`Invalid IMAGE_STORAGE_TYPE: ${type}`);
  }
  return type;
}

let storageInstance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const type = getStorageType();

  if (type === 's3') {
    throw new Error('S3 storage not yet implemented');
  }

  storageInstance = new FilesystemStorage();
  return storageInstance;
}

// Re-export types and utilities
export type { StorageProvider, UploadUrlParams, UploadUrlResult, DownloadUrlResult } from './types';
export {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGES_PER_MESSAGE,
  isAllowedImageType,
} from './types';
export { FilesystemStorage } from './filesystem';
