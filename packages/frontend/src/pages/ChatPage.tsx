import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSession, signOut, type User } from '@/lib/auth-client';
import { ChatRoom, RoomSidebar, CreateRoomModal, BrowseRoomsModal } from '@/components/chat';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useRoom } from '@/hooks/useRooms';
import { DEFAULT_ROOM_SLUG } from '@app/shared';

function ChatIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function SettingsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

export function ChatPage() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { data: session } = useSession();
  const { preferences, updatePreference, isUpdating } = useUserPreferences();
  const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useRoom(roomId);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showBrowseRooms, setShowBrowseRooms] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/signin');
  };

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
      {/* Navigation */}
      <nav className="flex-shrink-0 border-b border-stone-300/50 bg-cream">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
                  <ChatIcon className="w-4 h-4 text-cream" />
                </div>
                <span className="font-medium text-charcoal">Chat</span>
              </div>

              <div className="hidden sm:flex items-center gap-4">
                <Link to="/dashboard" className="text-sm text-stone hover:text-charcoal transition-colors">
                  Dashboard
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-stone hover:text-charcoal transition-colors"
                title="Chat Settings"
              >
                <SettingsIcon />
              </button>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors duration-200 disabled:opacity-50"
              >
                {isSigningOut ? <span className="spinner w-4 h-4" /> : <SignOutIcon />}
              </button>
            </div>
          </div>
        </div>
      </nav>

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
          <ChatRoom roomId={roomId!} roomName={room.name} />
        </div>
      </div>

      <CreateRoomModal isOpen={showCreateRoom} onClose={() => setShowCreateRoom(false)} />
      <BrowseRoomsModal isOpen={showBrowseRooms} onClose={() => setShowBrowseRooms(false)} />
    </div>
  );
}
