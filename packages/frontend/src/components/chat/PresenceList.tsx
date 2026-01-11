import { useChatPresence } from '@/hooks/useChat';
import { useRoomMembers } from '@/hooks/useRooms';
import { PresenceItem } from './PresenceItem';
import { useSession } from '@/lib/auth-client';

interface PresenceListProps {
  roomSlug: string;
}

export function PresenceList({ roomSlug }: PresenceListProps) {
  const { users: onlineUsers, isLoading: presenceLoading } = useChatPresence();
  const { data: membersData, isLoading: membersLoading } = useRoomMembers(roomSlug);
  const { data: session } = useSession();

  const isLoading = presenceLoading || membersLoading;

  if (isLoading) {
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

  // Separate online and offline members
  const onlineMembers = members.filter((m) => onlineUserIds.has(m.id));
  const offlineMembers = members.filter((m) => !onlineUserIds.has(m.id));

  return (
    <div className="p-4">
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
            <PresenceItem
              key={member.id}
              displayName={member.displayName}
              isCurrentUser={member.id === session?.user?.id}
              isOnline
            />
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
            <PresenceItem
              key={member.id}
              displayName={member.displayName}
              isCurrentUser={member.id === session?.user?.id}
              isOnline={false}
            />
          ))
        )}
      </div>
    </div>
  );
}
