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
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sand-100 dark:bg-sand-800 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm text-sand-900 dark:text-sand-50 font-medium">{title}</p>
      <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">{subtitle}</p>
    </div>
  );
}

function RoomSearchItem({ room, onJoin, isJoining }: { room: RoomSearchResult; onJoin: (slug: string) => void; isJoining: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-sand-100 dark:hover:bg-sand-800/50 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-sand-200 dark:bg-sand-700 flex items-center justify-center">
        <HashIcon className="w-5 h-5 text-sand-500 dark:text-sand-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-sand-900 dark:text-sand-50 truncate">{room.name}</p>
        {room.description && <p className="text-xs text-sand-500 dark:text-sand-400 truncate mt-0.5">{room.description}</p>}
        <p className="text-xs text-sand-400 dark:text-sand-500 mt-0.5">
          {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>

      {room.isMember ? (
        <span className="text-xs text-ember-600 dark:text-ember-400 font-medium px-2 py-1 bg-ember-50 dark:bg-ember-500/10 rounded-md">Joined</span>
      ) : (
        <button
          onClick={() => onJoin(room.slug)}
          disabled={isJoining}
          className="px-3 py-1.5 text-xs font-medium text-white bg-ember-500 rounded-md hover:bg-ember-600 transition-colors disabled:opacity-50"
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-sand-50 dark:bg-sand-900 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden max-h-[80vh] flex flex-col border border-sand-200 dark:border-sand-700">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-sand-200 dark:border-sand-700">
          <h2 className="font-display font-semibold text-xl text-sand-900 dark:text-sand-50">Browse Rooms</h2>
          <p className="text-sm text-sand-500 dark:text-sand-400 mt-1">
            Find and join public rooms
          </p>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-b border-sand-200 dark:border-sand-700">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-500 dark:text-sand-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-sand-300 dark:border-sand-600 bg-white dark:bg-sand-800 text-sand-900 dark:text-sand-100 placeholder:text-sand-500 dark:placeholder:text-sand-400 focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-6 py-8 text-center">
              <div className="w-6 h-6 border-2 border-ember-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-sand-500 dark:text-sand-400 mt-3">{searchQuery ? 'Searching...' : 'Loading popular rooms...'}</p>
            </div>
          ) : rooms.length === 0 ? (
            <EmptyState
              icon={<InfoIcon className="w-6 h-6 text-sand-400 dark:text-sand-500" />}
              title={searchQuery ? 'No rooms found' : 'No rooms available'}
              subtitle={searchQuery ? 'Try a different search term' : 'All rooms have been joined or none exist yet'}
            />
          ) : (
            <div>
              {!searchQuery && (
                <div className="px-4 py-2 bg-sand-100 dark:bg-sand-800/50 border-b border-sand-200 dark:border-sand-700">
                  <p className="text-xs font-medium text-sand-500 dark:text-sand-400 uppercase tracking-wide">Popular Rooms</p>
                </div>
              )}
              <div className="divide-y divide-sand-200 dark:divide-sand-700/50">
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

        <div className="flex-shrink-0 px-6 py-4 bg-sand-100 dark:bg-sand-800/50 border-t border-sand-200 dark:border-sand-700 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-sand-600 dark:text-sand-300 hover:text-sand-900 dark:hover:text-sand-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
