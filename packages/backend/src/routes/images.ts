import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { auth } from '../auth';
import { db } from '../db';
import { rooms, roomMembers, uploadedImages } from '../db/schema';
import {
  getStorage,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  isAllowedImageType,
  FilesystemStorage,
} from '../storage';
import {
  verifySignedToken,
  type UploadTokenPayload,
  type DownloadTokenPayload,
} from '../storage/filesystem';

export const imagesRoutes = new Hono();

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

function getSession(c: Context): Promise<Awaited<ReturnType<typeof auth.api.getSession>>> {
  return auth.api.getSession({ headers: c.req.raw.headers });
}

function findRoomBySlug(slug: string) {
  return db.query.rooms.findFirst({ where: eq(rooms.slug, slug) });
}

function findMembership(roomId: string, userId: string) {
  return db.query.roomMembers.findFirst({
    where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
  });
}

// POST /api/rooms/:slug/images/upload-url - Generate presigned upload URL
imagesRoutes.post('/rooms/:slug/images/upload-url', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

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

  // Validate MIME type
  if (!isAllowedImageType(mimeType)) {
    return c.json(
      { error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
      400
    );
  }

  // Validate size
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
      roomId: room.slug, // Use slug as storage path prefix
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

  // Record in database (pending upload)
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

// POST /api/rooms/:slug/images/download-url - Generate presigned download URL
imagesRoutes.post('/rooms/:slug/images/download-url', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

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

  // Verify the image exists and belongs to this room
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

// PUT /api/images/upload/:token - Handle actual file upload (filesystem only)
imagesRoutes.put('/images/upload/:token', async (c) => {
  const token = c.req.param('token');
  const payload = verifySignedToken<UploadTokenPayload>(token);

  if (!payload || payload.operation !== 'upload') {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }

  // Verify content type matches
  const contentType = c.req.header('content-type');
  if (contentType !== payload.mimeType) {
    return c.json({ error: 'Content type mismatch' }, 400);
  }

  // Get the raw body as ArrayBuffer
  const arrayBuffer = await c.req.arrayBuffer();
  const data = Buffer.from(arrayBuffer);

  // Verify size
  if (data.length > payload.maxSize) {
    return c.json({ error: 'File size exceeds declared size' }, 413);
  }

  // Save to filesystem
  const storage = getStorage();
  if (!(storage instanceof FilesystemStorage)) {
    return c.json({ error: 'Upload endpoint only available for filesystem storage' }, 500);
  }

  await storage.saveFile(payload.key, data);

  return c.json({ success: true, key: payload.key });
});

// GET /api/images/download/:token - Handle actual file download (filesystem only)
imagesRoutes.get('/images/download/:token', async (c) => {
  const token = c.req.param('token');
  const payload = verifySignedToken<DownloadTokenPayload>(token);

  if (!payload || payload.operation !== 'download') {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }

  // Get the file from filesystem
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
