import { useRef, useEffect } from 'react';
import type { UserProfile } from '@app/shared';
import { getAvatarColor, formatMemberSince } from '@/lib/userProfile';

interface Position {
  x: number;
  y: number;
}

interface UserProfilePopupProps {
  user: UserProfile;
  position: Position;
  onClose: () => void;
}

export function UserProfilePopup({ user, position, onClose }: UserProfilePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const avatarColor = getAvatarColor(user.id);
  const initial = user.displayName.charAt(0).toUpperCase();
  const showUsername = user.username && user.username !== user.displayName;
  const memberSince = formatMemberSince(user.createdAt);

  useEffect(() => {
    function handleClose(event: MouseEvent | KeyboardEvent): void {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && popupRef.current?.contains(event.target as Node)) return;
      onClose();
    }

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleClose);
    };
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      data-testid="user-profile-popup"
      className="fixed glass rounded-xl shadow-xl p-4 z-50 animate-fade-up min-w-[200px]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Avatar */}
      <div className="flex justify-center mb-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-serif ${avatarColor.bg} ${avatarColor.text}`}
          data-testid="user-profile-avatar"
        >
          {initial}
        </div>
      </div>

      {/* Display Name */}
      <h3
        className="text-lg font-semibold text-sand-900 dark:text-sand-50 text-center"
        data-testid="user-profile-displayname"
      >
        {user.displayName}
      </h3>

      {/* Username (if different from displayName) */}
      {showUsername && (
        <p
          className="text-sm text-sand-500 dark:text-sand-400 text-center mt-0.5"
          data-testid="user-profile-username"
        >
          @{user.username}
        </p>
      )}

      {/* Member since */}
      <p
        className="text-xs text-sand-400 dark:text-sand-500 text-center mt-3 pt-3 border-t border-sand-200 dark:border-sand-700"
        data-testid="user-profile-member-since"
      >
        Member since {memberSince}
      </p>
    </div>
  );
}
