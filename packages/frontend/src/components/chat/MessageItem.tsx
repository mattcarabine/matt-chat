import { useState, useCallback } from 'react';
import type { ChatMessage } from '@app/shared';
import { MessageImages } from './MessageImages';
import { UserProfilePopover } from './UserProfilePopover';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useChatPresence } from '@/hooks/useChat';
import { useSession } from '@/lib/auth-client';

// Placeholder used for image-only messages (Ably requires non-empty text)
const IMAGE_ONLY_PLACEHOLDER = '\u200B';

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  roomSlug: string;
}

interface PopoverState {
  userId: string;
  anchorRect: DOMRect;
}

export function MessageItem({ message, isOwn, showAvatar, roomSlug }: MessageItemProps) {
  const [popoverState, setPopoverState] = useState<PopoverState | null>(null);
  const { data: session } = useSession();
  const { users: onlineUsers } = useChatPresence();

  const displayName = message.metadata?.displayName || 'Anonymous';
  const messageUserId = message.metadata?.userId;
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

  // Fetch user profile when popover is open
  const { user: profileUser } = useUserProfile(popoverState?.userId ?? null, {
    enabled: !!popoverState,
  });

  // Check if user is online based on presence data
  const isOnline = messageUserId
    ? onlineUsers.some((u) => u.userId === messageUserId)
    : false;

  // Check if this is the current user
  const isCurrentUser = messageUserId === session?.user?.id;

  const handleProfileClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!messageUserId) return;
      const rect = event.currentTarget.getBoundingClientRect();
      setPopoverState({ userId: messageUserId, anchorRect: rect });
    },
    [messageUserId]
  );

  const handleClosePopover = useCallback(() => {
    setPopoverState(null);
  }, []);

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`} data-testid="message-item">
      {/* Avatar */}
      <div className={`flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
        <button
          type="button"
          onClick={handleProfileClick}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-cream font-serif text-lg cursor-pointer transition-opacity hover:opacity-80 ${
            isOwn ? 'bg-forest' : 'bg-terracotta'
          }`}
          data-testid={`message-avatar-${messageUserId}`}
          aria-label={`View ${displayName}'s profile`}
        >
          {displayName.charAt(0).toUpperCase()}
        </button>
      </div>

      {/* Message content */}
      <div
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}
      >
        {showAvatar && (
          <div
            className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}
          >
            <button
              type="button"
              onClick={handleProfileClick}
              className="text-sm font-medium text-charcoal cursor-pointer hover:underline"
              data-testid={`message-name-${messageUserId}`}
            >
              {displayName}
            </button>
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

      {/* Profile Popover */}
      {popoverState && profileUser && (
        <UserProfilePopover
          user={{
            id: profileUser.id,
            displayName: profileUser.displayName,
            username: profileUser.username ?? undefined,
            email: isCurrentUser ? (profileUser.email ?? undefined) : undefined,
            memberSince: new Date(profileUser.memberSince),
          }}
          isOnline={isOnline}
          isCurrentUser={isCurrentUser}
          anchorRect={popoverState.anchorRect}
          onClose={handleClosePopover}
        />
      )}
    </div>
  );
}
