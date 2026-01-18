import { useState, useCallback, MouseEvent } from 'react';
import { UserProfilePopover } from './UserProfilePopover';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSession } from '@/lib/auth-client';

interface PresenceItemProps {
  userId: string;
  displayName: string;
  displayUsername?: string | null;
  isCurrentUser: boolean;
  isOnline?: boolean;
  joinedAt?: string;
}

export function PresenceItem({
  userId,
  displayName,
  displayUsername,
  isCurrentUser,
  isOnline = true,
  joinedAt,
}: PresenceItemProps) {
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);
  const { data: session } = useSession();
  const { user: profileData } = useUserProfile(userId, {
    enabled: popoverAnchor !== null,
  });

  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverAnchor(rect);
  }, []);

  const handleClosePopover = useCallback(() => {
    setPopoverAnchor(null);
  }, []);

  // Build user data for popover
  const popoverUser = popoverAnchor
    ? {
        id: userId,
        displayName,
        username: displayUsername ?? profileData?.username ?? undefined,
        email: isCurrentUser ? session?.user?.email ?? undefined : undefined,
        joinedAt: joinedAt ? new Date(joinedAt) : undefined,
        memberSince: profileData?.memberSince
          ? new Date(profileData.memberSince)
          : undefined,
      }
    : null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center gap-3 py-2 px-1 -mx-1 rounded-lg hover:bg-sand-100 dark:hover:bg-sand-800/50 transition-colors cursor-pointer ${!isOnline ? 'opacity-50' : ''}`}
        data-testid={`presence-item-${userId}`}
      >
        <div className="relative">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-serif ${
              isOnline ? 'bg-forest text-cream' : 'bg-stone-300 text-stone'
            }`}
            data-testid="presence-avatar"
          >
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
          className={`text-sm text-left ${isCurrentUser ? 'font-medium text-charcoal' : 'text-stone'}`}
          data-testid="presence-name"
        >
          {displayName}
          {isCurrentUser && <span className="text-stone-400 ml-1">(you)</span>}
        </span>
      </button>

      {popoverAnchor && popoverUser && (
        <UserProfilePopover
          user={popoverUser}
          isOnline={isOnline}
          isCurrentUser={isCurrentUser}
          anchorRect={popoverAnchor}
          onClose={handleClosePopover}
        />
      )}
    </>
  );
}
