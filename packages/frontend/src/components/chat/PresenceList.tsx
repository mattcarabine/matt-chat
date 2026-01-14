import { useState } from 'react';
import { useChatPresence } from '@/hooks/useChat';
import { useRoomMembers } from '@/hooks/useRooms';
import { PresenceItem } from './PresenceItem';
import { InviteUserModal } from './InviteUserModal';
import { useSession } from '@/lib/auth-client';

function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

interface PresenceListProps {
  roomSlug: string;
  isPrivateRoom?: boolean;
}

export function PresenceList({ roomSlug, isPrivateRoom = false }: PresenceListProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
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
      {/* Invite button for private rooms */}
      {isPrivateRoom && (
        <button
          onClick={() => setShowInviteModal(true)}
          className="w-full mb-4 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-charcoal bg-cream-dark rounded-sm hover:bg-stone-300/50 transition-colors border border-stone-300/50"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Invite Member
        </button>
      )}

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

      {/* Invite modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomSlug={roomSlug}
      />
    </div>
  );
}
