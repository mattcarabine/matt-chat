import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '@/components/layout/NavBar';
import { ClickableUsername } from '@/components/ClickableUsername';
import { useInvitations, useInvitationMutations } from '@/hooks/useInvitations';
import type { RoomInvitation } from '@app/shared';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: {
  invitation: RoomInvitation;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting: boolean;
  isDeclining: boolean;
}) {
  const isLoading = isAccepting || isDeclining;

  return (
    <div className="p-4 bg-cream-dark/50 rounded-sm border border-stone-300/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-charcoal truncate">{invitation.roomName}</h3>
          <p className="text-sm text-stone mt-1">
            Invited by{' '}
            <ClickableUsername
              userId={invitation.inviterId}
              displayName={invitation.inviterName}
              className="text-charcoal"
            />
          </p>
          <p className="text-xs text-stone/70 mt-1">{formatDate(invitation.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onDecline}
            disabled={isLoading}
            data-testid="invitation-decline-button"
            className="px-3 py-1.5 text-sm text-stone hover:text-charcoal border border-stone-300/50 rounded-sm transition-colors disabled:opacity-50"
          >
            {isDeclining ? (
              <span className="spinner w-4 h-4" />
            ) : (
              'Decline'
            )}
          </button>
          <button
            onClick={onAccept}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm text-cream bg-forest hover:bg-forest-light rounded-sm transition-colors disabled:opacity-50"
          >
            {isAccepting ? (
              <span className="spinner w-4 h-4" />
            ) : (
              'Accept'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProcessingState {
  id: string;
  action: 'accept' | 'decline';
}

export function InvitationsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useInvitations();
  const { acceptInvitation, declineInvitation } = useInvitationMutations();
  const [processing, setProcessing] = useState<ProcessingState | null>(null);

  const handleAccept = async (invitation: RoomInvitation) => {
    setProcessing({ id: invitation.id, action: 'accept' });
    try {
      const result = await acceptInvitation(invitation.id);
      navigate(`/chat/${result.room.slug}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (invitation: RoomInvitation) => {
    setProcessing({ id: invitation.id, action: 'decline' });
    try {
      await declineInvitation(invitation.id);
    } finally {
      setProcessing(null);
    }
  };

  const invitations = data?.invitations ?? [];

  return (
    <div className="min-h-screen flex flex-col pt-14">
      <NavBar currentSection="invitations" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-charcoal">Invitations</h1>
          <p className="text-stone mt-2">
            Room invitations you've received from other members.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-cream-dark/50 rounded-sm border border-stone-300/30 animate-pulse">
                <div className="h-5 bg-stone-300/50 rounded w-1/3 mb-2" />
                <div className="h-4 bg-stone-300/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-terracotta/10 rounded-sm border border-terracotta/30 text-center">
            <p className="text-charcoal">Failed to load invitations. Please try again.</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-12 bg-cream-dark/50 rounded-sm border border-stone-300/30 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-200/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
              </svg>
            </div>
            <h3 className="font-medium text-charcoal mb-2">No pending invitations</h3>
            <p className="text-sm text-stone">
              When someone invites you to a private room, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onAccept={() => handleAccept(invitation)}
                onDecline={() => handleDecline(invitation)}
                isAccepting={processing?.id === invitation.id && processing?.action === 'accept'}
                isDeclining={processing?.id === invitation.id && processing?.action === 'decline'}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
