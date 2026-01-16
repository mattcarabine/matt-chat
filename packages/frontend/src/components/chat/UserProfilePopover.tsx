import { useUserProfile } from '@/hooks/useUserProfile';

interface UserProfilePopoverProps {
  userId: string;
  displayName: string;
  isOnline?: boolean;
}

function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function UserProfilePopover({
  userId,
  displayName,
  isOnline,
}: UserProfilePopoverProps) {
  const { data: profile, isLoading } = useUserProfile(userId);

  const name = profile?.displayName ?? displayName;
  const username = profile?.username;
  const memberSince = profile?.createdAt ? formatMemberSince(profile.createdAt) : null;

  return (
    <div
      className="w-64 glass rounded-xl shadow-xl p-4 animate-fade-up"
      data-testid="user-profile-popover"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-terracotta flex items-center justify-center text-cream font-serif text-xl">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-sand-900 dark:text-sand-50 truncate"
            data-testid="user-profile-name"
          >
            {name}
          </p>
          {username && (
            <p
              className="text-sm text-sand-500 dark:text-sand-400 truncate"
              data-testid="user-profile-username"
            >
              @{username}
            </p>
          )}
        </div>
      </div>

      {isOnline !== undefined && (
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-sand-400'}`}
            data-testid="user-profile-status-indicator"
          />
          <span
            className="text-sm text-sand-600 dark:text-sand-300"
            data-testid="user-profile-status"
          >
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      )}

      {isLoading && (
        <div className="h-4 bg-sand-200 dark:bg-sand-700 rounded animate-pulse w-32" />
      )}
      {!isLoading && memberSince && (
        <p
          className="text-xs text-sand-500 dark:text-sand-400"
          data-testid="user-profile-member-since"
        >
          Member since {memberSince}
        </p>
      )}
    </div>
  );
}
