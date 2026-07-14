import { useEffect, useState } from 'react';
import type { Asset } from '../../types/api';
import { createSketchRenderJob, retryJob } from '../../api/jobs';
import { useJobPolling } from '../../hooks/useJobPolling';
import { JobStatusBadge } from '../moduleB/JobStatusBadge';
import { VariantPicker } from './VariantPicker';
import { ErrorBanner } from '../common/ErrorBanner';
import { ApiRequestError } from '../../api/client';
import { translateError } from '../../i18n/sk';

const VARIANT_OPTIONS = [1, 2, 3, 4];

export function SketchRenderPanel({ sketches, onDone }: { sketches: Asset[]; onDone: () => void }) {
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [numVariants, setNumVariants] = useState(2);
  const [jobId, setJobId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const { job, refetch } = useJobPolling(jobId);

  const isBusy = job?.status === 'PENDING' || job?.status === 'RUNNING';

  async function handleStart() {
    if (!selectedAssetId || !styleDescription.trim()) return;
    setCreateError(null);
    try {
      const created = await createSketchRenderJob(sketches[0].projectId, {
        assetId: selectedAssetId,
        styleDescription,
        numVariants,
      });
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
      <h3 className="font-serif text-base text-ink">Návrh nového interiéru zo SketchUp náčrtu</h3>
      {sketches.length === 0 ? (
        <p className="text-sm text-ink-soft/70">Najprv nahrajte aspoň jeden screenshot náčrtu vyššie.</p>
      ) : (
        <>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
          >
            <option value="">Vyberte náčrt...</option>
            {sketches.map((sketch) => (
              <option key={sketch.id} value={sketch.id}>
                {sketch.originalFilename ?? sketch.id}
              </option>
            ))}
          </select>

          <textarea
            value={styleDescription}
            onChange={(e) => setStyleDescription(e.target.value)}
            placeholder="Popis štýlu, napr. škandinávsky štýl, svetlý dub, biele steny, teplé svetlo"
            rows={2}
            className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <label className="text-sm text-ink-soft">Počet variantov:</label>
            <select
              value={numVariants}
              onChange={(e) => setNumVariants(Number(e.target.value))}
              className="rounded-md border border-line bg-card px-2 py-1 text-sm text-ink focus:border-brand-500 focus:outline-none"
            >
              {VARIANT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!selectedAssetId || !styleDescription.trim() || isBusy}
            onClick={() => void handleStart()}
            className="rounded-md bg-ink px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
          >
            Vygenerovať návrh
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
              {job.status === 'DONE' && job.variants.length > 0 && (
                <VariantPicker jobId={job.id} variants={job.variants} onSelected={() => void refetch()} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
