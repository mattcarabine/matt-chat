import type { UserPublicProfile } from '@app/shared';
import type { ReactNode } from 'react';

interface UserProfilePopoverProps {
  user: UserPublicProfile;
  isOnline?: boolean;
  placement?: 'left' | 'right';
  onlineStatusSlot?: ReactNode;
}

function formatMemberSince(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function UserProfilePopover({
  user,
  isOnline,
  placement = 'right',
  onlineStatusSlot,
}: UserProfilePopoverProps) {
  const memberSince = formatMemberSince(user.createdAt);

  return (
    <div
      className={`absolute z-50 w-64 glass rounded-xl shadow-xl p-4 animate-fade-up ${
        placement === 'left' ? 'right-0' : 'left-0'
      } top-full mt-2`}
      data-testid="user-profile-popover"
    >
      {/* Avatar */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-serif bg-ember-500 text-white"
            data-testid="user-profile-avatar"
          >
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          {/* Online status indicator */}
          {onlineStatusSlot ? (
            onlineStatusSlot
          ) : isOnline !== undefined && (
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-sand-50 dark:border-sand-900 ${
                isOnline ? 'bg-green-500' : 'bg-sand-400'
              }`}
              data-testid="user-profile-status"
            />
          )}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sand-900 dark:text-sand-50 truncate"
            data-testid="user-profile-name"
          >
            {user.displayName}
          </h3>
          {user.username && (
            <p
              className="text-sm text-sand-500 dark:text-sand-400 truncate"
              data-testid="user-profile-username"
            >
              @{user.username}
            </p>
          )}
        </div>
      </div>

      {/* Member since */}
      <div className="mt-4 pt-3 border-t border-sand-200 dark:border-sand-700">
        <p
          className="text-xs text-sand-500 dark:text-sand-400"
          data-testid="user-profile-member-since"
        >
          Member since {memberSince}
        </p>
      </div>
    </div>
  );
}
