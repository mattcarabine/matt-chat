import { useChatPresence } from '@/hooks/useChat';
import { PresenceItem } from './PresenceItem';
import { useSession } from '@/lib/auth-client';

export function PresenceList() {
  const { users, isLoading } = useChatPresence();
  const { data: session } = useSession();

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

  return (
    <div className="p-4">
      <h3
        className="text-sm font-medium text-stone uppercase tracking-wide mb-4"
        style={{ letterSpacing: '0.05em' }}
      >
        Online ({users.length})
      </h3>
      <div className="space-y-2">
        {users.map((user) => (
          <PresenceItem
            key={user.clientId}
            displayName={user.displayName}
            isCurrentUser={user.userId === session?.user?.id}
          />
        ))}
      </div>
    </div>
  );
}
