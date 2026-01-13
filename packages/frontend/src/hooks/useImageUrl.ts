import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '';

interface DownloadUrlResponse {
  downloadUrl: string;
  expiresAt: string;
}

async function fetchDownloadUrl(roomSlug: string, key: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/rooms/${roomSlug}/images/download-url`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    throw new Error('Failed to get download URL');
  }

  const data = (await response.json()) as DownloadUrlResponse;
  return data.downloadUrl;
}

/**
 * Hook to fetch and cache presigned download URLs for images.
 * URLs are cached for 50 minutes (backend generates 1 hour URLs).
 */
export function useImageUrl(roomSlug: string, key: string) {
  return useQuery({
    queryKey: ['imageUrl', roomSlug, key],
    queryFn: () => fetchDownloadUrl(roomSlug, key),
    staleTime: 50 * 60 * 1000, // 50 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });
}
