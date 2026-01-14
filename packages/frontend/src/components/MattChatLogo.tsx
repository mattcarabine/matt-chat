interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

/**
 * MattChat Logo - Two overlapping chat bubbles forming an abstract "M"
 * The bubbles are offset and rotated slightly for a playful, dynamic feel
 */
export function MattChatLogo({ className = '', showWordmark = true }: LogoProps): JSX.Element {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo mark - two overlapping chat bubbles */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 flex-shrink-0"
        aria-hidden="true"
      >
        {/* Back bubble - slightly rotated */}
        <g transform="rotate(-8 16 16)">
          <path
            d="M6 8C6 5.79086 7.79086 4 10 4H22C24.2091 4 26 5.79086 26 8V16C26 18.2091 24.2091 20 22 20H18L14 24V20H10C7.79086 20 6 18.2091 6 16V8Z"
            className="fill-ember-300 dark:fill-ember-700"
          />
        </g>
        {/* Front bubble - main orange */}
        <g transform="rotate(5 16 16)">
          <path
            d="M6 10C6 7.79086 7.79086 6 10 6H22C24.2091 6 26 7.79086 26 10V18C26 20.2091 24.2091 22 22 22H18L14 26V22H10C7.79086 22 6 20.2091 6 18V10Z"
            className="fill-ember-500 dark:fill-ember-500"
          />
        </g>
        {/* Chat dots inside front bubble */}
        <g transform="rotate(5 16 16)">
          <circle cx="11" cy="14" r="1.5" className="fill-white/90" />
          <circle cx="16" cy="14" r="1.5" className="fill-white/90" />
          <circle cx="21" cy="14" r="1.5" className="fill-white/90" />
        </g>
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span className="font-display font-semibold text-lg tracking-tight text-sand-900 dark:text-sand-50">
          MattChat
        </span>
      )}
    </div>
  );
}

/**
 * Compact logo icon only - for favicon or small spaces
 */
export function MattChatIcon({ className = 'w-8 h-8' }: { className?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MattChat"
    >
      {/* Back bubble */}
      <g transform="rotate(-8 16 16)">
        <path
          d="M6 8C6 5.79086 7.79086 4 10 4H22C24.2091 4 26 5.79086 26 8V16C26 18.2091 24.2091 20 22 20H18L14 24V20H10C7.79086 20 6 18.2091 6 16V8Z"
          className="fill-ember-300 dark:fill-ember-700"
        />
      </g>
      {/* Front bubble */}
      <g transform="rotate(5 16 16)">
        <path
          d="M6 10C6 7.79086 7.79086 6 10 6H22C24.2091 6 26 7.79086 26 10V18C26 20.2091 24.2091 22 22 22H18L14 26V22H10C7.79086 22 6 20.2091 6 18V10Z"
          className="fill-ember-500"
        />
      </g>
      {/* Dots */}
      <g transform="rotate(5 16 16)">
        <circle cx="11" cy="14" r="1.5" fill="white" fillOpacity="0.9" />
        <circle cx="16" cy="14" r="1.5" fill="white" fillOpacity="0.9" />
        <circle cx="21" cy="14" r="1.5" fill="white" fillOpacity="0.9" />
      </g>
    </svg>
  );
}
