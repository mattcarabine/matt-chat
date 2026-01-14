import { Navigate } from 'react-router-dom';
import { useSession } from '@/lib/auth-client';

interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestRoute({
  children,
  redirectTo = '/chat',
}: GuestRouteProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
