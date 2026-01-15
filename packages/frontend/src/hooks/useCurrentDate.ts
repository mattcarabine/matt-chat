import { useState, useEffect } from 'react';

/**
 * Hook that returns the current date and updates every minute.
 * Used for date separators that show "Today"/"Yesterday" labels.
 * Only triggers re-render when the actual date changes (at midnight).
 */
export function useCurrentDate(): Date {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Only update if the date has actually changed (different day)
      setCurrentDate((prev) => {
        const prevDay = prev.toDateString();
        const nowDay = now.toDateString();
        return prevDay !== nowDay ? now : prev;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return currentDate;
}
