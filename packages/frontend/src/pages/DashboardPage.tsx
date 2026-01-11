import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession, signOut, type User } from '@/lib/auth-client';
import { ROOMS } from '@app/shared';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/signin');
  };

  const user = session?.user as User | undefined;
  const fullName = user?.fullName || user?.name || 'User';
  const username = user?.username || user?.displayUsername;
  const email = user?.email;

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-stone-300/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
                <svg className="w-4 h-4 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <span className="font-medium text-charcoal">Dashboard</span>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone hover:text-charcoal transition-colors duration-200 disabled:opacity-50"
              data-testid="signout-button"
            >
              {isSigningOut ? (
                <>
                  <span className="spinner w-4 h-4" />
                  Signing out...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Sign out
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Welcome Section */}
        <div
          className="mb-12"
          style={{ animation: 'fadeUp 0.6s ease-out' }}
        >
          <p className="text-stone text-sm uppercase tracking-wide mb-2" style={{ letterSpacing: '0.08em' }}>
            Welcome back
          </p>
          <h1
            className="font-serif text-4xl sm:text-5xl lg:text-6xl text-charcoal"
            data-testid="greeting"
          >
            Hello {fullName}
          </h1>
        </div>

        {/* Info Cards */}
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          style={{ animation: 'fadeUp 0.6s ease-out 0.1s backwards' }}
        >
          {/* Profile Card */}
          <div className="p-6 bg-cream-dark/50 rounded-sm border border-stone-300/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-forest flex items-center justify-center text-cream font-serif text-xl">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-charcoal">{fullName}</p>
                {username && (
                  <p className="text-sm text-stone">@{username}</p>
                )}
              </div>
            </div>
            {email && (
              <p className="text-sm text-stone flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                {email}
              </p>
            )}
          </div>

          {/* Status Card */}
          <div className="p-6 bg-cream-dark/50 rounded-sm border border-stone-300/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-forest animate-pulse" />
              <span className="text-sm font-medium text-forest uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
                Active Session
              </span>
            </div>
            <p className="text-charcoal">
              You are successfully authenticated and your session is active.
            </p>
          </div>

          {/* Quick Actions Card */}
          <div className="p-6 bg-cream-dark/50 rounded-sm border border-stone-300/30 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-medium text-stone uppercase tracking-wide mb-4" style={{ letterSpacing: '0.05em' }}>
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                to={`/chat/${ROOMS.LANDING_ZONE}`}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-charcoal hover:bg-forest/5 rounded-sm transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Open Chat</span>
              </Link>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-charcoal hover:bg-forest/5 rounded-sm transition-colors duration-200">
                <svg className="w-5 h-5 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Account Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-charcoal hover:bg-forest/5 rounded-sm transition-colors duration-200">
                <svg className="w-5 h-5 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <span>Activity Log</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-16 pt-8 border-t border-stone-300/30 text-center"
          style={{ animation: 'fadeUp 0.6s ease-out 0.2s backwards' }}
        >
          <p className="text-sm text-stone">
            Securely authenticated with BetterAuth
          </p>
        </div>
      </main>
    </div>
  );
}
