import { useState } from 'react';
import type { MessageImage } from '@app/shared';
import { ImageThumbnail } from './ImageThumbnail';
import { ImageLightbox } from './ImageLightbox';

interface MessageImagesProps {
  images: MessageImage[];
  roomSlug: string;
}

export function MessageImages({ images, roomSlug }: MessageImagesProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const gridCols = images.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <>
      <div className={`grid ${gridCols} gap-2 mt-2`}>
        {images.map((image, index) => (
          <ImageThumbnail
            key={image.key}
            image={image}
            roomSlug={roomSlug}
            onClick={() => setLightboxIndex(index)}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          roomSlug={roomSlug}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
