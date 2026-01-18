import type { UserPublicProfile } from '@app/shared';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDmMutations } from '@/hooks/useDms';
import { ChatIcon, SpinnerIcon } from '@/components/icons';

interface UserProfilePopoverProps {
  user: UserPublicProfile;
  isOnline?: boolean;
  placement?: 'left' | 'right';
  onlineStatusSlot?: ReactNode;
  currentUserId?: string;
  onClose?: () => void;
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
  currentUserId,
  onClose,
}: UserProfilePopoverProps) {
  const memberSince = formatMemberSince(user.createdAt);
  const navigate = useNavigate();
  const { createOrGetDm, isCreating } = useDmMutations();
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUserId === user.id;

  async function handleMessageClick(): Promise<void> {
    setError(null);
    try {
      const result = await createOrGetDm({ participantIds: [user.id] });
      navigate(`/dm/${result.dm.slug}`);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    }
  }

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

      {/* Message button - only show if not viewing own profile */}
      {!isOwnProfile && (
        <div className="mt-3">
          <button
            type="button"
            onClick={handleMessageClick}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-ember-500 hover:bg-ember-600 disabled:bg-ember-400 text-white rounded-lg font-medium transition-colors"
            data-testid="user-profile-message-button"
          >
            {isCreating ? (
              <>
                <SpinnerIcon className="w-4 h-4" />
                <span>Starting...</span>
              </>
            ) : (
              <>
                <ChatIcon className="w-4 h-4" />
                <span>Message</span>
              </>
            )}
          </button>
          {error && (
            <p className="mt-2 text-xs text-red-500 text-center" data-testid="user-profile-message-error">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
