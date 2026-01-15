import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { MessageImage } from '@app/shared';

const API_URL = import.meta.env.VITE_API_URL || '';

// Constants matching backend
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES_PER_MESSAGE = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export interface PendingImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  key?: string;
  width?: number;
  height?: number;
  error?: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
  expiresAt: string;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function calculateScaledDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  if (width > height) {
    return { width: maxDimension, height: Math.round((height * maxDimension) / width) };
  }
  return { width: Math.round((width * maxDimension) / height), height: maxDimension };
}

async function convertToWebP(file: File, maxDimension = 2048): Promise<File> {
  // If already webp and small enough, return as-is
  if (file.type === 'image/webp' && file.size <= MAX_IMAGE_SIZE_BYTES) {
    const dims = await getImageDimensions(file);
    if (dims.width <= maxDimension && dims.height <= maxDimension) {
      return file;
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = calculateScaledDimensions(img.width, img.height, maxDimension);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert to WebP'));
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
        },
        'image/webp',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for conversion'));
    };

    img.src = url;
  });
}

export function useImageUpload(roomSlug: string) {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  const addImages = useCallback(
    async (files: File[]) => {
      // Clear any previous validation error
      setValidationError(null);

      // Filter valid files and collect validation errors
      const invalidTypeFiles: string[] = [];
      const tooLargeFiles: string[] = [];

      const validFiles = files.filter((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          invalidTypeFiles.push(file.name);
          return false;
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES * 2) {
          // Allow 2x since we'll compress
          tooLargeFiles.push(file.name);
          return false;
        }
        return true;
      });

      // Set validation error if any files were rejected
      if (invalidTypeFiles.length > 0) {
        setValidationError(`Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.`);
      } else if (tooLargeFiles.length > 0) {
        setValidationError(`File too large. Maximum size is 10MB.`);
      }

      // Limit total images
      const remainingSlots = MAX_IMAGES_PER_MESSAGE - pendingImages.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      if (filesToAdd.length === 0) return;

      // Create pending image entries
      const newImages: PendingImage[] = await Promise.all(
        filesToAdd.map(async (file) => {
          const dims = await getImageDimensions(file).catch(() => ({
            width: undefined,
            height: undefined,
          }));
          return {
            id: nanoid(),
            file,
            preview: URL.createObjectURL(file),
            status: 'pending' as const,
            progress: 0,
            width: dims.width,
            height: dims.height,
          };
        })
      );

      setPendingImages((prev) => [...prev, ...newImages]);
    },
    [pendingImages.length]
  );

  const removeImage = useCallback((id: string) => {
    setPendingImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setPendingImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview));
      return [];
    });
  }, []);

  const uploadAll = useCallback(async (): Promise<MessageImage[]> => {
    if (pendingImages.length === 0) return [];

    const updateImage = (id: string, updates: Partial<PendingImage>) => {
      setPendingImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
      );
    };

    const results: MessageImage[] = [];

    for (const image of pendingImages) {
      try {
        updateImage(image.id, { status: 'uploading' });

        const processedFile = await convertToWebP(image.file);
        const dims = await getImageDimensions(processedFile);

        const uploadUrlRes = await fetch(`${API_URL}/api/rooms/${roomSlug}/images/upload-url`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: processedFile.name,
            mimeType: processedFile.type,
            sizeBytes: processedFile.size,
            width: dims.width,
            height: dims.height,
          }),
        });

        if (!uploadUrlRes.ok) {
          const errorData = await uploadUrlRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to get upload URL');
        }

        const { uploadUrl, key } = (await uploadUrlRes.json()) as UploadUrlResponse;

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': processedFile.type },
          body: processedFile,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload image');
        }

        updateImage(image.id, { status: 'uploaded', progress: 100, key });

        results.push({
          key,
          originalName: image.file.name,
          mimeType: processedFile.type,
          width: dims.width,
          height: dims.height,
        });
      } catch (err) {
        console.error('Failed to upload image:', err);
        updateImage(image.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    }

    return results;
  }, [pendingImages, roomSlug]);

  const isUploading = pendingImages.some((img) => img.status === 'uploading');
  const hasErrors = pendingImages.some((img) => img.status === 'error');

  return {
    pendingImages,
    addImages,
    removeImage,
    clearAll,
    uploadAll,
    isUploading,
    hasErrors,
    canAddMore: pendingImages.length < MAX_IMAGES_PER_MESSAGE,
    validationError,
    clearValidationError,
  };
}
