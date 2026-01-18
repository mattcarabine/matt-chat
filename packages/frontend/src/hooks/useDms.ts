import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DmListItem, CreateDmInput, AddDmMemberInput, ConvertDmToRoomInput } from '@app/shared';
import { apiFetch } from '@/lib/api';

interface DmsListResponse {
  dms: DmListItem[];
}

interface DmDetailsResponse {
  dm: DmListItem;
}

export interface DmMember {
  id: string;
  displayName: string;
  username: string | null;
  joinedAt: string;
}

interface DmMembersResponse {
  members: DmMember[];
}

interface CreateOrGetDmResponse {
  dm: DmListItem;
  isNew: boolean;
}

interface AddMemberResponse {
  success: true;
  dm: DmListItem;
}

interface ConvertToRoomResponse {
  success: true;
  room: { id: string; slug: string; name: string };
}

function fetchMyDms(): Promise<DmsListResponse> {
  return apiFetch('/api/dms');
}

function fetchDm(id: string): Promise<DmDetailsResponse> {
  return apiFetch(`/api/dms/${id}`);
}

function fetchDmMembers(id: string): Promise<DmMembersResponse> {
  return apiFetch(`/api/dms/${id}/members`);
}

function createOrGetDm(input: CreateDmInput): Promise<CreateOrGetDmResponse> {
  return apiFetch('/api/dms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

function addDmMember(id: string, input: AddDmMemberInput): Promise<AddMemberResponse> {
  return apiFetch(`/api/dms/${id}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

function convertDmToRoom(id: string, input: ConvertDmToRoomInput): Promise<ConvertToRoomResponse> {
  return apiFetch(`/api/dms/${id}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

// Hook to fetch user's DMs
export function useMyDms() {
  return useQuery({
    queryKey: ['myDms'],
    queryFn: fetchMyDms,
  });
}

// Hook to get single DM details
export function useDm(id: string | undefined) {
  return useQuery({
    queryKey: ['dm', id],
    queryFn: () => fetchDm(id!),
    enabled: !!id,
  });
}

// Hook to get DM members
export function useDmMembers(id: string | undefined) {
  return useQuery({
    queryKey: ['dmMembers', id],
    queryFn: () => fetchDmMembers(id!),
    enabled: !!id,
  });
}

// Hook for DM mutations
export function useDmMutations() {
  const queryClient = useQueryClient();

  const createOrGetMutation = useMutation({
    mutationFn: createOrGetDm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDms'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddDmMemberInput }) =>
      addDmMember(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dmMembers', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dm', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['myDms'] });
    },
  });

  const convertToRoomMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ConvertDmToRoomInput }) =>
      convertDmToRoom(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDms'] });
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
    },
  });

  return {
    createOrGetDm: createOrGetMutation.mutateAsync,
    isCreating: createOrGetMutation.isPending,
    createError: createOrGetMutation.error,

    addMember: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,
    addMemberError: addMemberMutation.error,

    convertToRoom: convertToRoomMutation.mutateAsync,
    isConverting: convertToRoomMutation.isPending,
    convertError: convertToRoomMutation.error,
  };
}
