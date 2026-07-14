import type { JobStatus } from '../../types/api';

const LABELS: Record<JobStatus, string> = {
  PENDING: 'Čaká vo fronte',
  RUNNING: 'Generuje sa...',
  DONE: 'Hotovo',
  FAILED: 'Zlyhalo',
  CANCELLED: 'Zrušené',
};

const COLORS: Record<JobStatus, string> = {
  PENDING: 'bg-paper-dark text-ink-soft',
  RUNNING: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-paper-dark text-ink-soft/70',
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${COLORS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
