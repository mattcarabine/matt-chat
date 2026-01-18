import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { UserPublicProfile } from '@app/shared';
import { UserProfilePopover } from './UserProfilePopover';
import { useSession } from '@/lib/auth-client';

interface UserProfileTriggerProps {
  userId: string;
  user?: UserPublicProfile;
  isOnline?: boolean;
  placement?: 'left' | 'right';
  onlineStatusSlot?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}

export function UserProfileTrigger({
  userId,
  user,
  isOnline,
  placement = 'right',
  onlineStatusSlot,
  children,
  disabled = false,
}: UserProfileTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (!isOpen) return;

    function handleClose(event: MouseEvent | KeyboardEvent): void {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleClose);
    };
  }, [isOpen]);

  function handleClick(event: React.MouseEvent): void {
    if (disabled || !user) return;
    event.stopPropagation();
    setIsOpen(!isOpen);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || !user}
        className="cursor-pointer text-left disabled:cursor-default"
        data-testid="user-profile-trigger"
        data-user-id={userId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {children}
      </button>

      {isOpen && user && (
        <UserProfilePopover
          user={user}
          isOnline={isOnline}
          placement={placement}
          onlineStatusSlot={onlineStatusSlot}
          currentUserId={currentUserId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
