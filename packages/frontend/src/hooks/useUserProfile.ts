import { useQuery } from '@tanstack/react-query';
import type { UserProfile } from '@app/shared';
import { apiFetch } from '@/lib/api';

function fetchUserProfile(userId: string): Promise<UserProfile> {
  return apiFetch(`/api/users/${userId}`);
}

/**
 * Hook to fetch a user's profile data.
 * Used by UserProfilePopover to display user details.
 */
export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
