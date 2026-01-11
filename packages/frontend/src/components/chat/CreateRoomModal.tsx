import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomMutations } from '@/hooks/useRooms';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const navigate = useNavigate();
  const { createRoom, isCreating } = useRoomMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setDescription('');
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
      const result = await createRoom({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      resetForm();
      onClose();
      navigate(`/chat/${result.room.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      resetForm();
      onClose();
    }
  };

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
          <h2 className="font-serif text-xl text-charcoal">Create a Room</h2>
          <p className="text-sm text-stone mt-1">
            Start a new conversation space
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="px-3 py-2 bg-terracotta/10 border border-terracotta/30 rounded-sm">
                <p className="text-sm text-terracotta">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="room-name"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Room Name <span className="text-terracotta">*</span>
              </label>
              <input
                id="room-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Design Team"
                maxLength={50}
                disabled={isCreating}
                className="
                  w-full px-3 py-2.5 rounded-sm
                  border border-stone-300/50
                  bg-cream-dark/50 text-charcoal
                  placeholder:text-stone/50
                  focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/30
                  disabled:opacity-50
                "
              />
              <p className="text-xs text-stone mt-1">
                {name.length}/50 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="room-description"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Description <span className="text-stone">(optional)</span>
              </label>
              <textarea
                id="room-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this room about?"
                maxLength={500}
                rows={3}
                disabled={isCreating}
                className="
                  w-full px-3 py-2.5 rounded-sm resize-none
                  border border-stone-300/50
                  bg-cream-dark/50 text-charcoal
                  placeholder:text-stone/50
                  focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/30
                  disabled:opacity-50
                "
              />
              <p className="text-xs text-stone mt-1">
                {description.length}/500 characters
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-cream-dark/50 border-t border-stone-300/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="
                px-4 py-2 text-sm font-medium text-stone
                hover:text-charcoal transition-colors
                disabled:opacity-50
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="
                px-4 py-2 text-sm font-medium text-cream bg-forest rounded-sm
                hover:bg-forest-light transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              "
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
