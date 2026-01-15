export interface DateSeparatorProps {
  label: string;
}

export function DateSeparator({ label }: DateSeparatorProps): React.ReactElement {
  return (
    <div className="flex items-center gap-4 py-2" data-testid="date-separator">
      <div className="flex-1 h-px bg-stone-300 dark:bg-stone-600" />
      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-px bg-stone-300 dark:bg-stone-600" />
    </div>
  );
}
