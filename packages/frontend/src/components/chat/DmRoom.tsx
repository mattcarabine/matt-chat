import { RoomProvider } from '@/providers/ChatProvider';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { DmHeaderDropdown } from './DmHeaderDropdown';
import { useChatPresence } from '@/hooks/useChat';
import { useDmMembers } from '@/hooks/useDms';

interface DmParticipant {
  id: string;
  displayName: string;
  username: string | null;
}

interface DmRoomProps {
  dmId: string;
  dmSlug: string;
  ablyRoomId: string;
  dmType: 'one_on_one' | 'group';
  participants: DmParticipant[];
}

function DmHeader({
  dmId,
  dmType,
  participants,
}: {
  dmId: string;
  dmType: 'one_on_one' | 'group';
  participants: DmParticipant[];
}) {
  const isOneOnOne = dmType === 'one_on_one';
  const { users: onlineUsers } = useChatPresence();
  const onlineUserIds = new Set(onlineUsers.map((u) => u.userId));

  // For 1:1 DMs, show the other user's online status
  const otherUser = participants[0];
  const isOnline = otherUser ? onlineUserIds.has(otherUser.id) : false;

  // Format display name for header
  const displayName = isOneOnOne
    ? otherUser?.displayName ?? 'Unknown'
    : participants.map((p) => p.displayName).join(', ');

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-stone-300/50">
      <div className="flex items-center gap-3">
        {isOneOnOne ? (
          <>
            {/* Avatar with online indicator */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-forest text-cream flex items-center justify-center text-sm font-serif">
                {otherUser?.displayName.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-cream ${
                  isOnline ? 'bg-green-500' : 'bg-stone-400'
                }`}
                data-testid="dm-header-online-indicator"
              />
            </div>
            <h2 className="font-serif text-xl text-charcoal">{displayName}</h2>
          </>
        ) : (
          <>
            {/* Group DM indicator */}
            <div className="w-3 h-3 rounded-full bg-forest animate-pulse" />
            <h2 className="font-serif text-xl text-charcoal truncate max-w-md" title={displayName}>
              {displayName}
            </h2>
            <span className="text-sm text-stone/60">
              {participants.length + 1} members
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ConnectionStatus />
        <DmHeaderDropdown dmId={dmId} dmType={dmType} />
      </div>
    </div>
  );
}

function DmPresenceList({ dmId }: { dmId: string }) {
  const { data: membersData, isLoading } = useDmMembers(dmId);
  const { users: onlineUsers, isLoading: presenceLoading } = useChatPresence();

  if (isLoading || presenceLoading) {
    return (
      <div className="p-4">
        <div className="h-4 bg-stone-300/50 rounded animate-pulse mb-4 w-24" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-300/50 animate-pulse" />
              <div className="h-4 bg-stone-300/50 rounded animate-pulse flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const members = membersData?.members ?? [];
  const onlineUserIds = new Set(onlineUsers.map((u) => u.userId));

  const onlineMembers = members.filter((m) => onlineUserIds.has(m.id));
  const offlineMembers = members.filter((m) => !onlineUserIds.has(m.id));

  return (
    <div className="p-4" data-testid="dm-presence-list">
      {/* Online section */}
      <h3
        className="text-sm font-medium text-stone uppercase tracking-wide mb-3"
        style={{ letterSpacing: '0.05em' }}
      >
        Online ({onlineMembers.length})
      </h3>
      <div className="space-y-1 mb-6">
        {onlineMembers.length === 0 ? (
          <p className="text-xs text-stone/60 italic">No one online</p>
        ) : (
          onlineMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 py-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-forest text-cream flex items-center justify-center text-sm font-serif">
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-cream bg-green-500" />
              </div>
              <span className="text-sm text-charcoal">{member.displayName}</span>
            </div>
          ))
        )}
      </div>

      {/* Offline section */}
      <h3
        className="text-sm font-medium text-stone uppercase tracking-wide mb-3"
        style={{ letterSpacing: '0.05em' }}
      >
        Offline ({offlineMembers.length})
      </h3>
      <div className="space-y-1">
        {offlineMembers.length === 0 ? (
          <p className="text-xs text-stone/60 italic">Everyone's online!</p>
        ) : (
          offlineMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 py-2 opacity-50">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-stone-300 text-stone flex items-center justify-center text-sm font-serif">
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-cream bg-stone-400" />
              </div>
              <span className="text-sm text-stone">{member.displayName}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function DmRoom({ dmId, dmSlug, ablyRoomId, dmType, participants }: DmRoomProps) {
  const isGroupDm = dmType === 'group';

  return (
    <RoomProvider roomId={dmSlug} ablyRoomId={ablyRoomId}>
      <div className="flex h-full bg-cream">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <DmHeader dmId={dmId} dmType={dmType} participants={participants} />

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <MessageList roomSlug={dmSlug} />
          </div>

          {/* Typing indicator */}
          <TypingIndicator />

          {/* Input */}
          <div className="border-t border-stone-300/50">
            <MessageInput roomSlug={dmSlug} />
          </div>
        </div>

        {/* Presence sidebar - only for group DMs */}
        {isGroupDm && (
          <div className="w-64 border-l border-stone-300/50 hidden lg:block">
            <DmPresenceList dmId={dmId} />
          </div>
        )}
      </div>
    </RoomProvider>
  );
}
