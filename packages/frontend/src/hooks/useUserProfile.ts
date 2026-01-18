import { useQuery } from '@tanstack/react-query';
import { userProfileSchema, type UserProfile } from '@app/shared';
import { apiFetch } from '@/lib/api';

interface UserProfileOptions {
  enabled?: boolean;
}

interface UserProfileResult {
  user: UserProfile | undefined;
  isLoading: boolean;
  error: Error | null;
}

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const data = await apiFetch<unknown>(`/api/users/${userId}`);
  return userProfileSchema.parse(data);
}

export function useUserProfile(
  userId: string | null,
  options?: UserProfileOptions
): UserProfileResult {
  const query = useQuery({
    queryKey: ['user', 'profile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
