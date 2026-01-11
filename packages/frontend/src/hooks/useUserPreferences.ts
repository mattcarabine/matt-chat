import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserPreferences, DisplayNamePreference } from '@app/shared';

const API_URL = import.meta.env.VITE_API_URL || '';

interface PreferencesResponse {
  preferences: UserPreferences;
}

async function fetchPreferences(): Promise<PreferencesResponse> {
  const response = await fetch(`${API_URL}/api/preferences`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch preferences');
  }
  return response.json();
}

async function updatePreferences(
  displayNamePreference: DisplayNamePreference
): Promise<PreferencesResponse> {
  const response = await fetch(`${API_URL}/api/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ displayNamePreference }),
  });
  if (!response.ok) {
    throw new Error('Failed to update preferences');
  }
  return response.json();
}

export function useUserPreferences() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: fetchPreferences,
  });

  const mutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['userChatInfo'] });
    },
  });

  return {
    preferences: data?.preferences,
    isLoading,
    error,
    updatePreference: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
