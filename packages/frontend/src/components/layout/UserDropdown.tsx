import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession, signOut, type User } from '@/lib/auth-client';
import { UserIcon, SettingsIcon, SignOutIcon, SpinnerIcon } from '@/components/icons';

export function UserDropdown(): JSX.Element {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user as User | undefined;
  const fullName = user?.fullName || user?.name || 'User';
  const initial = fullName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!isOpen) return;

    function handleClose(event: MouseEvent | KeyboardEvent): void {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && dropdownRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleClose);
    };
  }, [isOpen]);

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true);
    await signOut();
    navigate('/signin');
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center text-white font-medium text-sm shadow-md shadow-ember-500/20 hover:shadow-lg hover:shadow-ember-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ember-500 focus:ring-offset-2 focus:ring-offset-sand-50 dark:focus:ring-offset-sand-900"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="user-menu-button"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-xl py-1 z-50 animate-fade-up">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-sand-200 dark:border-sand-700" data-testid="user-dropdown-info">
            <p className="text-sm font-medium text-sand-900 dark:text-sand-50 truncate" data-testid="user-dropdown-name">{fullName}</p>
            {user?.email && (
              <p className="text-xs text-sand-500 dark:text-sand-400 truncate" data-testid="user-dropdown-email">{user.email}</p>
            )}
          </div>

          {/* Navigation links */}
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-sand-700 dark:text-sand-300 hover:bg-sand-100 dark:hover:bg-sand-800/50 transition-colors"
              data-testid="user-dropdown-profile"
            >
              <UserIcon className="w-4 h-4 text-sand-500 dark:text-sand-400" />
              Profile
            </Link>

            <Link
              to="/profile?tab=settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-sand-700 dark:text-sand-300 hover:bg-sand-100 dark:hover:bg-sand-800/50 transition-colors"
              data-testid="user-dropdown-settings"
            >
              <SettingsIcon className="w-4 h-4 text-sand-500 dark:text-sand-400" />
              Settings
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-sand-200 dark:border-sand-700 mt-1 pt-1">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-sand-700 dark:text-sand-300 hover:bg-sand-100 dark:hover:bg-sand-800/50 transition-colors disabled:opacity-50"
              data-testid="signout-button"
            >
              {isSigningOut ? (
                <SpinnerIcon className="w-4 h-4 text-sand-500" />
              ) : (
                <SignOutIcon className="w-4 h-4 text-sand-500 dark:text-sand-400" />
              )}
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
