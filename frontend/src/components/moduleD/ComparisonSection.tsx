import { useState } from 'react';
import type { Asset, ComparisonExport } from '../../types/api';
import { assetFileUrl, comparisonDownloadUrl } from '../../api/client';
import { sk } from '../../i18n/sk';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { CameraMatchTip } from './CameraMatchTip';
import { ExportComparisonButton } from './ExportComparisonButton';

// Only categories that represent an actual "PRED" or "PO" photo make sense to
// pick here - derived control images and prior exports would be noise.
const SELECTABLE_CATEGORIES: Asset['category'][] = ['FOTO_SUCASNY_STAV', 'NAVRH_SKETCHUP', 'GENERATED_OUTPUT'];

function assetLabel(asset: Asset, index: number): string {
  return asset.originalFilename ?? `${sk.assetCategories[asset.category]} #${index + 1}`;
}

export function ComparisonSection({
  projectId,
  assets,
  comparisons,
  onExported,
}: {
  projectId: string;
  assets: Asset[];
  comparisons: ComparisonExport[];
  onExported: () => void;
}) {
  const [beforeAssetId, setBeforeAssetId] = useState('');
  const [afterAssetId, setAfterAssetId] = useState('');
  const selectableAssets = assets.filter((a) => SELECTABLE_CATEGORIES.includes(a.category));

  return (
    <div className="space-y-4 rounded-lg border border-line bg-card p-4 shadow-sm">
      <CameraMatchTip />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={beforeAssetId}
          onChange={(e) => setBeforeAssetId(e.target.value)}
          className="rounded-md border border-line bg-card px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
        >
          <option value="">Vyberte PRED obrázok...</option>
          {selectableAssets.map((asset, index) => (
            <option key={asset.id} value={asset.id}>
              {assetLabel(asset, index)}
            </option>
          ))}
        </select>
        <select
          value={afterAssetId}
          onChange={(e) => setAfterAssetId(e.target.value)}
          className="rounded-md border border-line bg-card px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
        >
          <option value="">Vyberte PO obrázok...</option>
          {selectableAssets.map((asset, index) => (
            <option key={asset.id} value={asset.id}>
              {assetLabel(asset, index)}
            </option>
          ))}
        </select>
      </div>

      {beforeAssetId && afterAssetId && (
        <div className="space-y-3">
          <BeforeAfterSlider beforeAssetId={beforeAssetId} afterAssetId={afterAssetId} />
          <ExportComparisonButton
            projectId={projectId}
            beforeAssetId={beforeAssetId}
            afterAssetId={afterAssetId}
            onExported={onExported}
          />
        </div>
      )}

      {comparisons.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-soft">Exportované porovnania</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {comparisons.map((comparison) => (
              <a
                key={comparison.id}
                href={comparisonDownloadUrl(comparison.id)}
                className="block overflow-hidden rounded-md border border-line transition-colors hover:border-brand-300"
              >
                <img src={assetFileUrl(comparison.resultAssetId)} alt="Export porovnania" className="h-24 w-full object-cover" />
                <p className="px-2 py-1 text-xs text-brand-600">Stiahnuť</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
