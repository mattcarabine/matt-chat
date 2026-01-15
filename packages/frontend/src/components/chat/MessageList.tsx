import { useEffect, useRef } from 'react';
import { useChatMessages } from '@/hooks/useChat';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import { formatDateSeparator, isDifferentDay } from '@/lib/dateFormat';
import { MessageItem } from './MessageItem';
import { DateSeparator } from './DateSeparator';
import { useSession } from '@/lib/auth-client';

interface MessageListProps {
  roomSlug: string;
}

export function MessageList({ roomSlug }: MessageListProps) {
  const { messages, isLoading, error } = useChatMessages();
  const { data: session } = useSession();
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentDate = useCurrentDate();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-8 h-8 text-forest" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-stone">Failed to load messages</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="message-list-empty">
        <div className="text-center">
          <p className="text-stone text-lg">No messages yet</p>
          <p className="text-stone-400 text-sm mt-1">Be the first to say hello!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-4 space-y-4" data-testid="message-list">
      {messages.map((message, index) => {
        const isOwn = message.metadata?.userId === session?.user?.id;
        const prevMessage = messages[index - 1];
        const showAvatar =
          index === 0 || prevMessage?.metadata?.userId !== message.metadata?.userId;

        // Show date separator for first message or when day changes
        const showDateSeparator =
          index === 0 ||
          (prevMessage && isDifferentDay(prevMessage.timestamp, message.timestamp));

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <DateSeparator
                label={formatDateSeparator(message.timestamp, currentDate)}
              />
            )}
            <MessageItem
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
              roomSlug={roomSlug}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
