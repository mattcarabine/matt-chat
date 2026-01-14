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
        className="w-8 h-8 rounded-full bg-forest flex items-center justify-center text-cream font-serif text-sm hover:bg-forest-light transition-colors focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 focus:ring-offset-cream"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="user-menu-button"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-cream border border-stone-300/50 rounded-sm shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-stone-300/30">
            <p className="text-sm font-medium text-charcoal truncate">{fullName}</p>
            {user?.email && <p className="text-xs text-stone truncate">{user.email}</p>}
          </div>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-cream-dark transition-colors"
          >
            <UserIcon className="w-4 h-4 text-stone" />
            Profile
          </Link>

          <Link
            to="/profile?tab=settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-cream-dark transition-colors"
          >
            <SettingsIcon className="w-4 h-4 text-stone" />
            Settings
          </Link>

          <div className="border-t border-stone-300/30 mt-1 pt-1">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-cream-dark transition-colors disabled:opacity-50"
              data-testid="signout-button"
            >
              {isSigningOut ? (
                <SpinnerIcon className="w-4 h-4 text-stone" />
              ) : (
                <SignOutIcon className="w-4 h-4 text-stone" />
              )}
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
