import { useState } from 'react';
import { useRoomMutations } from '@/hooks/useRooms';
import { useChatPresence } from '@/hooks/useChat';

interface LeaveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomSlug: string;
  roomName: string;
  onLeaveSuccess: () => void;
}

function WarningIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

export function LeaveRoomModal({
  isOpen,
  onClose,
  roomSlug,
  roomName,
  onLeaveSuccess,
}: LeaveRoomModalProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { leaveRoom } = useRoomMutations();
  const { leavePresence } = useChatPresence();

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isLeaving) {
      setError(null);
      onClose();
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    setError(null);

    try {
      // Step 1: Explicitly leave Ably presence for immediate cleanup
      await leavePresence();

      // Step 2: Remove from database
      await leaveRoom(roomSlug);

      // Step 3: Navigate away (triggers component unmount and remaining Ably cleanup)
      onLeaveSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room');
      setIsLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-sand-50 dark:bg-sand-900 rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden border border-sand-200 dark:border-sand-700">
        {/* Header */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <WarningIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="font-display font-semibold text-xl text-sand-900 dark:text-sand-50">
              Leave Room
            </h2>
          </div>
          <p className="text-sm text-sand-600 dark:text-sand-400">
            Are you sure you want to leave <span className="font-medium text-sand-900 dark:text-sand-50">{roomName}</span>?
            You'll need to rejoin or be invited again to access this room.
          </p>

          {error && (
            <div className="mt-4 px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-sand-100 dark:bg-sand-800/50 border-t border-sand-200 dark:border-sand-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLeaving}
            className="px-4 py-2 text-sm font-medium text-sand-600 dark:text-sand-300 hover:text-sand-900 dark:hover:text-sand-50 transition-colors disabled:opacity-50"
            data-testid="leave-room-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLeave}
            disabled={isLeaving}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            data-testid="leave-room-confirm"
          >
            {isLeaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Leaving...
              </>
            ) : (
              'Leave Room'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
