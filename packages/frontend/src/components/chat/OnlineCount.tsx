import { useChatPresence } from '@/hooks/useChat';
import { useRoomMembers } from '@/hooks/useRooms';

interface OnlineCountProps {
  roomSlug: string;
}

export function OnlineCount({ roomSlug }: OnlineCountProps) {
  const { users: onlineUsers, isLoading: presenceLoading } = useChatPresence();
  const { data: membersData, isLoading: membersLoading } = useRoomMembers(roomSlug);

  const isLoading = presenceLoading || membersLoading;

  if (isLoading) {
    return (
      <span
        className="text-sm text-stone/60"
        data-testid="room-header-online-count"
      >
        ...
      </span>
    );
  }

  const members = membersData?.members ?? [];
  const onlineUserIds = new Set(onlineUsers.map((u) => u.userId));
  const onlineCount = members.filter((m) => onlineUserIds.has(m.id)).length;

  return (
    <span
      className="text-sm text-stone/60"
      data-testid="room-header-online-count"
    >
      {onlineCount} online
    </span>
  );
}
