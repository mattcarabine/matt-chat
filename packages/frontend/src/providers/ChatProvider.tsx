import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import * as Ably from 'ably';
import { ChatClient } from '@ably/chat';
import {
  ChatClientProvider as AblyChatClientProvider,
  ChatRoomProvider as AblyChatRoomProvider,
} from '@ably/chat/react';
import { createAblyClient, createChatClient } from '@/lib/ably-client';
import { useSession } from '@/lib/auth-client';

interface ChatContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: Error | null;
  ablyClient: Ably.Realtime | null;
  chatClient: ChatClient | null;
}

const ChatContext = createContext<ChatContextValue>({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  ablyClient: null,
  chatClient: null,
});

export function useChatConnection() {
  return useContext(ChatContext);
}

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { data: session } = useSession();
  const [ablyClient, setAblyClient] = useState<Ably.Realtime | null>(null);
  const [chatClient, setChatClient] = useState<ChatClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  useEffect(() => {
    // Don't connect if no user session
    if (!session?.user) {
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    const client = createAblyClient();
    const chat = createChatClient(client);

    function handleConnected(): void {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
    }

    function handleDisconnected(): void {
      setIsConnected(false);
    }

    function handleFailed(stateChange: Ably.ConnectionStateChange): void {
      setIsConnecting(false);
      setConnectionError(
        new Error(stateChange.reason?.message || 'Connection failed')
      );
    }

    client.connection.on('connected', handleConnected);
    client.connection.on('disconnected', handleDisconnected);
    client.connection.on('failed', handleFailed);

    setAblyClient(client);
    setChatClient(chat);

    return () => {
      client.connection.off('connected', handleConnected);
      client.connection.off('disconnected', handleDisconnected);
      client.connection.off('failed', handleFailed);
      client.close();
      setAblyClient(null);
      setChatClient(null);
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [session?.user?.id]);

  const contextValue = useMemo(
    () => ({
      isConnected,
      isConnecting,
      connectionError,
      ablyClient,
      chatClient,
    }),
    [isConnected, isConnecting, connectionError, ablyClient, chatClient]
  );

  // If we have a chat client, wrap children with the Ably provider
  if (chatClient) {
    return (
      <ChatContext.Provider value={contextValue}>
        <AblyChatClientProvider client={chatClient}>
          {children}
        </AblyChatClientProvider>
      </ChatContext.Provider>
    );
  }

  // No client yet, just provide context
  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

// Room-specific provider for multi-room support
interface RoomProviderProps {
  roomId: string;
  children: React.ReactNode;
}

export function RoomProvider({ roomId, children }: RoomProviderProps) {
  const { chatClient, isConnecting, connectionError } = useChatConnection();

  const roomOptions = useMemo(
    () => ({
      typing: { heartbeatThrottleMs: 5000 },
    }),
    []
  );

  // Show loading state while connecting
  if (!chatClient) {
    return (
      <div className="flex items-center justify-center h-full bg-cream">
        {connectionError ? (
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to connect to chat</p>
            <p className="text-stone text-sm">{connectionError.message}</p>
          </div>
        ) : isConnecting ? (
          <div className="flex items-center gap-3">
            <div className="spinner w-6 h-6 text-forest" />
            <span className="text-stone">Connecting to chat...</span>
          </div>
        ) : (
          <p className="text-stone">Initializing chat...</p>
        )}
      </div>
    );
  }

  return (
    <AblyChatRoomProvider name={roomId} options={roomOptions}>
      {children}
    </AblyChatRoomProvider>
  );
}
