import { useState } from 'react';
import { useImageUrl } from '@/hooks/useImageUrl';
import type { MessageImage } from '@app/shared';

interface ImageThumbnailProps {
  image: MessageImage;
  roomSlug: string;
  onClick: () => void;
}

const MAX_THUMBNAIL_WIDTH = 300;
const MAX_THUMBNAIL_HEIGHT = 200;

function getSkeletonStyle(image: MessageImage) {
  const aspectRatio = image.width && image.height ? image.width / image.height : 1;
  return {
    aspectRatio: aspectRatio.toString(),
    maxWidth: Math.min(image.width || MAX_THUMBNAIL_WIDTH, MAX_THUMBNAIL_WIDTH),
    maxHeight: Math.min(image.height || MAX_THUMBNAIL_HEIGHT, MAX_THUMBNAIL_HEIGHT),
  };
}

export function ImageThumbnail({ image, roomSlug, onClick }: ImageThumbnailProps) {
  const { data: url, isLoading, error } = useImageUrl(roomSlug, image.key);
  const [imageLoaded, setImageLoaded] = useState(false);
  const skeletonStyle = getSkeletonStyle(image);

  if (error) {
    return (
      <div
        className="bg-stone-200 rounded-lg flex items-center justify-center text-stone-400"
        style={skeletonStyle}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
    );
  }

  const showSkeleton = isLoading || !imageLoaded;

  return (
    <button
      type="button"
      onClick={onClick}
      className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-forest"
    >
      {showSkeleton && (
        <div className="bg-stone-200 animate-pulse rounded-lg" style={skeletonStyle} />
      )}
      {url && (
        <img
          src={url}
          alt={image.originalName}
          className={`rounded-lg object-cover ${showSkeleton ? 'hidden' : ''}`}
          style={{ maxWidth: MAX_THUMBNAIL_WIDTH, maxHeight: MAX_THUMBNAIL_HEIGHT }}
          onLoad={() => setImageLoaded(true)}
        />
      )}
    </button>
  );
}
