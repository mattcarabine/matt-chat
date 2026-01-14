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
    ? 'bg-ember-50 dark:bg-ember-500/10 text-ember-600 dark:text-ember-400 cursor-default'
    : 'bg-ember-500 text-white hover:bg-ember-600 disabled:opacity-50';

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-sand-100 dark:hover:bg-sand-800/50 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-ember-50 dark:bg-ember-500/10 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-4 h-4 text-ember-500 dark:text-ember-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-sand-900 dark:text-sand-50 truncate">
            {user.displayName}
          </p>
          {user.username && (
            <p className="text-xs text-sand-500 dark:text-sand-400 truncate">@{user.username}</p>
          )}
        </div>
      </div>
      <button
        onClick={onInvite}
        disabled={isInviting || isInvited}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${buttonClassName}`}
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-sand-50 dark:bg-sand-900 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-sand-200 dark:border-sand-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand-200 dark:border-sand-700">
          <h2 className="font-display font-semibold text-xl text-sand-900 dark:text-sand-50">Invite Member</h2>
          <p className="text-sm text-sand-500 dark:text-sand-400 mt-1">
            Search for users to invite to this private room
          </p>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-500 dark:text-sand-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-sand-300 dark:border-sand-600 bg-white dark:bg-sand-800 text-sand-900 dark:text-sand-100 placeholder:text-sand-500 dark:placeholder:text-sand-400 focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500/30"
            />
          </div>

          {error && (
            <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="px-6 pb-4 max-h-64 overflow-y-auto">
          {query.length < 2 ? (
            <p className="text-sm text-sand-500 dark:text-sand-400 text-center py-4">
              Type at least 2 characters to search
            </p>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-ember-500/30 border-t-ember-500 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-sand-500 dark:text-sand-400 text-center py-4">
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
        <div className="px-6 py-4 bg-sand-100 dark:bg-sand-800/50 border-t border-sand-200 dark:border-sand-700 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-sand-600 dark:text-sand-300 hover:text-sand-900 dark:hover:text-sand-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
