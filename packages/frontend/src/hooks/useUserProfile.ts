import { useQuery } from '@tanstack/react-query';
import type { UserPublicProfile } from '@app/shared';
import { apiFetch } from '@/lib/api';

interface UserProfileResponse {
  user: UserPublicProfile;
}

function fetchUserProfile(userId: string): Promise<UserProfileResponse> {
  return apiFetch(`/api/users/${userId}`);
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
