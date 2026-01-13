import type { PendingImage } from '@/hooks/useImageUpload';

interface ImagePreviewProps {
  images: PendingImage[];
  onRemove: (id: string) => void;
}

function StatusOverlay({ status }: { status: PendingImage['status'] }) {
  if (status === 'uploading') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="spinner w-5 h-5" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  return null;
}

export function ImagePreview({ images, onRemove }: ImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 py-2 border-t border-stone-200 overflow-x-auto">
      {images.map((image) => (
        <div key={image.id} className="relative flex-shrink-0">
          <div
            className={`w-16 h-16 rounded-lg overflow-hidden bg-stone-100 ${
              image.status === 'error' ? 'ring-2 ring-red-500' : ''
            }`}
          >
            <img
              src={image.preview}
              alt={image.file.name}
              className={`w-full h-full object-cover ${
                image.status === 'uploading' ? 'opacity-50' : ''
              }`}
            />
            <StatusOverlay status={image.status} />
          </div>
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="absolute -top-1 -right-1 w-5 h-5 bg-charcoal text-cream rounded-full
                       flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Remove image"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
