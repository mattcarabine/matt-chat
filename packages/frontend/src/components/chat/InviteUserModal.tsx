import { useState } from 'react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useRoomMutations } from '@/hooks/useRooms';
import type { UserSearchResult } from '@app/shared';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomSlug: string;
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function UserIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function getInviteButtonLabel(isInviting: boolean, isInvited: boolean): React.ReactNode {
  if (isInviting) {
    return <span className="spinner w-3 h-3" />;
  }
  if (isInvited) {
    return 'Invited';
  }
  return 'Invite';
}

function UserSearchResultItem({
  user,
  onInvite,
  isInviting,
  isInvited,
}: {
  user: UserSearchResult;
  onInvite: () => void;
  isInviting: boolean;
  isInvited: boolean;
}) {
  const buttonClassName = isInvited
    ? 'bg-forest/10 text-forest cursor-default'
    : 'bg-forest text-cream hover:bg-forest-light disabled:opacity-50';

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-cream-dark/50 rounded-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-4 h-4 text-forest" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-charcoal truncate">
            {user.displayName}
          </p>
          {user.username && (
            <p className="text-xs text-stone truncate">@{user.username}</p>
          )}
        </div>
      </div>
      <button
        onClick={onInvite}
        disabled={isInviting || isInvited}
        className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors flex-shrink-0 ${buttonClassName}`}
      >
        {getInviteButtonLabel(isInviting, isInvited)}
      </button>
    </div>
  );
}

export function InviteUserModal({ isOpen, onClose, roomSlug }: InviteUserModalProps) {
  const [query, setQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: searchResults, isLoading: isSearching } = useUserSearch(query);
  const { inviteToRoom } = useRoomMutations();

  if (!isOpen) return null;

  const handleClose = () => {
    setQuery('');
    setInvitedIds(new Set());
    setError(null);
    onClose();
  };

  const handleInvite = async (user: UserSearchResult) => {
    setInvitingId(user.id);
    setError(null);
    try {
      await inviteToRoom({ slug: roomSlug, inviteeId: user.id });
      setInvitedIds((prev) => new Set([...prev, user.id]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInvitingId(null);
    }
  };

  const users = searchResults?.users ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-cream rounded-sm shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-300/50">
          <h2 className="font-serif text-xl text-charcoal">Invite Member</h2>
          <p className="text-sm text-stone mt-1">
            Search for users to invite to this private room
          </p>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username..."
              autoFocus
              className="
                w-full pl-10 pr-4 py-2.5 rounded-sm
                border border-stone-300/50
                bg-cream-dark/50 text-charcoal
                placeholder:text-stone/50
                focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/30
              "
            />
          </div>

          {error && (
            <div className="mt-3 px-3 py-2 bg-terracotta/10 border border-terracotta/30 rounded-sm">
              <p className="text-sm text-terracotta">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="px-6 pb-4 max-h-64 overflow-y-auto">
          {query.length < 2 ? (
            <p className="text-sm text-stone text-center py-4">
              Type at least 2 characters to search
            </p>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-stone text-center py-4">
              No users found matching "{query}"
            </p>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <UserSearchResultItem
                  key={user.id}
                  user={user}
                  onInvite={() => handleInvite(user)}
                  isInviting={invitingId === user.id}
                  isInvited={invitedIds.has(user.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-cream-dark/50 border-t border-stone-300/30 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="
              px-4 py-2 text-sm font-medium text-stone
              hover:text-charcoal transition-colors
            "
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
