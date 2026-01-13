/**
 * Signed token utilities for filesystem storage.
 * Uses HMAC-SHA256 to sign tokens containing upload/download permissions.
 */

import { createHmac, randomBytes } from 'crypto';

export interface UploadTokenPayload {
  operation: 'upload';
  key: string;
  roomId: string;
  userId: string;
  mimeType: string;
  maxSize: number;
  expiresAt: number; // Unix timestamp
}

export interface DownloadTokenPayload {
  operation: 'download';
  key: string;
  roomId: string;
  expiresAt: number; // Unix timestamp
}

export type TokenPayload = UploadTokenPayload | DownloadTokenPayload;

function getSecretKey(): string {
  const secret = process.env.IMAGE_TOKEN_SECRET;
  if (!secret) {
    console.error(
      'IMAGE_TOKEN_SECRET is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
    throw new Error('IMAGE_TOKEN_SECRET environment variable is required');
  }
  return secret;
}

function sign(payload: string): string {
  const hmac = createHmac('sha256', getSecretKey());
  hmac.update(payload);
  return hmac.digest('base64url');
}

function verify(payload: string, signature: string): boolean {
  const expectedSignature = sign(payload);
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create a signed token from a payload.
 */
export function createSignedToken(payload: TokenPayload): string {
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson).toString('base64url');
  const signature = sign(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode a signed token.
 * Returns null if the token is invalid or expired.
 */
export function verifySignedToken<T extends TokenPayload>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64, signature] = parts;

  if (!verify(payloadBase64, signature)) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString();
    const payload = JSON.parse(payloadJson) as T;

    // Check expiration
    if (payload.expiresAt < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate a random token secret (for initial setup).
 */
export function generateTokenSecret(): string {
  return randomBytes(32).toString('base64');
}
