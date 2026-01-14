import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSession, type User } from '@/lib/auth-client';
import { ChatRoom, RoomSidebar, CreateRoomModal, BrowseRoomsModal } from '@/components/chat';
import { NavBar } from '@/components/layout/NavBar';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useRoom } from '@/hooks/useRooms';
import { DEFAULT_ROOM_SLUG } from '@app/shared';

function SettingsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data: session } = useSession();
  const { preferences, updatePreference, isUpdating } = useUserPreferences();
  const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useRoom(roomId);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showBrowseRooms, setShowBrowseRooms] = useState(false);

  const user = session?.user as User | undefined;
  const fullName = user?.fullName || user?.name || 'User';
  const username = user?.username || user?.displayUsername;

  // Show loading state while fetching room
  if (isLoadingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin" />
          <span className="text-stone">Loading room...</span>
        </div>
      </div>
    );
  }

  // Handle room not found or error
  if (roomError || !roomData?.room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-charcoal mb-4">
            Room Not Found
          </h1>
          <p className="text-stone mb-6">
            The chat room you're looking for doesn't exist.
          </p>
          <Link
            to={`/chat/${DEFAULT_ROOM_SLUG}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-forest text-cream rounded-lg hover:bg-forest-light transition-colors"
          >
            Go to Landing Zone
          </Link>
        </div>
      </div>
    );
  }

  const room = roomData.room;

  return (
    <div className="h-screen flex flex-col">
      <NavBar currentSection="chat" />

      {/* Chat Settings Bar */}
      <div className="flex-shrink-0 border-b border-stone-300/50 bg-cream-dark/50 px-4 py-2">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-stone hover:text-charcoal transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Chat Settings</span>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="flex-shrink-0 border-b border-stone-300/50 bg-cream-dark px-4 py-4">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-charcoal">Display name in chat:</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="displayName"
                    checked={preferences?.displayNamePreference === 'fullName'}
                    onChange={() => updatePreference('fullName')}
                    disabled={isUpdating}
                    className="w-4 h-4 text-forest focus:ring-forest"
                  />
                  <span className="text-sm text-charcoal">
                    Full name <span className="text-stone">({fullName})</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="displayName"
                    checked={preferences?.displayNamePreference === 'username'}
                    onChange={() => updatePreference('username')}
                    disabled={isUpdating || !username}
                    className="w-4 h-4 text-forest focus:ring-forest"
                  />
                  <span className={`text-sm ${username ? 'text-charcoal' : 'text-stone-400'}`}>
                    Username {username && <span className="text-stone">(@{username})</span>}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <RoomSidebar
          currentRoomSlug={roomId!}
          onCreateRoom={() => setShowCreateRoom(true)}
          onBrowseRooms={() => setShowBrowseRooms(true)}
        />
        <div className="flex-1 overflow-hidden">
          <ChatRoom roomId={roomId!} roomName={room.name} isPublic={room.isPublic} />
        </div>
      </div>

      <CreateRoomModal isOpen={showCreateRoom} onClose={() => setShowCreateRoom(false)} />
      <BrowseRoomsModal isOpen={showBrowseRooms} onClose={() => setShowBrowseRooms(false)} />
    </div>
  );
}
