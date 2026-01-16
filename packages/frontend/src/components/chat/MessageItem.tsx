import type { ChatMessage } from '@app/shared';
import { MessageImages } from './MessageImages';
import { UserProfileTrigger } from './UserProfileTrigger';

// Placeholder used for image-only messages (Ably requires non-empty text)
const IMAGE_ONLY_PLACEHOLDER = '\u200B';

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  roomSlug: string;
}

export function MessageItem({ message, isOwn, showAvatar, roomSlug }: MessageItemProps) {
  const displayName = message.metadata?.displayName || 'Anonymous';
  const userId = message.metadata?.userId;
  const timestamp = new Date(message.timestamp);
  const timeString = timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const images = message.metadata?.images;
  // Filter out the placeholder text used for image-only messages
  const textContent = message.text === IMAGE_ONLY_PLACEHOLDER ? '' : message.text;
  const hasText = textContent && textContent.trim().length > 0;
  const hasImages = images && images.length > 0;

  const avatarContent = (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-cream font-serif text-lg ${
        isOwn ? 'bg-forest' : 'bg-terracotta'
      }`}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`} data-testid="message-item">
      {/* Avatar */}
      <div className={`flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
        {userId && showAvatar ? (
          <UserProfileTrigger
            userId={userId}
            displayName={displayName}
            placement={isOwn ? 'left' : 'right'}
          >
            {avatarContent}
          </UserProfileTrigger>
        ) : (
          avatarContent
        )}
      </div>

      {/* Message content */}
      <div
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}
      >
        {showAvatar && (
          <div
            className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}
          >
            {userId ? (
              <UserProfileTrigger
                userId={userId}
                displayName={displayName}
                placement={isOwn ? 'left' : 'right'}
              >
                <span className="text-sm font-medium text-charcoal hover:underline" data-testid="message-sender">
                  {displayName}
                </span>
              </UserProfileTrigger>
            ) : (
              <span className="text-sm font-medium text-charcoal" data-testid="message-sender">
                {displayName}
              </span>
            )}
            <span className="text-xs text-stone-400">{timeString}</span>
          </div>
        )}

        {/* Text bubble */}
        {hasText && (
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwn
                ? 'bg-forest text-cream rounded-tr-sm'
                : 'bg-cream-dark text-charcoal rounded-tl-sm'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" data-testid="message-text">
              {textContent}
            </p>
          </div>
        )}

        {/* Images */}
        {hasImages && (
          <MessageImages images={images} roomSlug={roomSlug} />
        )}
      </div>
    </div>
  );
}
