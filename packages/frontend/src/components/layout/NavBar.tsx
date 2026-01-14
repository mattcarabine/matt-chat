import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from '@/lib/auth-client';
import { useInvitationCount } from '@/hooks/useInvitations';
import { DEFAULT_ROOM_SLUG } from '@app/shared';

export type NavSection = 'dashboard' | 'chat' | 'invitations';

interface NavBarProps {
  currentSection: NavSection;
}

function DashboardIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ChatIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function InboxIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  );
}

function SignOutIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}

export function NavBar({ currentSection }: NavBarProps) {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: countData } = useInvitationCount();
  const invitationCount = countData?.count ?? 0;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/signin');
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      href: '/dashboard',
      icon: DashboardIcon,
    },
    {
      id: 'chat' as const,
      label: 'Chat',
      href: `/chat/${DEFAULT_ROOM_SLUG}`,
      icon: ChatIcon,
    },
    {
      id: 'invitations' as const,
      label: 'Invitations',
      href: '/invitations',
      icon: InboxIcon,
      badge: invitationCount > 0 ? invitationCount : undefined,
    },
  ];

  return (
    <nav className="flex-shrink-0 border-b border-stone-300/50 bg-cream">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
                <DashboardIcon className="w-4 h-4 text-cream" />
              </div>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentSection === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`
                      flex items-center gap-2 px-3 py-2 text-sm rounded-sm transition-colors
                      ${isActive
                        ? 'text-charcoal bg-cream-dark font-medium'
                        : 'text-stone hover:text-charcoal hover:bg-cream-dark/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-terracotta text-cream rounded-full min-w-[18px]">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-stone hover:text-charcoal transition-colors disabled:opacity-50"
              data-testid="signout-button"
            >
              {isSigningOut ? (
                <span className="spinner w-4 h-4" />
              ) : (
                <SignOutIcon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
