import { useState, useRef, useEffect, type ReactNode } from 'react';
import { UserProfilePopover } from './UserProfilePopover';

interface UserProfileTriggerProps {
  userId: string;
  displayName: string;
  isOnline?: boolean;
  placement?: 'left' | 'right';
  children: ReactNode;
}

export function UserProfileTrigger({
  userId,
  displayName,
  isOnline,
  placement = 'right',
  children,
}: UserProfileTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent): void {
      if (!triggerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const positionClass = placement === 'left' ? 'right-full mr-2' : 'left-full ml-2';

  return (
    <div className="relative inline-block" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer text-left"
        data-testid={`user-profile-trigger-${userId}`}
      >
        {children}
      </button>

      {isOpen && (
        <div className={`absolute top-0 ${positionClass} z-50`}>
          <UserProfilePopover
            userId={userId}
            displayName={displayName}
            isOnline={isOnline}
          />
        </div>
      )}
    </div>
  );
}
