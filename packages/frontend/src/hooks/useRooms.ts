import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RoomListItem, RoomSearchResult, Room, CreateRoomInput } from '@app/shared';

const API_URL = import.meta.env.VITE_API_URL || '';

interface RoomsListResponse {
  rooms: RoomListItem[];
}

interface RoomSearchResponse {
  rooms: RoomSearchResult[];
}

interface RoomDetailsResponse {
  room: Room;
}

interface CreateRoomResponse {
  room: { id: string; slug: string; name: string; description: string | null; createdAt: string };
}

interface JoinRoomResponse {
  success: true;
  room: { id: string; slug: string; name: string };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function fetchMyRooms(): Promise<RoomsListResponse> {
  return apiFetch('/api/rooms');
}

function searchRooms(query: string): Promise<RoomSearchResponse> {
  return apiFetch(`/api/rooms/search?q=${encodeURIComponent(query)}`);
}

function fetchRoom(slug: string): Promise<RoomDetailsResponse> {
  return apiFetch(`/api/rooms/${slug}`);
}

function createRoom(input: CreateRoomInput): Promise<CreateRoomResponse> {
  return apiFetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

function joinRoom(slug: string): Promise<JoinRoomResponse> {
  return apiFetch(`/api/rooms/${slug}/join`, { method: 'POST' });
}

function leaveRoom(slug: string): Promise<{ success: true }> {
  return apiFetch(`/api/rooms/${slug}/leave`, { method: 'POST' });
}

function deleteRoom(slug: string): Promise<{ success: true }> {
  return apiFetch(`/api/rooms/${slug}`, { method: 'DELETE' });
}

export interface RoomMember {
  id: string;
  displayName: string;
  username: string | null;
  joinedAt: string;
}

interface RoomMembersResponse {
  members: RoomMember[];
}

function fetchRoomMembers(slug: string): Promise<RoomMembersResponse> {
  return apiFetch(`/api/rooms/${slug}/members`);
}

// Hook to fetch user's joined rooms
export function useMyRooms() {
  return useQuery({
    queryKey: ['myRooms'],
    queryFn: fetchMyRooms,
  });
}

// Hook to search for rooms
export function useRoomSearch(query: string) {
  return useQuery({
    queryKey: ['roomSearch', query],
    queryFn: () => searchRooms(query),
    enabled: query.length >= 1,
  });
}

// Hook to get room details
export function useRoom(slug: string | undefined) {
  return useQuery({
    queryKey: ['room', slug],
    queryFn: () => fetchRoom(slug!),
    enabled: !!slug,
    retry: false,
  });
}

// Hook to get room members
export function useRoomMembers(slug: string | undefined) {
  return useQuery({
    queryKey: ['roomMembers', slug],
    queryFn: () => fetchRoomMembers(slug!),
    enabled: !!slug,
  });
}

// Hook for room mutations
export function useRoomMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
    },
  });

  const joinMutation = useMutation({
    mutationFn: joinRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
      queryClient.invalidateQueries({ queryKey: ['roomSearch'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: leaveRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
    },
  });

  return {
    createRoom: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    joinRoom: joinMutation.mutateAsync,
    isJoining: joinMutation.isPending,
    joinError: joinMutation.error,

    leaveRoom: leaveMutation.mutateAsync,
    isLeaving: leaveMutation.isPending,
    leaveError: leaveMutation.error,

    deleteRoom: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}
