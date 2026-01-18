import { useParams, Link } from 'react-router-dom';
import { DmRoom } from '@/components/chat/DmRoom';
import { RoomSidebar } from '@/components/chat';
import { NavBar } from '@/components/layout/NavBar';
import { SpinnerIcon } from '@/components/icons';
import { useDm } from '@/hooks/useDms';

function LoadingScreen({ message = 'Loading...' }: { message?: string }): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3">
        <SpinnerIcon className="w-6 h-6 border-ember-500 border-t-transparent" />
        <span className="text-sand-500 dark:text-sand-400">{message}</span>
      </div>
    </div>
  );
}

export function DmPage(): JSX.Element {
  const { dmId } = useParams<{ dmId: string }>();
  const { data: dmData, isLoading, error } = useDm(dmId);

  if (!dmId) {
    return <LoadingScreen />;
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col pt-14">
        <NavBar currentSection="chat" />
        <div className="flex-1 flex overflow-hidden">
          <RoomSidebar currentRoomSlug="" />
          <div className="flex-1 flex items-center justify-center bg-cream">
            <div className="flex items-center gap-3">
              <SpinnerIcon className="w-6 h-6 border-forest border-t-transparent" />
              <span className="text-stone">Loading conversation...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dmData?.dm) {
    return (
      <div className="h-screen flex flex-col pt-14">
        <NavBar currentSection="chat" />
        <div className="flex-1 flex overflow-hidden">
          <RoomSidebar currentRoomSlug="" />
          <div className="flex-1 flex items-center justify-center bg-cream">
            <div className="text-center">
              <h1 className="font-serif text-4xl text-charcoal mb-4">Conversation Not Found</h1>
              <p className="text-stone mb-6">The conversation you're looking for doesn't exist.</p>
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 bg-forest text-cream rounded-lg hover:bg-forest-light transition-colors"
              >
                Go to Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dm = dmData.dm;

  return (
    <div className="h-screen flex flex-col pt-14">
      <NavBar currentSection="chat" />

      <div className="flex-1 flex overflow-hidden">
        <RoomSidebar currentRoomSlug="" currentDmSlug={dmId} />
        <div className="flex-1 overflow-hidden">
          {/* key={dmId} forces React to remount DmRoom when switching DMs,
              ensuring Ably subscriptions and message history are properly reset */}
          <DmRoom
            key={dmId}
            dmId={dm.id}
            dmSlug={dm.slug}
            ablyRoomId={dm.ablyRoomId}
            dmType={dm.dmType}
            participants={dm.participants}
          />
        </div>
      </div>
    </div>
  );
}
