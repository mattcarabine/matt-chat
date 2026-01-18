import { useState, useRef, useEffect } from 'react';
import { AddDmMemberModal } from './AddDmMemberModal';
import { ConvertDmToRoomModal } from './ConvertDmToRoomModal';

interface DmHeaderDropdownProps {
  dmId: string;
  dmType: 'one_on_one' | 'group';
}

function EllipsisVerticalIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
  );
}

function UserPlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
  );
}

function ArrowRightCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function DmHeaderDropdown({ dmId, dmType }: DmHeaderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isGroupDm = dmType === 'group';

  useEffect(() => {
    if (!isOpen) return;

    function handleClose(event: MouseEvent | KeyboardEvent): void {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && dropdownRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleClose);
    };
  }, [isOpen]);

  function handleAction(action: () => void): void {
    setIsOpen(false);
    action();
  }

  // For 1:1 DMs, we don't show the dropdown since there are no actions
  if (!isGroupDm) {
    return null;
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-sand-500 dark:text-sand-400 hover:bg-sand-200 dark:hover:bg-sand-700 hover:text-sand-700 dark:hover:text-sand-200 transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="true"
          data-testid="dm-menu-button"
        >
          <EllipsisVerticalIcon />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-xl py-1 z-50 animate-fade-up">
            <button
              onClick={() => handleAction(() => setShowAddMemberModal(true))}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-sand-700 dark:text-sand-300 hover:bg-sand-100 dark:hover:bg-sand-800/50 transition-colors"
              data-testid="add-dm-member-button"
            >
              <UserPlusIcon className="w-4 h-4 text-sand-500 dark:text-sand-400" />
              Add Member
            </button>

            <div className="border-t border-sand-200 dark:border-sand-700 my-1" />

            <button
              onClick={() => handleAction(() => setShowConvertModal(true))}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-sand-700 dark:text-sand-300 hover:bg-sand-100 dark:hover:bg-sand-800/50 transition-colors"
              data-testid="convert-dm-to-room-button"
            >
              <ArrowRightCircleIcon className="w-4 h-4 text-sand-500 dark:text-sand-400" />
              Convert to Room
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddDmMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        dmId={dmId}
      />
      <ConvertDmToRoomModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        dmId={dmId}
      />
    </>
  );
}
