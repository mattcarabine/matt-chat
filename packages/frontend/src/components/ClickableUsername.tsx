import { useRef, useState, type ReactNode } from 'react';
import { UserProfilePopover } from './UserProfilePopover';

interface ClickableUsernameProps {
  userId: string;
  displayName: string;
  isOnline?: boolean;
  className?: string;
  children?: ReactNode;
}

export function ClickableUsername({
  userId,
  displayName,
  isOnline,
  className = '',
  children,
}: ClickableUsernameProps): JSX.Element {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClick = (): void => {
    setIsPopoverOpen(true);
  };

  const handleClose = (): void => {
    setIsPopoverOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        className={`cursor-pointer hover:text-ember-600 dark:hover:text-ember-400 hover:underline transition-colors duration-150 text-left ${className}`}
        data-testid="clickable-username"
      >
        {children ?? displayName}
      </button>
      {isPopoverOpen && (
        <UserProfilePopover
          userId={userId}
          triggerRef={triggerRef}
          onClose={handleClose}
          isOnline={isOnline}
        />
      )}
    </>
  );
}
