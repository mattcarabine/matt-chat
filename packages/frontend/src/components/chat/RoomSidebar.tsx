import { Link } from 'react-router-dom';
import { useMyRooms } from '@/hooks/useRooms';
import type { RoomListItem } from '@app/shared';

interface RoomSidebarProps {
  currentRoomSlug: string;
  onCreateRoom: () => void;
  onBrowseRooms: () => void;
}

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

function HomeIcon({ className = 'w-4 h-4', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function HashIcon({ className = 'w-4 h-4', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
    </svg>
  );
}

function PlusIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function SearchIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function ChatBubbleIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}

function RoomItem({ room, isActive }: { room: RoomListItem; isActive: boolean }) {
  const iconClass = isActive ? 'text-cream' : 'text-stone group-hover:text-charcoal';

  return (
    <Link
      to={`/chat/${room.slug}`}
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

      <div className={`
        flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center transition-colors duration-200
        ${isActive ? 'bg-cream/10' : 'bg-stone-300/30 group-hover:bg-stone-300/50'}
      `}>
        {room.isDefault ? <HomeIcon className={`w-4 h-4 ${iconClass}`} /> : <HashIcon className={`w-4 h-4 ${iconClass}`} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-serif text-sm truncate leading-tight ${isActive ? 'text-cream' : 'text-charcoal'}`}>
          {room.name}
        </p>
        <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-cream/60' : 'text-stone'}`}>
          {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-8 h-8 rounded-sm bg-stone-300/40 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-stone-300/40 rounded animate-pulse w-3/4" />
            <div className="h-2.5 bg-stone-300/30 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoomSidebar({ currentRoomSlug, onCreateRoom, onBrowseRooms }: RoomSidebarProps) {
  const { data, isLoading, error } = useMyRooms();
  const rooms = data?.rooms ?? [];

  // Sort rooms: default room first, then alphabetically
  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <aside className="w-56 h-full flex flex-col bg-cream border-r border-stone-300/50">
      {/* Header with actions */}
      <div className="flex-shrink-0 p-3 border-b border-stone-300/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-sm tracking-wide text-charcoal uppercase" style={{ letterSpacing: '0.08em' }}>
            Rooms
          </h2>
          <span className="text-xs text-stone bg-cream-dark px-1.5 py-0.5 rounded">
            {rooms.length}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCreateRoom}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-cream bg-forest rounded-sm hover:bg-forest-light transition-colors duration-200"
          >
            <PlusIcon />
            Create
          </button>
          <button
            onClick={onBrowseRooms}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-charcoal bg-cream-dark rounded-sm hover:bg-stone-300/50 transition-colors duration-200 border border-stone-300/50"
          >
            <SearchIcon />
            Browse
          </button>
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-stone">Failed to load rooms</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-forest hover:underline"
            >
              Try again
            </button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-cream-dark flex items-center justify-center">
              <ChatBubbleIcon className="w-5 h-5 text-stone" />
            </div>
            <p className="text-sm text-stone">No rooms yet</p>
            <p className="text-xs text-stone/70 mt-1">Create or browse rooms to get started</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {sortedRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={room.slug === currentRoomSlug}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-stone-300/30">
        <p className="text-xs text-stone/60 text-center leading-relaxed">
          Click a room to join the conversation
        </p>
      </div>
    </aside>
  );
}
