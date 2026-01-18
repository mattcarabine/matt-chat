import { useState, useRef, useEffect, useCallback } from 'react';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  storageKey?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function ChevronIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  storageKey,
  actions,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`collapsible-${storageKey}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultOpen;
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  const updateHeight = useCallback(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    updateHeight();

    // Set up ResizeObserver to handle dynamic content changes
    const resizeObserver = new ResizeObserver(updateHeight);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [updateHeight]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      const newValue = !prev;
      if (storageKey) {
        localStorage.setItem(`collapsible-${storageKey}`, String(newValue));
      }
      return newValue;
    });
  }, [storageKey]);

  return (
    <div data-testid={`collapsible-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-2 group"
          aria-expanded={isOpen}
          data-testid="collapsible-toggle"
        >
          <ChevronIcon
            className={`w-3.5 h-3.5 text-sand-500 dark:text-sand-400 transition-transform duration-200 ${
              isOpen ? 'rotate-90' : 'rotate-0'
            }`}
          />
          <span className="font-serif text-sm tracking-wide text-charcoal dark:text-sand-200 uppercase" style={{ letterSpacing: '0.08em' }}>
            {title}
          </span>
          {count !== undefined && (
            <span
              className="text-xs text-sand-500 dark:text-sand-400 bg-sand-100 dark:bg-sand-800 px-1.5 py-0.5 rounded"
              data-testid="collapsible-count"
            >
              {count}
            </span>
          )}
        </button>

        {actions && (
          <div className="flex items-center gap-1" data-testid="collapsible-actions">
            {actions}
          </div>
        )}
      </div>

      {/* Collapsible content */}
      <div
        className="overflow-hidden transition-[max-height] duration-200 ease-out"
        style={{ maxHeight: isOpen ? contentHeight : 0 }}
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
}
