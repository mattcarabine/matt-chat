import { Link } from 'react-router-dom';
import { useInvitationCount } from '@/hooks/useInvitations';
import { ChatIcon, InboxIcon } from '@/components/icons';
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
    <nav className="flex-shrink-0 border-b border-stone-300/50 bg-cream">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link to="/chat" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
                <ChatIcon className="w-4 h-4 text-cream" />
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentSection === item.id;
                const Icon = item.icon;
                const badge = item.id === 'invitations' && invitationCount > 0 ? invitationCount : undefined;

                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-sm transition-colors ${
                      isActive
                        ? 'text-charcoal bg-cream-dark font-medium'
                        : 'text-stone hover:text-charcoal hover:bg-cream-dark/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                    {badge !== undefined && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-terracotta text-cream rounded-full min-w-[18px]">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <UserDropdown />
        </div>
      </div>
    </nav>
  );
}
