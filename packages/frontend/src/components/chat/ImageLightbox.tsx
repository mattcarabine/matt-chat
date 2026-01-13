import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { MessageImage } from '@app/shared';
import { useImageUrl } from '@/hooks/useImageUrl';

interface ImageLightboxProps {
  images: MessageImage[];
  roomSlug: string;
  initialIndex: number;
  onClose: () => void;
}

function LightboxImage({ image, roomSlug }: { image: MessageImage; roomSlug: string }) {
  const { data: url, isLoading } = useImageUrl(roomSlug, image.key);
  const [loaded, setLoaded] = useState(false);

  if (isLoading || !url) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-8 h-8 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-4">
      {!loaded && (
        <div className="absolute">
          <div className="spinner w-8 h-8 border-white/20 border-t-white" />
        </div>
      )}
      <img
        src={url}
        alt={image.originalName}
        className={`max-w-full max-h-full object-contain ${loaded ? '' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export function ImageLightbox({ images, roomSlug, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  function goToPrevious(): void {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  function goToNext(): void {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        goToPrevious();
      } else if (e.key === 'ArrowRight' && hasMultiple) {
        goToNext();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, hasMultiple, images.length]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function handleNavClick(e: React.MouseEvent, action: () => void): void {
    e.stopPropagation();
    action();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10"
        aria-label="Close"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => handleNavClick(e, goToPrevious)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 z-10"
          aria-label="Previous image"
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
        <LightboxImage image={currentImage} roomSlug={roomSlug} />
      </div>

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => handleNavClick(e, goToNext)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 z-10"
          aria-label="Next image"
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-white/50 text-sm truncate max-w-xs">
        {currentImage.originalName}
      </div>
    </div>,
    document.body
  );
}
