import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserIcon } from '@/components/icons';

interface UserProfilePopoverProps {
  userId: string;
  anchorRect: DOMRect;
  onClose: () => void;
  isCurrentUser?: boolean;
}

function CalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function EnvelopeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function AtSymbolIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 w-72 animate-pulse" data-testid="profile-popover-loading">
      {/* Avatar skeleton */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-sand-200 dark:bg-sand-700" />
        <div className="flex-1">
          <div className="h-5 bg-sand-200 dark:bg-sand-700 rounded w-32 mb-2" />
          <div className="h-4 bg-sand-200 dark:bg-sand-700 rounded w-24" />
        </div>
      </div>
      {/* Details skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-sand-200 dark:bg-sand-700 rounded w-full" />
        <div className="h-4 bg-sand-200 dark:bg-sand-700 rounded w-3/4" />
      </div>
    </div>
  );
}

function formatMemberSince(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function UserProfilePopover({
  userId,
  anchorRect,
  onClose,
  isCurrentUser = false,
}: UserProfilePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { data: profile, isLoading, error } = useUserProfile(userId);

  // Calculate position on mount and when anchor changes
  useEffect(() => {
    if (!popoverRef.current) return;

    const popoverWidth = 288; // w-72 = 18rem = 288px
    const popoverHeight = popoverRef.current.offsetHeight || 280;
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default: position below and to the right of anchor
    let top = anchorRect.bottom + padding;
    let left = anchorRect.left;

    // Flip to above if would overflow bottom
    if (top + popoverHeight > viewportHeight - padding) {
      top = anchorRect.top - popoverHeight - padding;
    }

    // Adjust horizontal position if would overflow right
    if (left + popoverWidth > viewportWidth - padding) {
      left = viewportWidth - popoverWidth - padding;
    }

    // Ensure doesn't overflow left
    if (left < padding) {
      left = padding;
    }

    setPosition({ top, left });
  }, [anchorRect]);

  // Handle click outside and escape key
  useEffect(() => {
    function handleClose(event: MouseEvent | KeyboardEvent): void {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && popoverRef.current?.contains(event.target as Node)) return;
      onClose();
    }

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleClose);
    };
  }, [onClose]);

  const profileUrl = isCurrentUser ? '/profile' : `/profile/${userId}`;

  return (
    <div
      ref={popoverRef}
      className="fixed glass rounded-xl shadow-xl z-50 animate-fade-up overflow-hidden"
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-label="User profile"
      data-testid="user-profile-popover"
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="p-4 w-72 text-center" data-testid="profile-popover-error">
          <p className="text-sm text-sand-500 dark:text-sand-400">
            Failed to load profile
          </p>
        </div>
      ) : profile ? (
        <div className="w-72">
          {/* Header with avatar and name */}
          <div className="p-4 pb-3">
            <div className="flex items-start gap-4">
              {/* Large avatar */}
              <div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center text-white font-display text-2xl shadow-lg shadow-ember-500/20 flex-shrink-0"
                data-testid="profile-popover-avatar"
              >
                {profile.image ? (
                  <img
                    src={profile.image}
                    alt={profile.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  profile.displayName.charAt(0).toUpperCase()
                )}
              </div>

              {/* Name and username */}
              <div className="flex-1 min-w-0 pt-1">
                <h3
                  className="text-lg font-semibold text-sand-900 dark:text-sand-50 truncate"
                  data-testid="profile-popover-name"
                >
                  {profile.displayName}
                </h3>
                {profile.username && (
                  <p
                    className="text-sm text-sand-500 dark:text-sand-400 truncate flex items-center gap-1"
                    data-testid="profile-popover-username"
                  >
                    <AtSymbolIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    {profile.username}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-sand-200 dark:border-sand-700" />

          {/* Details section */}
          <div className="p-4 pt-3 space-y-2.5">
            {/* Email */}
            <div className="flex items-center gap-2.5 text-sm" data-testid="profile-popover-email">
              <EnvelopeIcon className="w-4 h-4 text-sand-400 dark:text-sand-500 flex-shrink-0" />
              <span className="text-sand-600 dark:text-sand-300 truncate">
                {profile.email}
              </span>
            </div>

            {/* Member since */}
            <div className="flex items-center gap-2.5 text-sm" data-testid="profile-popover-member-since">
              <CalendarIcon className="w-4 h-4 text-sand-400 dark:text-sand-500 flex-shrink-0" />
              <span className="text-sand-600 dark:text-sand-300">
                Member since {formatMemberSince(profile.createdAt)}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-sand-200 dark:border-sand-700" />

          {/* View Profile link */}
          <div className="p-2">
            <Link
              to={profileUrl}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-ember-600 dark:text-ember-400 hover:bg-ember-50 dark:hover:bg-ember-500/10 rounded-lg transition-colors"
              data-testid="profile-popover-view-link"
            >
              <UserIcon className="w-4 h-4" />
              View Profile
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
