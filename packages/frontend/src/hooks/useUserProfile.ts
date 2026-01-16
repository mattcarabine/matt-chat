import { useQuery } from '@tanstack/react-query';
import type { UserPublicProfile } from '@app/shared';
import { apiFetch } from '@/lib/api';

interface UserProfileResponse {
  user: UserPublicProfile;
}

function fetchUserProfile(userId: string): Promise<UserPublicProfile> {
  return apiFetch<UserProfileResponse>(`/api/users/${userId}`).then((res) => res.user);
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}
