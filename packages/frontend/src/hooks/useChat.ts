import { useCallback, useEffect, useState, useRef } from 'react';
import {
  useMessages,
  usePresence,
  usePresenceListener,
  useTyping,
} from '@ably/chat/react';
import type { Message, PresenceMember } from '@ably/chat';
import type { PresenceData, ChatMessage } from '@app/shared';

const API_URL = import.meta.env.VITE_API_URL || '';

interface ChatUser {
  clientId: string;
  displayName: string;
  userId: string;
}

interface UserChatInfo {
  userId: string;
  displayName: string;
  displayNamePreference: 'fullName' | 'username';
}

async function fetchUserChatInfo(): Promise<UserChatInfo> {
  const response = await fetch(`${API_URL}/api/users/me/chat-info`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  return response.json();
}

function formatMessage(msg: Message): ChatMessage {
  return {
    id: msg.serial,
    roomId: '',
    clientId: msg.clientId,
    text: msg.text,
    timestamp: msg.timestamp.getTime(),
    metadata: msg.metadata as ChatMessage['metadata'],
  };
}

// Hook for chat messages with history
export function useChatMessages() {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userInfo, setUserInfo] = useState<UserChatInfo | null>(null);
  const historyLoadedRef = useRef(false);

  const handleMessage = useCallback((event: { message: Message }) => {
    const formatted = formatMessage(event.message);
    setLocalMessages((prev) => {
      if (prev.some((m) => m.id === formatted.id)) {
        return prev;
      }
      return [...prev, formatted];
    });
  }, []);

  const { sendMessage: ablySendMessage, history } = useMessages({
    listener: handleMessage,
  });

  useEffect(() => {
    fetchUserChatInfo().then(setUserInfo).catch(console.error);
  }, []);

  useEffect(() => {
    if (historyLoadedRef.current) return;

    async function loadHistory(): Promise<void> {
      try {
        setIsLoading(true);
        historyLoadedRef.current = true;
        const result = await history({ limit: 50 });
        const formatted = result.items.map(formatMessage);
        // History comes in reverse order (newest first), so reverse it
        setLocalMessages(formatted.reverse());
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [history]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!userInfo) {
        throw new Error('User info not loaded');
      }
      await ablySendMessage({
        text,
        metadata: {
          displayName: userInfo.displayName,
          userId: userInfo.userId,
        },
      });
    },
    [ablySendMessage, userInfo]
  );

  return { messages: localMessages, sendMessage, isLoading, error, userInfo };
}

// Hook for presence (online users)
export function useChatPresence() {
  const { presenceData } = usePresenceListener();
  const { update } = usePresence({ autoEnterLeave: true });
  const [isLoading, setIsLoading] = useState(true);
  const enteredRef = useRef(false);

  useEffect(() => {
    if (enteredRef.current) return;

    async function enterWithData(): Promise<void> {
      try {
        enteredRef.current = true;
        const userInfo = await fetchUserChatInfo();
        await update({
          displayName: userInfo.displayName,
          userId: userInfo.userId,
          displayNamePreference: userInfo.displayNamePreference,
        } as PresenceData);
      } catch (err) {
        console.error('Failed to update presence:', err);
      } finally {
        setIsLoading(false);
      }
    }
    enterWithData();
  }, [update]);

  const users: ChatUser[] = presenceData.map((member: PresenceMember) => {
    const data = member.data as PresenceData | undefined;
    return {
      clientId: member.clientId,
      displayName: data?.displayName ?? 'Anonymous',
      userId: data?.userId ?? member.clientId,
    };
  });

  return { users, isLoading };
}

// Hook for typing indicators
export function useChatTyping() {
  const { currentlyTyping, keystroke, stop } = useTyping();
  const { presenceData } = usePresenceListener();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user ID to filter out self
  useEffect(() => {
    fetchUserChatInfo()
      .then((info) => setCurrentUserId(info.userId))
      .catch(console.error);
  }, []);

  // Map client IDs to display names, filtering out the current user
  const typingUsers = Array.from(currentlyTyping)
    .filter((clientId) => clientId !== currentUserId)
    .map((clientId) => {
      const member = presenceData.find((m: PresenceMember) => m.clientId === clientId);
      const data = member?.data as PresenceData | undefined;
      return data?.displayName ?? 'Someone';
    });

  return {
    typingUsers,
    startTyping: keystroke,
    stopTyping: stop,
  };
}

// Combined hook for convenience
export function useChat() {
  const messagesData = useChatMessages();
  const presenceData = useChatPresence();
  const typingData = useChatTyping();

  return {
    ...messagesData,
    users: presenceData.users,
    presenceLoading: presenceData.isLoading,
    ...typingData,
  };
}
