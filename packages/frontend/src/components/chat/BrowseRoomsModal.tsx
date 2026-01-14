import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomSearch, useRoomMutations } from '@/hooks/useRooms';
import type { RoomSearchResult } from '@app/shared';

interface BrowseRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function HashIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function InfoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="px-6 py-8 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cream-dark flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm text-charcoal font-medium">{title}</p>
      <p className="text-xs text-stone mt-1">{subtitle}</p>
    </div>
  );
}

function RoomSearchItem({ room, onJoin, isJoining }: { room: RoomSearchResult; onJoin: (slug: string) => void; isJoining: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-cream-dark/50 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-stone-300/30 flex items-center justify-center">
        <HashIcon className="w-5 h-5 text-stone" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm text-charcoal truncate">{room.name}</p>
        {room.description && <p className="text-xs text-stone truncate mt-0.5">{room.description}</p>}
        <p className="text-xs text-stone/70 mt-0.5">
          {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>

      {room.isMember ? (
        <span className="text-xs text-forest font-medium px-2 py-1 bg-forest/10 rounded-sm">Joined</span>
      ) : (
        <button
          onClick={() => onJoin(room.slug)}
          disabled={isJoining}
          className="px-3 py-1.5 text-xs font-medium text-cream bg-forest rounded-sm hover:bg-forest-light transition-colors disabled:opacity-50"
        >
          {isJoining ? 'Joining...' : 'Join'}
        </button>
      )}
    </div>
  );
}

export function BrowseRoomsModal({ isOpen, onClose }: BrowseRoomsModalProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading } = useRoomSearch(searchQuery);
  const { joinRoom, isJoining } = useRoomMutations();
  const [joiningSlug, setJoiningSlug] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (slug: string) => {
    setJoiningSlug(slug);
    try {
      await joinRoom(slug);
      onClose();
      navigate(`/chat/${slug}`);
    } catch (err) {
      console.error('Failed to join room:', err);
    } finally {
      setJoiningSlug(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const rooms = searchResults?.rooms ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-cream rounded-sm shadow-xl max-w-lg w-full mx-4 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-stone-300/50">
          <h2 className="font-serif text-xl text-charcoal">Browse Rooms</h2>
          <p className="text-sm text-stone mt-1">
            Find and join public rooms
          </p>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-b border-stone-300/30">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="w-full pl-10 pr-4 py-2.5 rounded-sm border border-stone-300/50 bg-cream-dark/50 text-charcoal placeholder:text-stone/50 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-6 py-8 text-center">
              <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-stone mt-3">{searchQuery ? 'Searching...' : 'Loading popular rooms...'}</p>
            </div>
          ) : rooms.length === 0 ? (
            <EmptyState
              icon={<InfoIcon className="w-6 h-6 text-stone" />}
              title={searchQuery ? 'No rooms found' : 'No rooms available'}
              subtitle={searchQuery ? 'Try a different search term' : 'All rooms have been joined or none exist yet'}
            />
          ) : (
            <div>
              {!searchQuery && (
                <div className="px-4 py-2 bg-cream-dark/30 border-b border-stone-300/30">
                  <p className="text-xs font-medium text-stone uppercase tracking-wide">Popular Rooms</p>
                </div>
              )}
              <div className="divide-y divide-stone-300/30">
                {rooms.map((room) => (
                  <RoomSearchItem
                    key={room.id}
                    room={room}
                    onJoin={handleJoin}
                    isJoining={isJoining && joiningSlug === room.slug}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-6 py-4 bg-cream-dark/50 border-t border-stone-300/30 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
