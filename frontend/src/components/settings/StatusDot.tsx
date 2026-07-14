export type DotColor = 'green' | 'red' | 'orange';

const COLOR_CLASSES: Record<DotColor, string> = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  orange: 'bg-amber-500',
};

const LABELS: Record<DotColor, string> = {
  green: 'Aktívne',
  red: 'Neaktívne',
  orange: 'Pripája sa...',
};

export function StatusDot({ color }: { color: DotColor }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${COLOR_CLASSES[color]} ${color === 'orange' ? 'animate-pulse' : ''}`}
      />
      <span className="text-xs uppercase tracking-wide text-ink-soft">{LABELS[color]}</span>
    </span>
  );
}
