import { Link } from 'react-router-dom';
import { useInvitationCount } from '@/hooks/useInvitations';
import { ChatIcon, InboxIcon } from '@/components/icons';
import { MattChatLogo } from '@/components/MattChatLogo';
import { UserDropdown } from './UserDropdown';

export type NavSection = 'chat' | 'invitations' | 'profile';

interface NavBarProps {
  currentSection: NavSection;
}

const NAV_ITEMS = [
  { id: 'chat' as const, label: 'Chat', href: '/chat', icon: ChatIcon },
  { id: 'invitations' as const, label: 'Invitations', href: '/invitations', icon: InboxIcon },
];

export function NavBar({ currentSection }: NavBarProps): JSX.Element {
  const { data: countData } = useInvitationCount();
  const invitationCount = countData?.count ?? 0;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b-0">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo and brand */}
          <div className="flex items-center gap-8">
            <Link
              to="/chat"
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <MattChatLogo showWordmark />
            </Link>

            {/* Navigation links */}
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentSection === item.id;
                const Icon = item.icon;
                const badge = item.id === 'invitations' && invitationCount > 0 ? invitationCount : undefined;

                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`
                      relative flex items-center gap-2 px-3 py-2 text-sm rounded-lg
                      transition-all duration-200
                      ${isActive
                        ? 'text-ember-600 dark:text-ember-400 bg-ember-50 dark:bg-ember-500/10 font-medium'
                        : 'text-sand-600 dark:text-sand-400 hover:text-sand-900 dark:hover:text-sand-100 hover:bg-sand-100 dark:hover:bg-sand-800/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                    {badge !== undefined && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold bg-ember-500 text-white rounded-full min-w-[18px] tabular-nums">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                    {/* Active indicator line */}
                    {isActive && (
                      <span className="absolute -bottom-[1px] left-3 right-3 h-0.5 bg-ember-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User dropdown */}
          <UserDropdown />
        </div>
      </div>
    </nav>
  );
}
