import { useState, useCallback, useRef, useEffect } from 'react';
import { useChatMessages, useChatTyping } from '@/hooks/useChat';

const TYPING_TIMEOUT_MS = 2000;

export function MessageInput() {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { sendMessage } = useChatMessages();
  const { startTyping, stopTyping } = useChatTyping();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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
      if (!trimmedText || isSending) return;

      try {
        setIsSending(true);
        stopTyping();
        await sendMessage(trimmedText);
        setText('');
        inputRef.current?.focus();
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    },
    [text, isSending, sendMessage, stopTyping]
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

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex gap-3 items-end">
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none px-4 py-3 bg-cream-dark border border-stone-300/50 rounded-lg
                     text-charcoal placeholder:text-stone-400
                     focus:outline-none focus:border-forest
                     transition-colors duration-200"
          style={{ maxHeight: '120px' }}
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="flex-shrink-0 w-12 h-12 bg-forest text-cream rounded-lg
                     flex items-center justify-center
                     hover:bg-forest-light transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
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
    </form>
  );
}
