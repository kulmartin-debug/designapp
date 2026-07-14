import { useState } from 'react';
import { createComparison } from '../../api/comparisons';
import { ApiRequestError } from '../../api/client';
import { translateError } from '../../i18n/sk';
import { ErrorBanner } from '../common/ErrorBanner';

export function ExportComparisonButton({
  projectId,
  beforeAssetId,
  afterAssetId,
  onExported,
}: {
  projectId: string;
  beforeAssetId: string;
  afterAssetId: string;
  onExported: () => void;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);
    try {
      await createComparison(projectId, { beforeAssetId, afterAssetId });
      onExported();
    } catch (err) {
      setError(err instanceof ApiRequestError ? translateError(err.errorCode) : 'Export zlyhal.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isExporting}
        onClick={() => void handleExport()}
        className="rounded-md bg-ink px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
      >
        {isExporting ? 'Exportujem...' : 'Exportovať porovnanie'}
      </button>
      {error && <ErrorBanner message={error} />}
    </div>
  );
}
