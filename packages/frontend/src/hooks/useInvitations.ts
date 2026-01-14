import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RoomInvitation } from '@app/shared';
import { apiFetch } from '@/lib/api';

interface InvitationsResponse {
  invitations: RoomInvitation[];
}

interface InvitationCountResponse {
  count: number;
}

interface AcceptInvitationResponse {
  success: true;
  room: { id: string; slug: string; name: string };
}

function fetchInvitations(): Promise<InvitationsResponse> {
  return apiFetch('/api/invitations');
}

function fetchInvitationCount(): Promise<InvitationCountResponse> {
  return apiFetch('/api/invitations/count');
}

function acceptInvitation(id: string): Promise<AcceptInvitationResponse> {
  return apiFetch(`/api/invitations/${id}/accept`, { method: 'POST' });
}

function declineInvitation(id: string): Promise<{ success: true }> {
  return apiFetch(`/api/invitations/${id}/decline`, { method: 'POST' });
}

// Hook to fetch pending received invitations
export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: fetchInvitations,
  });
}

// Hook to fetch invitation count (for nav badge)
export function useInvitationCount() {
  return useQuery({
    queryKey: ['invitationCount'],
    queryFn: fetchInvitationCount,
    refetchInterval: 30000, // Poll every 30s for new invitations
  });
}

// Hook for invitation mutations
export function useInvitationMutations() {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitationCount'] });
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: declineInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitationCount'] });
    },
  });

  return {
    acceptInvitation: acceptMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    acceptError: acceptMutation.error,

    declineInvitation: declineMutation.mutateAsync,
    isDeclining: declineMutation.isPending,
    declineError: declineMutation.error,
  };
}
