import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '@app/shared';
import { apiFetch } from '@/lib/api';

interface UpdateBioResponse {
  bio: string | null;
}

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => apiFetch<UserProfile>(`/api/users/${userId}/profile`),
    enabled: !!userId,
  });
}

export function useUpdateBio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bio: string | null) =>
      apiFetch<UpdateBioResponse>('/api/users/me/bio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}
