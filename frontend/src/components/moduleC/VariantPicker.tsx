import type { GenerationVariant } from '../../types/api';
import { assetFileUrl } from '../../api/client';
import { selectVariant } from '../../api/jobs';

export function VariantPicker({
  jobId,
  variants,
  onSelected,
}: {
  jobId: string;
  variants: GenerationVariant[];
  onSelected: () => void;
}) {
  async function handleSelect(variantId: string) {
    await selectVariant(jobId, variantId);
    onSelected();
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {variants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          onClick={() => void handleSelect(variant.id)}
          className={`overflow-hidden rounded-md border-2 text-left transition-colors ${
            variant.isSelected ? 'border-brand-500' : 'border-transparent hover:border-line'
          }`}
        >
          {variant.asset && (
            <img src={assetFileUrl(variant.asset.id)} alt={`Variant ${variant.variantIndex + 1}`} className="h-32 w-full object-cover" />
          )}
          <p className="px-2 py-1 text-xs text-ink-soft">
            Variant {variant.variantIndex + 1}
            {variant.isSelected && ' — finálny výber'}
          </p>
        </button>
      ))}
    </div>
  );
}
