import { useRef, useState } from 'react';
import { assetFileUrl } from '../../api/client';

export function BeforeAfterSlider({
  beforeAssetId,
  afterAssetId,
  beforeLabel = 'PRED',
  afterLabel = 'PO',
}: {
  beforeAssetId: string;
  afterAssetId: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  function updatePosition(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full select-none overflow-hidden rounded-lg border border-line shadow-sm"
      onMouseDown={(e) => {
        isDragging.current = true;
        updatePosition(e.clientX);
      }}
      onMouseMove={(e) => {
        if (isDragging.current) updatePosition(e.clientX);
      }}
      onMouseUp={() => {
        isDragging.current = false;
      }}
      onMouseLeave={() => {
        isDragging.current = false;
      }}
      onTouchStart={(e) => updatePosition(e.touches[0].clientX)}
      onTouchMove={(e) => updatePosition(e.touches[0].clientX)}
    >
      <img src={assetFileUrl(afterAssetId)} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={assetFileUrl(beforeAssetId)} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" />
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-ink/70 px-2 py-1 text-xs font-medium uppercase tracking-[0.15em] text-white">
        {beforeLabel}
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-ink/70 px-2 py-1 text-xs font-medium uppercase tracking-[0.15em] text-white">
        {afterLabel}
      </div>

      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-600/90" />
      </div>
    </div>
  );
}
