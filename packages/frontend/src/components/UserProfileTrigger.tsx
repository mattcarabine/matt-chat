import { useState, useRef, useCallback, type ReactNode, type MouseEvent } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserProfilePopup } from '@/components/UserProfilePopup';
import { SpinnerIcon } from '@/components/icons';

interface Position {
  x: number;
  y: number;
}

interface UserProfileTriggerProps {
  userId: string;
  children: ReactNode;
}

const POPUP_HEIGHT_ESTIMATE = 180; // Approximate popup height for positioning
const POPUP_MARGIN = 8; // Gap between trigger and popup

export function UserProfileTrigger({ userId, children }: UserProfileTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const { data: user, isLoading, error } = useUserProfile(userId);

  const calculatePosition = useCallback((rect: DOMRect): Position => {
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine vertical position: below if enough space, otherwise above
    let y: number;
    if (spaceBelow >= POPUP_HEIGHT_ESTIMATE + POPUP_MARGIN) {
      // Position below the trigger
      y = rect.bottom + POPUP_MARGIN;
    } else if (spaceAbove >= POPUP_HEIGHT_ESTIMATE + POPUP_MARGIN) {
      // Position above the trigger
      y = rect.top - POPUP_HEIGHT_ESTIMATE - POPUP_MARGIN;
    } else {
      // Default to below if neither fits well
      y = rect.bottom + POPUP_MARGIN;
    }

    // Horizontal position: align with left edge of trigger
    const x = rect.left;

    return { x, y };
  }, []);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const newPosition = calculatePosition(rect);
      setPosition(newPosition);
      setIsOpen(true);
    },
    [calculatePosition]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Determine what to show in the popup area
  const showLoading = isOpen && isLoading;
  const showError = isOpen && !isLoading && (error || !user);
  const showPopup = isOpen && !isLoading && user && !error;

  return (
    <>
      <span
        ref={triggerRef}
        onClick={handleClick}
        className="cursor-pointer hover:underline"
        data-testid="user-profile-trigger"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as unknown as MouseEvent);
          }
        }}
      >
        {children}
      </span>

      {showLoading && (
        <div
          className="fixed glass rounded-xl shadow-xl p-4 z-50 flex items-center justify-center min-w-[200px]"
          style={{
            left: position.x,
            top: position.y,
          }}
          data-testid="user-profile-loading"
        >
          <SpinnerIcon className="w-6 h-6 border-ember-500 border-t-transparent" />
        </div>
      )}

      {showError && (
        <div
          className="fixed glass rounded-xl shadow-xl p-4 z-50 min-w-[200px]"
          style={{
            left: position.x,
            top: position.y,
          }}
          data-testid="user-profile-error"
        >
          <p className="text-sm text-sand-500 dark:text-sand-400 text-center">
            Unable to load profile
          </p>
          <button
            onClick={handleClose}
            className="mt-2 w-full text-xs text-sand-400 hover:text-sand-600 dark:hover:text-sand-300"
          >
            Close
          </button>
        </div>
      )}

      {showPopup && (
        <UserProfilePopup user={user} position={position} onClose={handleClose} />
      )}
    </>
  );
}
