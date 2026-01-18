import { Link } from 'react-router-dom';

interface DmParticipant {
  id: string;
  displayName: string;
}

interface DmItemProps {
  dm: {
    id: string;
    slug: string;
    dmType: 'one_on_one' | 'group';
    participants: DmParticipant[];
  };
  isActive: boolean;
  isOnline?: boolean;
}

interface IconProps {
  className?: string;
}

function UsersIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function formatParticipantNames(participants: DmParticipant[]): string {
  if (participants.length === 0) return 'No participants';
  if (participants.length === 1) return participants[0].displayName;
  if (participants.length === 2) {
    return `${participants[0].displayName}, ${participants[1].displayName}`;
  }
  const remaining = participants.length - 2;
  return `${participants[0].displayName}, ${participants[1].displayName}, +${remaining}`;
}

function getInitials(participants: DmParticipant[]): string {
  if (participants.length === 0) return '?';
  return participants[0].displayName.charAt(0).toUpperCase();
}

export function DmItem({ dm, isActive, isOnline }: DmItemProps) {
  const isOneOnOne = dm.dmType === 'one_on_one';
  const displayNames = formatParticipantNames(dm.participants);
  const initials = getInitials(dm.participants);

  const iconClass = isActive ? 'text-cream' : 'text-stone group-hover:text-charcoal';

  return (
    <Link
      to={`/dm/${dm.slug}`}
      data-testid={`dm-item-${dm.slug}`}
      data-active={isActive}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-sm
        transition-all duration-200 ease-out
        ${isActive ? 'bg-forest text-cream' : 'text-charcoal hover:bg-cream-dark'}
      `}
    >
      <div className={`
        absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full transition-all duration-200
        ${isActive ? 'bg-cream/60' : 'bg-transparent group-hover:bg-forest/30'}
      `} />

      <div className="relative flex-shrink-0">
        {isOneOnOne ? (
          <>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-serif transition-colors duration-200
              ${isActive ? 'bg-cream/20 text-cream' : 'bg-stone-300/50 text-charcoal group-hover:bg-stone-300/70'}
            `}>
              {initials}
            </div>
            {isOnline !== undefined && (
              <div
                className={`
                  absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2
                  ${isActive ? 'border-forest' : 'border-cream'}
                  ${isOnline ? 'bg-green-500' : 'bg-stone-400'}
                `}
                data-testid="dm-online-indicator"
              />
            )}
          </>
        ) : (
          <div className={`
            w-8 h-8 rounded-sm flex items-center justify-center transition-colors duration-200
            ${isActive ? 'bg-cream/10' : 'bg-stone-300/30 group-hover:bg-stone-300/50'}
          `}>
            <UsersIcon className={`w-4 h-4 ${iconClass}`} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-serif text-sm truncate leading-tight ${isActive ? 'text-cream' : 'text-charcoal'}`}>
          {displayNames}
        </p>
        <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-cream/60' : 'text-stone'}`}>
          {isOneOnOne ? 'Direct message' : `${dm.participants.length + 1} people`}
        </p>
      </div>
    </Link>
  );
}
