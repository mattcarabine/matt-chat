import { useState } from 'react';
import { RoomProvider } from '@/providers/ChatProvider';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { PresenceList } from './PresenceList';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { RoomHeaderDropdown } from './RoomHeaderDropdown';
import { LeaveRoomModal } from './LeaveRoomModal';
import { InviteUserModal } from './InviteUserModal';
import { OnlineCount } from './OnlineCount';

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  isPublic: boolean;
  onLeaveSuccess: () => void;
}

export function ChatRoom({ roomId, roomName, isPublic, onLeaveSuccess }: ChatRoomProps) {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <RoomProvider roomId={roomId}>
      <div className="flex h-full bg-cream">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-300/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-forest animate-pulse" />
              <h2 className="font-serif text-xl text-charcoal">{roomName}</h2>
              <OnlineCount roomSlug={roomId} />
            </div>
            <div className="flex items-center gap-2">
              <ConnectionStatus />
              <RoomHeaderDropdown
                isPrivateRoom={!isPublic}
                onLeaveRoom={() => setShowLeaveModal(true)}
                onInviteUser={() => setShowInviteModal(true)}
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <MessageList roomSlug={roomId} />
          </div>

          {/* Typing indicator */}
          <TypingIndicator />

          {/* Input */}
          <div className="border-t border-stone-300/50">
            <MessageInput roomSlug={roomId} />
          </div>
        </div>

        {/* Presence sidebar */}
        <div className="w-64 border-l border-stone-300/50 hidden lg:block">
          <PresenceList roomSlug={roomId} isPrivateRoom={!isPublic} />
        </div>
      </div>

      {/* Modals */}
      <LeaveRoomModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        roomSlug={roomId}
        roomName={roomName}
        onLeaveSuccess={onLeaveSuccess}
      />
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomSlug={roomId}
      />
    </RoomProvider>
  );
}
