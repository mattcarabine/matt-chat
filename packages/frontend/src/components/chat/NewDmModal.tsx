import { useState } from 'react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useDmMutations } from '@/hooks/useDms';
import { useSession } from '@/lib/auth-client';
import type { UserSearchResult } from '@app/shared';

const MAX_PARTICIPANTS = 4;

interface NewDmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDmCreated: (dm: { slug: string }) => void;
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

function XIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function SelectedUserChip({
  user,
  onRemove,
}: {
  user: UserSearchResult;
  onRemove: () => void;
}) {
  return (
    <span
      data-testid={`selected-user-chip-${user.id}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ember-50 dark:bg-ember-500/10 text-ember-700 dark:text-ember-300 rounded-full text-sm"
    >
      <span className="truncate max-w-[120px]">{user.displayName}</span>
      <button
        type="button"
        onClick={onRemove}
        data-testid={`remove-user-${user.id}`}
        className="flex-shrink-0 hover:bg-ember-100 dark:hover:bg-ember-500/20 rounded-full p-0.5 transition-colors"
      >
        <XIcon className="w-3 h-3" />
      </button>
    </span>
  );
}

function UserSearchResultItem({
  user,
  isSelected,
  isDisabled,
  onToggle,
}: {
  user: UserSearchResult;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}) {
  const canSelect = !isDisabled || isSelected;

  return (
    <button
      type="button"
      data-testid={`user-result-${user.id}`}
      onClick={canSelect ? onToggle : undefined}
      disabled={!canSelect}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        isSelected
          ? 'bg-ember-50 dark:bg-ember-500/10'
          : canSelect
            ? 'hover:bg-sand-100 dark:hover:bg-sand-800/50'
            : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSelected
            ? 'bg-ember-500 text-white'
            : 'bg-ember-50 dark:bg-ember-500/10'
        }`}>
          {isSelected ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <UserIcon className="w-4 h-4 text-ember-500 dark:text-ember-400" />
          )}
        </div>
        <div className="min-w-0 text-left">
          <p className={`text-sm font-medium truncate ${
            isSelected
              ? 'text-ember-700 dark:text-ember-300'
              : 'text-sand-900 dark:text-sand-50'
          }`}>
            {user.displayName}
          </p>
          {user.username && (
            <p className="text-xs text-sand-500 dark:text-sand-400 truncate">@{user.username}</p>
          )}
        </div>
      </div>
    </button>
  );
}

export function NewDmModal({ isOpen, onClose, onDmCreated }: NewDmModalProps) {
  const [query, setQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();
  const { data: searchResults, isLoading: isSearching } = useUserSearch(query);
  const { createOrGetDm, isCreating } = useDmMutations();

  if (!isOpen) return null;

  const currentUserId = session?.user?.id;
  const selectedIds = new Set(selectedUsers.map((u) => u.id));
  const isAtLimit = selectedUsers.length >= MAX_PARTICIPANTS;

  // Filter out current user from search results
  const filteredUsers = (searchResults?.users ?? []).filter(
    (user) => user.id !== currentUserId
  );

  const handleClose = () => {
    if (!isCreating) {
      setQuery('');
      setSelectedUsers([]);
      setError(null);
      onClose();
    }
  };

  const handleToggleUser = (user: UserSearchResult) => {
    if (selectedIds.has(user.id)) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else if (!isAtLimit) {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return;

    setError(null);
    try {
      const result = await createOrGetDm({
        participantIds: selectedUsers.map((u) => u.id),
      });
      setQuery('');
      setSelectedUsers([]);
      onClose();
      onDmCreated({ slug: result.dm.slug });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  };

  const submitButtonText = selectedUsers.length <= 1 ? 'Message' : 'Create Group';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        data-testid="new-dm-modal"
        className="relative bg-sand-50 dark:bg-sand-900 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-sand-200 dark:border-sand-700"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand-200 dark:border-sand-700">
          <h2 className="font-display font-semibold text-xl text-sand-900 dark:text-sand-50">New Message</h2>
          <p className="text-sm text-sand-500 dark:text-sand-400 mt-1">
            Start a conversation with one or more people
          </p>
        </div>

        {/* Search and Selected Users */}
        <div className="px-6 py-4">
          {/* Selected user chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3" data-testid="selected-users">
              {selectedUsers.map((user) => (
                <SelectedUserChip
                  key={user.id}
                  user={user}
                  onRemove={() => handleRemoveUser(user.id)}
                />
              ))}
            </div>
          )}

          {/* Max limit message */}
          {isAtLimit && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
              Maximum {MAX_PARTICIPANTS} participants reached
            </p>
          )}

          {/* Search input */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-500 dark:text-sand-400" />
            <input
              type="text"
              data-testid="new-dm-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username..."
              autoFocus
              disabled={isCreating}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-sand-300 dark:border-sand-600 bg-white dark:bg-sand-800 text-sand-900 dark:text-sand-100 placeholder:text-sand-500 dark:placeholder:text-sand-400 focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500/30 disabled:opacity-50"
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
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-sand-500 dark:text-sand-400 text-center py-4">
              No users found matching "{query}"
            </p>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <UserSearchResultItem
                  key={user.id}
                  user={user}
                  isSelected={selectedIds.has(user.id)}
                  isDisabled={isAtLimit}
                  onToggle={() => handleToggleUser(user)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-sand-100 dark:bg-sand-800/50 border-t border-sand-200 dark:border-sand-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-sand-600 dark:text-sand-300 hover:text-sand-900 dark:hover:text-sand-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="new-dm-submit"
            onClick={handleSubmit}
            disabled={isCreating || selectedUsers.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-ember-500 rounded-lg hover:bg-ember-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
