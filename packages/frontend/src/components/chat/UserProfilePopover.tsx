import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

interface UserProfilePopoverProps {
  user: {
    id: string;
    displayName: string;
    username?: string;
    email?: string; // Only provided for self
    joinedAt?: Date; // When they joined the room (optional)
    memberSince?: Date; // Account creation date
  };
  isOnline: boolean;
  isCurrentUser: boolean;
  anchorRect: DOMRect; // Position relative to clicked element
  onClose: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function calculatePosition(
  anchorRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number
): { top: number; left: number } {
  const padding = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Default: position below and centered on the anchor
  let top = anchorRect.bottom + padding;
  let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;

  // Adjust if overflowing right edge
  if (left + popoverWidth > viewportWidth - padding) {
    left = viewportWidth - popoverWidth - padding;
  }

  // Adjust if overflowing left edge
  if (left < padding) {
    left = padding;
  }

  // Adjust if overflowing bottom - show above instead
  if (top + popoverHeight > viewportHeight - padding) {
    top = anchorRect.top - popoverHeight - padding;
  }

  // Adjust if overflowing top (last resort, keep in viewport)
  if (top < padding) {
    top = padding;
  }

  return { top, left };
}

export function UserProfilePopover({
  user,
  isOnline,
  isCurrentUser,
  anchorRect,
  onClose,
}: UserProfilePopoverProps): JSX.Element {
  const popoverRef = useRef<HTMLDivElement>(null);
  const initial = user.displayName.charAt(0).toUpperCase();

  // Calculate position once we have the popover dimensions
  useEffect(() => {
    if (!popoverRef.current) return;

    const popoverRect = popoverRef.current.getBoundingClientRect();
    const { top, left } = calculatePosition(
      anchorRect,
      popoverRect.width,
      popoverRect.height
    );

    popoverRef.current.style.top = `${top}px`;
    popoverRef.current.style.left = `${left}px`;
    popoverRef.current.style.opacity = '1';
  }, [anchorRect]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (popoverRef.current?.contains(event.target as Node)) return;
      onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const popoverContent = (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`${user.displayName}'s profile`}
      className="fixed z-50 w-64 glass rounded-xl shadow-xl animate-fade-up opacity-0"
      style={{ top: 0, left: 0 }}
      data-testid="user-profile-popover"
    >
      {/* Header with avatar and basic info */}
      <div className="p-4 flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-serif text-xl flex-shrink-0 ${
            isCurrentUser ? 'bg-forest' : 'bg-terracotta'
          }`}
          data-testid="user-profile-avatar"
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-sand-900 dark:text-sand-50 truncate"
            data-testid="user-profile-display-name"
          >
            {user.displayName}
          </p>
          {user.username && (
            <p
              className="text-sm text-sand-500 dark:text-sand-400 truncate"
              data-testid="user-profile-username"
            >
              @{user.username}
            </p>
          )}
          <div
            className="flex items-center gap-1.5 mt-1"
            data-testid="user-profile-status"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? 'bg-green-500'
                  : 'bg-sand-400 dark:bg-sand-600'
              }`}
              aria-hidden="true"
            />
            <span className="text-xs text-sand-500 dark:text-sand-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="px-4 py-3 border-t border-sand-200 dark:border-sand-700 space-y-2">
        {user.joinedAt && (
          <div
            className="flex items-center text-sm text-sand-600 dark:text-sand-400"
            data-testid="user-profile-joined-room"
          >
            <span className="text-sand-500 dark:text-sand-500">
              Joined room:
            </span>
            <span className="ml-1.5">{formatDate(user.joinedAt)}</span>
          </div>
        )}
        {user.memberSince && (
          <div
            className="flex items-center text-sm text-sand-600 dark:text-sand-400"
            data-testid="user-profile-member-since"
          >
            <span className="text-sand-500 dark:text-sand-500">
              Member since:
            </span>
            <span className="ml-1.5">{formatShortDate(user.memberSince)}</span>
          </div>
        )}
        {isCurrentUser && user.email && (
          <div
            className="flex items-center text-sm text-sand-600 dark:text-sand-400"
            data-testid="user-profile-email"
          >
            <span className="truncate">{user.email}</span>
          </div>
        )}
      </div>

      {/* Actions section - only for current user */}
      {isCurrentUser && (
        <div className="px-4 py-3 border-t border-sand-200 dark:border-sand-700">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-ember-600 dark:text-ember-400 hover:bg-sand-100 dark:hover:bg-sand-800/50 rounded-lg transition-colors"
            data-testid="user-profile-edit-link"
          >
            Edit Profile
          </Link>
        </div>
      )}
    </div>
  );

  return createPortal(popoverContent, document.body);
}
