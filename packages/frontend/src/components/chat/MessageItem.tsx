import type { ChatMessage } from '@app/shared';

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
}

export function MessageItem({ message, isOwn, showAvatar }: MessageItemProps) {
  const displayName = message.metadata?.displayName || 'Anonymous';
  const timestamp = new Date(message.timestamp);
  const timeString = timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-cream font-serif text-lg ${
            isOwn ? 'bg-forest' : 'bg-terracotta'
          }`}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Message content */}
      <div
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}
      >
        {showAvatar && (
          <div
            className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}
          >
            <span className="text-sm font-medium text-charcoal">
              {displayName}
            </span>
            <span className="text-xs text-stone-400">{timeString}</span>
          </div>
        )}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-forest text-cream rounded-tr-sm'
              : 'bg-cream-dark text-charcoal rounded-tl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </p>
        </div>
      </div>
    </div>
  );
}
