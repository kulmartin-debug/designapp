import { useEffect, useState } from 'react';
import type { Asset } from '../../types/api';
import { createCurrentStateJob, retryJob } from '../../api/jobs';
import { useJobPolling } from '../../hooks/useJobPolling';
import { assetFileUrl } from '../../api/client';
import { JobStatusBadge } from './JobStatusBadge';
import { ErrorBanner } from '../common/ErrorBanner';
import { ApiRequestError } from '../../api/client';
import { translateError } from '../../i18n/sk';

export function CurrentStateEnhancePanel({ photos, onDone }: { photos: Asset[]; onDone: () => void }) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const { job } = useJobPolling(jobId);

  const isBusy = job?.status === 'PENDING' || job?.status === 'RUNNING';

  async function handleStart() {
    if (!selectedAssetId) return;
    setCreateError(null);
    try {
      const created = await createCurrentStateJob(photos[0].projectId, { assetId: selectedAssetId });
      setJobId(created.id);
    } catch (err) {
      setCreateError(err instanceof ApiRequestError ? translateError(err.errorCode) : 'Nepodarilo sa spustiť generovanie.');
    }
  }

  async function handleRetry() {
    if (!job) return;
    const updated = await retryJob(job.id);
    setJobId(updated.id);
  }

  useEffect(() => {
    if (job?.status === 'DONE') onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  return (
    <div className="space-y-3 rounded-lg border border-line bg-card p-4 shadow-sm">
      <h3 className="font-serif text-base text-ink">Vylepšiť fotku súčasného stavu</h3>
      {photos.length === 0 ? (
        <p className="text-sm text-ink-soft/70">Najprv nahrajte aspoň jednu fotku súčasného stavu vyššie.</p>
      ) : (
        <>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
          >
            <option value="">Vyberte fotku...</option>
            {photos.map((photo) => (
              <option key={photo.id} value={photo.id}>
                {photo.originalFilename ?? photo.id}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!selectedAssetId || isBusy}
            onClick={() => void handleStart()}
            className="rounded-md bg-ink px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
          >
            Vygenerovať vizualizáciu
          </button>

          {createError && <ErrorBanner message={createError} />}

          {job && (
            <div className="space-y-2 rounded-md border border-line bg-paper p-3">
              <div className="flex items-center justify-between">
                <JobStatusBadge status={job.status} />
                <span className="text-xs text-ink-soft">${job.estimatedCostUsd.toFixed(3)}</span>
              </div>
              {job.status === 'FAILED' && (
                <div className="space-y-2">
                  <ErrorBanner errorCode={job.errorCode} />
                  <button type="button" onClick={() => void handleRetry()} className="text-sm text-brand-600 underline">
                    Skúsiť znova
                  </button>
                </div>
              )}
              {job.status === 'DONE' && job.variants[0]?.asset && (
                <img
                  src={assetFileUrl(job.variants[0].asset.id)}
                  alt="Vylepšený súčasný stav"
                  className="max-h-80 rounded-md"
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
