import * as Ably from 'ably';
import { ChatClient } from '@ably/chat';

const API_URL = import.meta.env.VITE_API_URL || '';

// Create Ably Realtime client with token authentication
export function createAblyClient(): Ably.Realtime {
  return new Ably.Realtime({
    authCallback: async (_tokenParams, callback) => {
      try {
        const response = await fetch(`${API_URL}/api/ably/token`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message = data.error || `Token request failed (${response.status})`;
          throw new Error(message);
        }

        const { tokenRequest } = await response.json();
        callback(null, tokenRequest);
      } catch (error) {
        console.error('Ably auth error:', error);
        callback(
          error instanceof Error ? error.message : 'Token fetch failed',
          null
        );
      }
    },
  });
}

// Create Chat client from Ably client
export function createChatClient(ablyClient: Ably.Realtime): ChatClient {
  return new ChatClient(ablyClient);
}
