import { useSearchParams } from 'react-router-dom';
import { useSession, type User } from '@/lib/auth-client';
import { NavBar } from '@/components/layout/NavBar';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTheme } from '@/providers/ThemeProvider';
import { UserIcon, SettingsIcon, SpinnerIcon } from '@/components/icons';

function SunIcon({ className = 'w-4 h-4' }: { className?: string }): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  );
}

function MoonIcon({ className = 'w-4 h-4' }: { className?: string }): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  );
}

function ComputerIcon({ className = 'w-4 h-4' }: { className?: string }): JSX.Element {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
      />
    </svg>
  );
}

type Tab = 'profile' | 'settings';

function ProfileTab(): JSX.Element {
  const { data: session } = useSession();
  const user = session?.user as User | undefined;

  const fullName = user?.fullName || user?.name || '';
  const username = user?.username || user?.displayUsername || '';
  const email = user?.email || '';
  const initial = fullName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-forest flex items-center justify-center text-cream font-serif text-3xl">
          {initial}
        </div>
        <div>
          <h2 className="font-serif text-2xl text-charcoal">{fullName}</h2>
          {username && <p className="text-stone">@{username}</p>}
        </div>
      </div>

      <div className="space-y-6">
        <ProfileField label="Full Name" value={fullName} hint="Contact support to change your name." />
        <ProfileField
          label="Username"
          value={username ? `@${username}` : 'Not set'}
          hint="Usernames cannot be changed after signup."
        />
        <ProfileField label="Email Address" value={email} hint="Your email is used for signing in." type="email" />
      </div>
    </div>
  );
}

interface ProfileFieldProps {
  label: string;
  value: string;
  hint: string;
  type?: string;
}

function ProfileField({ label, value, hint, type = 'text' }: ProfileFieldProps): JSX.Element {
  return (
    <div className="form-group">
      <label className="auth-label">{label}</label>
      <input type={type} value={value} disabled className="auth-input bg-cream-dark/50 cursor-not-allowed" />
      <p className="text-xs text-stone mt-1">{hint}</p>
    </div>
  );
}

function SettingsTab(): JSX.Element {
  const { data: session } = useSession();
  const { preferences, updatePreference, isUpdating } = useUserPreferences();
  const { theme, setTheme } = useTheme();

  const user = session?.user as User | undefined;
  const fullName = user?.fullName || user?.name || 'User';
  const username = user?.username || user?.displayUsername;

  const themeOptions = [
    { value: 'light' as const, label: 'Light', description: 'Always use light theme', icon: SunIcon },
    { value: 'dark' as const, label: 'Dark', description: 'Always use dark theme', icon: MoonIcon },
    { value: 'system' as const, label: 'System', description: 'Follow your system preference', icon: ComputerIcon },
  ];

  return (
    <div className="space-y-12">
      {/* Display Name Section */}
      <div>
        <div className="mb-4">
          <h2 className="font-serif text-2xl text-charcoal dark:text-sand-50 mb-2">Display Name</h2>
          <p className="text-stone dark:text-sand-400">Choose how your name appears in chat messages and presence.</p>
        </div>

        <div className="space-y-3">
          <DisplayNameOption
            label="Full name"
            description={`Display as "${fullName}"`}
            checked={preferences?.displayNamePreference === 'fullName'}
            disabled={isUpdating}
            onChange={() => updatePreference('fullName')}
          />
          <DisplayNameOption
            label="Username"
            description={username ? `Display as "@${username}"` : 'No username set'}
            checked={preferences?.displayNamePreference === 'username'}
            disabled={isUpdating || !username}
            onChange={() => updatePreference('username')}
          />
        </div>

        {isUpdating && (
          <p className="text-sm text-stone dark:text-sand-400 flex items-center gap-2 mt-3">
            <SpinnerIcon className="w-4 h-4" />
            Saving...
          </p>
        )}
      </div>

      {/* Theme Section */}
      <div>
        <div className="mb-4">
          <h2 className="font-serif text-2xl text-charcoal dark:text-sand-50 mb-2">Appearance</h2>
          <p className="text-stone dark:text-sand-400">Choose your preferred theme for the interface.</p>
        </div>

        <div className="space-y-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-4 border rounded-lg transition-colors cursor-pointer ${
                  theme === option.value
                    ? 'border-ember-500 bg-ember-50 dark:bg-ember-500/10'
                    : 'border-sand-200 dark:border-sand-700 hover:bg-sand-50 dark:hover:bg-sand-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  checked={theme === option.value}
                  onChange={() => setTheme(option.value)}
                  className="mt-0.5 w-4 h-4 text-ember-500 focus:ring-ember-500"
                />
                <Icon className={`w-5 h-5 mt-0.5 ${theme === option.value ? 'text-ember-500' : 'text-sand-500 dark:text-sand-400'}`} />
                <div>
                  <p className="font-medium text-charcoal dark:text-sand-50">{option.label}</p>
                  <p className="text-sm text-stone dark:text-sand-400">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DisplayNameOptionProps {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}

function DisplayNameOption({ label, description, checked, disabled, onChange }: DisplayNameOptionProps): JSX.Element {
  const isDisabledStyle = disabled && !checked;

  return (
    <label
      className={`flex items-start gap-3 p-4 border border-stone-300/50 rounded-sm transition-colors ${
        isDisabledStyle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-cream-dark/30'
      }`}
    >
      <input
        type="radio"
        name="displayName"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 w-4 h-4 text-forest focus:ring-forest"
      />
      <div>
        <p className="font-medium text-charcoal">{label}</p>
        <p className="text-sm text-stone">{description}</p>
      </div>
    </label>
  );
}

const TABS = [
  { id: 'profile' as const, label: 'Profile', icon: UserIcon },
  { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
];

export function ProfilePage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as Tab) || 'profile';

  function handleTabChange(tab: Tab): void {
    if (tab === 'profile') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  }

  return (
    <div className="min-h-screen pt-14">
      <NavBar currentSection="profile" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-charcoal">
            {currentTab === 'profile' ? 'Profile' : 'Settings'}
          </h1>
        </div>

        <div className="flex gap-1 border-b border-stone-300/50 mb-8">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-forest text-charcoal'
                    : 'border-transparent text-stone hover:text-charcoal hover:border-stone-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {currentTab === 'profile' ? <ProfileTab /> : <SettingsTab />}
      </main>
    </div>
  );
}
