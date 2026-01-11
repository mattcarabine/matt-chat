import { RoomProvider } from '@/providers/ChatProvider';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { PresenceList } from './PresenceList';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { ROOM_DISPLAY_NAMES, type RoomId } from '@app/shared';

interface ChatRoomProps {
  roomId: string;
}

export function ChatRoom({ roomId }: ChatRoomProps) {
  const roomName = ROOM_DISPLAY_NAMES[roomId as RoomId] || roomId;

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
            </div>
            <ConnectionStatus />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <MessageList />
          </div>

          {/* Typing indicator */}
          <TypingIndicator />

          {/* Input */}
          <div className="border-t border-stone-300/50">
            <MessageInput />
          </div>
        </div>

        {/* Presence sidebar */}
        <div className="w-64 border-l border-stone-300/50 hidden lg:block">
          <PresenceList />
        </div>
      </div>
    </RoomProvider>
  );
}
