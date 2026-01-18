import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDmMutations } from '@/hooks/useDms';

interface ConvertDmToRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  dmId: string;
}

export function ConvertDmToRoomModal({ isOpen, onClose, dmId }: ConvertDmToRoomModalProps) {
  const navigate = useNavigate();
  const { convertToRoom, isConverting } = useDmMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsPublic(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Room name is required');
      return;
    }

    try {
      const result = await convertToRoom({
        id: dmId,
        input: {
          name: trimmedName,
          description: description.trim() || undefined,
          isPublic,
        },
      });
      resetForm();
      onClose();
      navigate(`/chat/${result.room.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert to room');
    }
  };

  const handleClose = () => {
    if (!isConverting) {
      resetForm();
      onClose();
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
      <div
        data-testid="convert-dm-modal"
        className="relative bg-sand-50 dark:bg-sand-900 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-sand-200 dark:border-sand-700"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand-200 dark:border-sand-700">
          <h2 className="font-display font-semibold text-xl text-sand-900 dark:text-sand-50">Convert to Room</h2>
          <p className="text-sm text-sand-500 dark:text-sand-400 mt-1">
            Turn this group conversation into a full room with more features
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                All participants will become room members. Message history will be preserved.
              </p>
            </div>

            <div>
              <label
                htmlFor="room-name"
                className="block text-sm font-medium text-sand-900 dark:text-sand-50 mb-1.5"
              >
                Room Name <span className="text-red-500">*</span>
              </label>
              <input
                id="room-name"
                data-testid="convert-dm-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Project Team"
                maxLength={50}
                disabled={isConverting}
                className="w-full px-3 py-2.5 rounded-lg border border-sand-300 dark:border-sand-600 bg-white dark:bg-sand-800 text-sand-900 dark:text-sand-100 placeholder:text-sand-500 dark:placeholder:text-sand-400 focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500/30 disabled:opacity-50"
              />
              <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">
                {name.length}/50 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="room-description"
                className="block text-sm font-medium text-sand-900 dark:text-sand-50 mb-1.5"
              >
                Description <span className="text-sand-400 dark:text-sand-500">(optional)</span>
              </label>
              <textarea
                id="room-description"
                data-testid="convert-dm-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this room about?"
                maxLength={500}
                rows={3}
                disabled={isConverting}
                className="w-full px-3 py-2.5 rounded-lg resize-none border border-sand-300 dark:border-sand-600 bg-white dark:bg-sand-800 text-sand-900 dark:text-sand-100 placeholder:text-sand-500 dark:placeholder:text-sand-400 focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500/30 disabled:opacity-50"
              />
              <p className="text-xs text-sand-500 dark:text-sand-400 mt-1">
                {description.length}/500 characters
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="convert-dm-public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isConverting}
                  className="w-4 h-4 mt-0.5 rounded text-ember-500 focus:ring-ember-500 focus:ring-offset-0 border-sand-300 dark:border-sand-600 bg-white dark:bg-sand-800"
                />
                <div>
                  <span className="text-sm font-medium text-sand-900 dark:text-sand-50">
                    Make this room public
                  </span>
                  <p className="text-xs text-sand-500 dark:text-sand-400 mt-0.5">
                    Public rooms appear in search and anyone can join
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-sand-100 dark:bg-sand-800/50 border-t border-sand-200 dark:border-sand-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isConverting}
              className="px-4 py-2 text-sm font-medium text-sand-600 dark:text-sand-300 hover:text-sand-900 dark:hover:text-sand-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="convert-dm-submit"
              disabled={isConverting || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-ember-500 rounded-lg hover:bg-ember-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isConverting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert to Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
