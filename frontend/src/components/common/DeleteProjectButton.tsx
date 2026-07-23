import { useState } from 'react';
import { deleteProject } from '../../api/projects';
import { ApiRequestError } from '../../api/client';

export function DeleteProjectButton({
  projectId,
  projectName,
  onDeleted,
}: {
  projectId: string;
  projectName: string;
  onDeleted: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);
    setError(null);
    try {
      await deleteProject(projectId);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Zmazanie zlyhalo.');
      setIsDeleting(false);
    }
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(false);
    setError(null);
  }

  function handleStart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(true);
  }

  if (isConfirming) {
    return (
      <div
        className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-red-800">Naozaj vymazať „{projectName}"?</span>
        <button
          type="button"
          disabled={isDeleting}
          onClick={(e) => void handleConfirm(e)}
          className="text-xs font-medium uppercase tracking-wide text-red-700 underline disabled:opacity-40"
        >
          {isDeleting ? 'Mažem...' : 'Áno, vymazať'}
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={handleCancel}
          className="text-xs font-medium uppercase tracking-wide text-ink-soft underline disabled:opacity-40"
        >
          Zrušiť
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      aria-label={`Zmazať projekt ${projectName}`}
      title="Zmazať projekt"
      className="rounded-md p-1.5 text-ink-soft/60 transition-colors hover:bg-red-50 hover:text-red-700"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a2 2 0 0 1-2 1.9H9.8a2 2 0 0 1-2-1.9L7 7h10Z" />
      </svg>
    </button>
  );
}
