import { useQuery } from '@tanstack/react-query';
import type { UserSearchResult } from '@app/shared';
import { apiFetch } from '@/lib/api';

interface UserSearchResponse {
  users: UserSearchResult[];
}

function searchUsers(query: string): Promise<UserSearchResponse> {
  if (query.length < 2) {
    return Promise.resolve({ users: [] });
  }
  return apiFetch(`/api/users/search?q=${encodeURIComponent(query)}`);
}

// Hook to search users by username/name
export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 2,
  });
}
