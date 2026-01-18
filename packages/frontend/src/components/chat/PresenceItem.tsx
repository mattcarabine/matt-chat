import { useState, useCallback } from 'react';
import { UserProfilePopover } from '@/components/UserProfilePopover';

interface PresenceItemProps {
  userId: string;
  displayName: string;
  isCurrentUser: boolean;
  isOnline?: boolean;
}

export function PresenceItem({ userId, displayName, isCurrentUser, isOnline = true }: PresenceItemProps) {
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (isCurrentUser) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverAnchor(rect);
  }, [isCurrentUser]);

  const handleClosePopover = useCallback(() => {
    setPopoverAnchor(null);
  }, []);

  const clickableClassName = isCurrentUser ? '' : 'cursor-pointer';

  return (
    <div className={`flex items-center gap-3 py-2 ${!isOnline ? 'opacity-50' : ''}`} data-testid="presence-item">
      <div
        className={`relative ${clickableClassName}`}
        onClick={handleClick}
        data-testid={isCurrentUser ? undefined : 'presence-item-clickable'}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-serif ${
          isOnline ? 'bg-forest text-cream' : 'bg-stone-300 text-stone'
        }`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-cream ${
            isOnline ? 'bg-green-500' : 'bg-stone-400'
          }`}
          data-testid="presence-status-indicator"
        />
      </div>
      <span
        className={`text-sm ${isCurrentUser ? 'font-medium text-charcoal' : `text-stone ${clickableClassName}`}`}
        onClick={handleClick}
        data-testid="presence-name"
      >
        {displayName}
        {isCurrentUser && <span className="text-stone-400 ml-1">(you)</span>}
      </span>

      {popoverAnchor && (
        <UserProfilePopover
          userId={userId}
          anchorRect={popoverAnchor}
          onClose={handleClosePopover}
        />
      )}
    </div>
  );
}
