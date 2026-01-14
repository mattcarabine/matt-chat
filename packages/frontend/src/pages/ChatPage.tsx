import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChatRoom, RoomSidebar, CreateRoomModal, BrowseRoomsModal } from '@/components/chat';
import { NavBar } from '@/components/layout/NavBar';
import { SpinnerIcon } from '@/components/icons';
import { useRoom, useMyRooms } from '@/hooks/useRooms';
import { getLastRoom, setLastRoom } from '@/hooks/useLastRoom';

function LoadingScreen({ message = 'Loading...' }: { message?: string }): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="flex items-center gap-3">
        <SpinnerIcon className="w-6 h-6 border-forest border-t-transparent" />
        <span className="text-stone">{message}</span>
      </div>
    </div>
  );
}

export function ChatPage(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { data: myRoomsData, isLoading: isLoadingMyRooms } = useMyRooms();
  const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useRoom(roomId);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showBrowseRooms, setShowBrowseRooms] = useState(false);

  useEffect(() => {
    if (roomId) {
      setLastRoom(roomId);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId || isLoadingMyRooms || !myRoomsData) return;

    const rooms = myRoomsData.rooms;
    if (rooms.length === 0) return;

    const lastRoom = getLastRoom();
    if (lastRoom && rooms.some((r) => r.slug === lastRoom)) {
      navigate(`/chat/${lastRoom}`, { replace: true });
      return;
    }

    const mostRecentRoom = [...rooms].sort(
      (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    )[0];
    navigate(`/chat/${mostRecentRoom.slug}`, { replace: true });
  }, [roomId, isLoadingMyRooms, myRoomsData, navigate]);

  if (!roomId && isLoadingMyRooms) {
    return <LoadingScreen />;
  }

  if (!roomId && myRoomsData?.rooms.length === 0) {
    return (
      <div className="h-screen flex flex-col">
        <NavBar currentSection="chat" />
        <div className="flex-1 flex">
          <RoomSidebar
            currentRoomSlug=""
            onCreateRoom={() => setShowCreateRoom(true)}
            onBrowseRooms={() => setShowBrowseRooms(true)}
          />
          <div className="flex-1 flex items-center justify-center bg-cream">
            <div className="text-center">
              <h1 className="font-serif text-4xl text-charcoal mb-4">No Rooms Yet</h1>
              <p className="text-stone mb-6">Create a room or browse existing ones to get started.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="px-6 py-3 bg-forest text-cream rounded-lg hover:bg-forest-light transition-colors"
                >
                  Create Room
                </button>
                <button
                  onClick={() => setShowBrowseRooms(true)}
                  className="px-6 py-3 border border-forest text-forest rounded-lg hover:bg-forest/5 transition-colors"
                >
                  Browse Rooms
                </button>
              </div>
            </div>
          </div>
        </div>
        <CreateRoomModal isOpen={showCreateRoom} onClose={() => setShowCreateRoom(false)} />
        <BrowseRoomsModal isOpen={showBrowseRooms} onClose={() => setShowBrowseRooms(false)} />
      </div>
    );
  }

  if (!roomId) {
    return <LoadingScreen />;
  }

  // Determine what to render in the chat content area
  const renderChatContent = () => {
    if (isLoadingRoom) {
      return (
        <div className="flex-1 flex items-center justify-center bg-cream">
          <div className="flex items-center gap-3">
            <SpinnerIcon className="w-6 h-6 border-forest border-t-transparent" />
            <span className="text-stone">Loading room...</span>
          </div>
        </div>
      );
    }

    if (roomError || !roomData?.room) {
      return (
        <div className="flex-1 flex items-center justify-center bg-cream">
          <div className="text-center">
            <h1 className="font-serif text-4xl text-charcoal mb-4">Room Not Found</h1>
            <p className="text-stone mb-6">The chat room you're looking for doesn't exist.</p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-forest text-cream rounded-lg hover:bg-forest-light transition-colors"
            >
              Go to Chat
            </Link>
          </div>
        </div>
      );
    }

    const room = roomData.room;
    return (
      <div className="flex-1 overflow-hidden">
        {/* key={roomId} forces React to remount ChatRoom when switching rooms,
            ensuring Ably subscriptions and message history are properly reset */}
        <ChatRoom key={roomId} roomId={roomId} roomName={room.name} isPublic={room.isPublic} />
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <NavBar currentSection="chat" />

      <div className="flex-1 flex overflow-hidden">
        <RoomSidebar
          currentRoomSlug={roomId}
          onCreateRoom={() => setShowCreateRoom(true)}
          onBrowseRooms={() => setShowBrowseRooms(true)}
        />
        {renderChatContent()}
      </div>

      <CreateRoomModal isOpen={showCreateRoom} onClose={() => setShowCreateRoom(false)} />
      <BrowseRoomsModal isOpen={showBrowseRooms} onClose={() => setShowBrowseRooms(false)} />
    </div>
  );
}
