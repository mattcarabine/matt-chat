import { useState, useCallback, useRef, useEffect } from 'react';
import { useChatMessages, useChatTyping } from '@/hooks/useChat';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageUploader } from './ImageUploader';
import { ImagePreview } from './ImagePreview';

const TYPING_TIMEOUT_MS = 2000;

interface MessageInputProps {
  roomSlug: string;
}

export function MessageInput({ roomSlug }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { sendMessage } = useChatMessages();
  const { startTyping, stopTyping } = useChatTyping();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dragCounterRef = useRef(0);

  const {
    pendingImages,
    addImages,
    removeImage,
    clearAll,
    uploadAll,
    isUploading,
    canAddMore,
  } = useImageUpload(roomSlug);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      startTyping();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(stopTyping, TYPING_TIMEOUT_MS);
    },
    [startTyping, stopTyping]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmedText = text.trim();
      const hasContent = trimmedText || pendingImages.length > 0;
      if (!hasContent || isSending || isUploading) return;

      try {
        setIsSending(true);
        stopTyping();

        // Upload images first if any
        const uploadedImages = await uploadAll();

        // Send message with text and/or images
        await sendMessage(trimmedText || undefined, uploadedImages.length > 0 ? uploadedImages : undefined);

        setText('');
        clearAll();
        inputRef.current?.focus();
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    },
    [text, pendingImages.length, isSending, isUploading, sendMessage, stopTyping, uploadAll, clearAll]
  );

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Handle paste for images
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      const imageFiles: File[] = [];

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        addImages(imageFiles);
      }
    },
    [addImages]
  );

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (files.length > 0) {
        addImages(files);
      }
    },
    [addImages]
  );

  const canSend = (text.trim() || pendingImages.length > 0) && !isSending && !isUploading;

  return (
    <form
      onSubmit={handleSubmit}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative"
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-forest/10 border-2 border-dashed border-forest rounded-lg z-10 flex items-center justify-center">
          <div className="text-forest font-medium">Drop images here</div>
        </div>
      )}

      {/* Image preview */}
      <ImagePreview images={pendingImages} onRemove={removeImage} />

      <div className="p-4">
        <div className="flex gap-3 items-end">
          {/* Image upload button */}
          <ImageUploader
            onFilesSelected={addImages}
            disabled={isSending || isUploading}
            canAddMore={canAddMore}
          />

          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={pendingImages.length > 0 ? 'Add a message (optional)...' : 'Type a message...'}
            rows={1}
            className="flex-1 resize-none px-4 py-3 bg-cream-dark border border-stone-300/50 rounded-lg
                       text-charcoal placeholder:text-stone-400
                       focus:outline-none focus:border-forest
                       transition-colors duration-200"
            style={{ maxHeight: '120px' }}
            disabled={isSending || isUploading}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex-shrink-0 w-12 h-12 bg-forest text-cream rounded-lg
                       flex items-center justify-center
                       hover:bg-forest-light transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending || isUploading ? (
              <div className="spinner w-5 h-5" />
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
