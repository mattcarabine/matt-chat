import { useChatConnection } from '@/providers/ChatProvider';

export function ConnectionStatus() {
  const { isConnected, isConnecting, connectionError } = useChatConnection();

  if (connectionError) {
    return (
      <div
        data-testid="connection-status"
        data-status="disconnected"
        className="flex items-center gap-2 text-sm text-red-600"
      >
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>Disconnected</span>
      </div>
    );
  }

  if (isConnecting || !isConnected) {
    return (
      <div
        data-testid="connection-status"
        data-status="connecting"
        className="flex items-center gap-2 text-sm text-stone"
      >
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div
      data-testid="connection-status"
      data-status="connected"
      className="flex items-center gap-2 text-sm text-forest"
    >
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span>Connected</span>
    </div>
  );
}
