import { useRef } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  canAddMore: boolean;
}

export function ImageUploader({ onFilesSelected, disabled, canAddMore }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = disabled || !canAddMore;

  function handleClick(): void {
    if (!isDisabled) {
      inputRef.current?.click();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
    e.target.value = '';
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center
                   text-stone-500 hover:text-forest hover:bg-cream-dark rounded-lg
                   transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
        title={canAddMore ? 'Add images' : 'Maximum images reached'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>
    </>
  );
}
