import type { Asset } from '../../types/api';
import { assetFileUrl } from '../../api/client';
import { deleteAsset } from '../../api/assets';
import { sk } from '../../i18n/sk';

export function AssetGallery({ assets, onChanged }: { assets: Asset[]; onChanged: () => void }) {
  if (assets.length === 0) {
    return <p className="text-sm text-ink-soft/70">Zatiaľ žiadne súbory.</p>;
  }

  async function handleDelete(id: string) {
    await deleteAsset(id);
    onChanged();
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {assets.map((asset) => (
        <div key={asset.id} className="group relative overflow-hidden rounded-lg border border-line bg-card shadow-sm">
          {asset.mimeType === 'application/pdf' ? (
            <div className="flex h-28 items-center justify-center bg-paper-dark text-xs text-ink-soft">PDF</div>
          ) : (
            <img src={assetFileUrl(asset.id)} alt={asset.originalFilename ?? ''} className="h-28 w-full object-cover" />
          )}
          <div className="p-2">
            <p className="truncate text-xs text-ink-soft">{asset.originalFilename}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleDelete(asset.id)}
            className="absolute right-1 top-1 hidden rounded bg-white/90 px-2 py-0.5 text-xs text-red-700 group-hover:block"
          >
            {sk.common.delete}
          </button>
        </div>
      ))}
    </div>
  );
}
