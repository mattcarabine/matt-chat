import { useChatTyping } from '@/hooks/useChat';

function formatTypingText(users: string[]): string {
  if (users.length === 1) {
    return `${users[0]} is typing`;
  }
  if (users.length === 2) {
    return `${users[0]} and ${users[1]} are typing`;
  }
  return `${users[0]} and ${users.length - 1} others are typing`;
}

export function TypingIndicator() {
  const { typingUsers } = useChatTyping();

  if (typingUsers.length === 0) {
    return <div data-testid="typing-indicator-empty" className="h-6 px-6" />;
  }

  return (
    <div data-testid="typing-indicator" className="h-6 px-6 flex items-center gap-2">
      <div data-testid="typing-indicator-dots" className="flex gap-1">
        <span
          className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span data-testid="typing-indicator-text" className="text-xs text-stone-400">{formatTypingText(typingUsers)}</span>
    </div>
  );
}
