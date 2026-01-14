import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { roomMembers, rooms, uploadedImages } from '../db/schema';
import {
  ALLOWED_IMAGE_TYPES,
  FilesystemStorage,
  getStorage,
  isAllowedImageType,
  MAX_IMAGE_SIZE_BYTES,
} from '../storage';
import {
  verifySignedToken,
  type DownloadTokenPayload,
  type UploadTokenPayload,
} from '../storage/filesystem';
import { public_ } from '../middleware/auth';
import type { AppContext } from '../types';

export const imagesRoutes = new Hono<AppContext>();

const uploadUrlRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const downloadUrlRequestSchema = z.object({
  key: z.string().min(1),
});

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

function findRoomBySlug(slug: string) {
  return db.query.rooms.findFirst({ where: eq(rooms.slug, slug) });
}

function findMembership(roomId: string, userId: string) {
  return db.query.roomMembers.findFirst({
    where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
  });
}

imagesRoutes.post('/rooms/:slug/images/upload-url', async (c) => {
  const session = c.get('session');

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  const membership = await findMembership(room.id, session.user.id);
  if (!membership) {
    return c.json({ error: 'Not a member of this room' }, 403);
  }

  const body = await c.req.json();
  const result = uploadUrlRequestSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.issues }, 400);
  }

  const { filename, mimeType, sizeBytes, width, height } = result.data;

  if (!isAllowedImageType(mimeType)) {
    return c.json(
      { error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
      400
    );
  }

  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return c.json(
      { error: `File too large. Maximum size: ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB` },
      400
    );
  }

  const storage = getStorage();
  let uploadResult;
  try {
    uploadResult = await storage.generateUploadUrl({
      roomId: room.slug,
      userId: session.user.id,
      filename,
      mimeType,
      sizeBytes,
    });
  } catch (err) {
    console.error('Failed to generate upload URL:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate upload URL';
    return c.json({ error: message }, 500);
  }

  await db.insert(uploadedImages).values({
    id: uploadResult.key,
    roomId: room.id,
    uploaderId: session.user.id,
    originalName: filename,
    mimeType,
    sizeBytes,
    width: width ?? null,
    height: height ?? null,
    uploadedAt: new Date(),
  });

  return c.json({
    uploadUrl: uploadResult.url,
    key: uploadResult.key,
    expiresAt: uploadResult.expiresAt.toISOString(),
  });
});

imagesRoutes.post('/rooms/:slug/images/download-url', async (c) => {
  const session = c.get('session');

  const room = await findRoomBySlug(c.req.param('slug'));
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }

  const membership = await findMembership(room.id, session.user.id);
  if (!membership) {
    return c.json({ error: 'Not a member of this room' }, 403);
  }

  const body = await c.req.json();
  const result = downloadUrlRequestSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.issues }, 400);
  }

  const { key } = result.data;

  const image = await db.query.uploadedImages.findFirst({
    where: eq(uploadedImages.id, key),
  });

  if (!image || image.roomId !== room.id) {
    return c.json({ error: 'Image not found' }, 404);
  }

  const storage = getStorage();
  const downloadResult = await storage.generateDownloadUrl(key);

  return c.json({
    downloadUrl: downloadResult.url,
    expiresAt: downloadResult.expiresAt.toISOString(),
  });
});

imagesRoutes.put('/images/upload/:token', public_(), async (c) => {
  const token = c.req.param('token');
  const payload = verifySignedToken<UploadTokenPayload>(token);

  if (!payload || payload.operation !== 'upload') {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }

  const contentType = c.req.header('content-type');
  if (contentType !== payload.mimeType) {
    return c.json({ error: 'Content type mismatch' }, 400);
  }

  const arrayBuffer = await c.req.arrayBuffer();
  const data = Buffer.from(arrayBuffer);

  if (data.length > payload.maxSize) {
    return c.json({ error: 'File size exceeds declared size' }, 413);
  }

  const storage = getStorage();
  if (!(storage instanceof FilesystemStorage)) {
    return c.json({ error: 'Upload endpoint only available for filesystem storage' }, 500);
  }

  await storage.saveFile(payload.key, data);

  return c.json({ success: true, key: payload.key });
});

imagesRoutes.get('/images/download/:token', public_(), async (c) => {
  const token = c.req.param('token');
  const payload = verifySignedToken<DownloadTokenPayload>(token);

  if (!payload || payload.operation !== 'download') {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }

  const storage = getStorage();
  if (!(storage instanceof FilesystemStorage)) {
    return c.json({ error: 'Download endpoint only available for filesystem storage' }, 500);
  }

  try {
    const data = await storage.readFile(payload.key);
    const ext = payload.key.split('.').pop() || '';
    const mimeType = EXTENSION_TO_MIME[ext] || 'application/octet-stream';

    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': data.length.toString(),
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return c.json({ error: 'Image not found' }, 404);
    }
    throw error;
  }
});
