import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { CalendarIcon, UsersIcon } from '@/components/icons';

interface UserProfilePopoverProps {
  userId: string;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  isOnline?: boolean;
}

function formatMemberSince(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function LoadingSkeleton(): JSX.Element {
  return (
    <div className="p-4 space-y-3 animate-pulse" data-testid="profile-popover-loading">
      {/* Avatar and name skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-sand-200 dark:bg-sand-700" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-sand-200 dark:bg-sand-700 rounded" />
          <div className="h-3 w-16 bg-sand-200 dark:bg-sand-700 rounded" />
        </div>
      </div>
      {/* Bio skeleton */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-sand-200 dark:bg-sand-700 rounded" />
        <div className="h-3 w-3/4 bg-sand-200 dark:bg-sand-700 rounded" />
      </div>
      {/* Footer skeleton */}
      <div className="flex gap-4 pt-2">
        <div className="h-3 w-20 bg-sand-200 dark:bg-sand-700 rounded" />
        <div className="h-3 w-20 bg-sand-200 dark:bg-sand-700 rounded" />
      </div>
    </div>
  );
}

export function UserProfilePopover({
  userId,
  triggerRef,
  onClose,
  isOnline,
}: UserProfilePopoverProps): JSX.Element | null {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const { data, isLoading } = useUserProfile(userId);

  // Calculate position adjacent to trigger element
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const updatePosition = (): void => {
      const triggerRect = trigger.getBoundingClientRect();
      const popoverWidth = 280;
      const popoverHeight = 200; // estimated max height
      const padding = 8;

      let top = triggerRect.bottom + padding;
      let left = triggerRect.left;

      // Flip above if near bottom of viewport
      if (top + popoverHeight > window.innerHeight - padding) {
        top = triggerRect.top - popoverHeight - padding;
      }

      // Flip left if near right edge of viewport
      if (left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }

      // Ensure not off left edge
      if (left < padding) {
        left = padding;
      }

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [triggerRef]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  // Escape key to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const profile = data;

  const content = (
    <div
      ref={popoverRef}
      data-testid="user-profile-popover"
      className="fixed z-50 w-[280px] glass rounded-lg animate-fade-up overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : profile ? (
        <div className="p-4">
          {/* Header with avatar and names */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center text-white font-medium text-lg shadow-md shadow-ember-500/20">
                {(profile.displayName || profile.username).charAt(0).toUpperCase()}
              </div>
              {/* Online indicator */}
              {isOnline !== undefined && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-sand-50 dark:border-sand-900 ${
                    isOnline ? 'bg-green-500' : 'bg-sand-400'
                  }`}
                  data-testid="online-indicator"
                />
              )}
            </div>

            {/* Names */}
            <div className="flex-1 min-w-0">
              <p
                className="font-medium text-sand-900 dark:text-sand-50 truncate"
                data-testid="profile-display-name"
              >
                {profile.displayName || profile.username}
              </p>
              <p
                className="text-sm text-sand-500 dark:text-sand-400 truncate"
                data-testid="profile-username"
              >
                @{profile.username}
              </p>
            </div>
          </div>

          {/* Bio (only if exists) */}
          {profile.bio && (
            <p
              className="mt-3 text-sm text-sand-600 dark:text-sand-300 leading-relaxed"
              data-testid="profile-bio"
            >
              {profile.bio}
            </p>
          )}

          {/* Footer stats */}
          <div className="mt-3 pt-3 border-t border-sand-200 dark:border-sand-700 flex items-center gap-4 text-xs text-sand-500 dark:text-sand-400">
            <div className="flex items-center gap-1.5" data-testid="profile-member-since">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{formatMemberSince(profile.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5" data-testid="profile-shared-rooms">
              <UsersIcon className="w-3.5 h-3.5" />
              <span>{profile.sharedRoomsCount} shared {profile.sharedRoomsCount === 1 ? 'room' : 'rooms'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-sand-500 dark:text-sand-400">
          User not found
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
