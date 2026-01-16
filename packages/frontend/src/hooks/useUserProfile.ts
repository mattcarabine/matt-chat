import { useQuery } from '@tanstack/react-query';
import type { UserProfile } from '@app/shared';
import { apiFetch } from '@/lib/api';

interface UserProfileResponse {
  user: UserProfile;
}

function fetchUserProfile(userId: string): Promise<UserProfileResponse> {
  return apiFetch(`/api/users/${userId}/profile`);
}

// Hook to fetch user profile by ID
export function useUserProfile(userId: string) {
  const query = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - profiles don't change often
    select: (response) => response.user,
    retry: (failureCount, error) => {
      // Don't retry on 404 (user not found)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
