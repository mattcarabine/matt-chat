interface PresenceItemProps {
  displayName: string;
  isCurrentUser: boolean;
}

export function PresenceItem({ displayName, isCurrentUser }: PresenceItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center text-cream text-sm font-serif">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-cream" />
      </div>
      <span
        className={`text-sm ${isCurrentUser ? 'font-medium text-charcoal' : 'text-stone'}`}
      >
        {displayName}
        {isCurrentUser && <span className="text-stone-400 ml-1">(you)</span>}
      </span>
    </div>
  );
}
