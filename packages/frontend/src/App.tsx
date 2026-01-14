import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GuestRoute } from '@/components/GuestRoute';
import { ChatProvider } from '@/providers/ChatProvider';
import { SignUpPage } from '@/pages/SignUpPage';
import { SignInPage } from '@/pages/SignInPage';
import { ChatPage } from '@/pages/ChatPage';
import { InvitationsPage } from '@/pages/InvitationsPage';
import { ProfilePage } from '@/pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route
              path="/signup"
              element={
                <GuestRoute>
                  <SignUpPage />
                </GuestRoute>
              }
            />
            <Route
              path="/signin"
              element={
                <GuestRoute>
                  <SignInPage />
                </GuestRoute>
              }
            />
            <Route
              path="/invitations"
              element={
                <ProtectedRoute>
                  <InvitationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:roomId"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </QueryClientProvider>
  );
}
