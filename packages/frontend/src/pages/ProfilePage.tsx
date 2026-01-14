import { useSearchParams } from 'react-router-dom';
import { useSession, type User } from '@/lib/auth-client';
import { NavBar } from '@/components/layout/NavBar';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { UserIcon, SettingsIcon, SpinnerIcon } from '@/components/icons';

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

  const user = session?.user as User | undefined;
  const fullName = user?.fullName || user?.name || 'User';
  const username = user?.username || user?.displayUsername;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-charcoal mb-2">Display Name</h2>
        <p className="text-stone">Choose how your name appears in chat messages and presence.</p>
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
        <p className="text-sm text-stone flex items-center gap-2">
          <SpinnerIcon className="w-4 h-4" />
          Saving...
        </p>
      )}
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
    <div className="min-h-screen bg-cream">
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
