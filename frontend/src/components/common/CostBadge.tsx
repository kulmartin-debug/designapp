export function CostBadge({ totalCostUsd }: { totalCostUsd: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium tracking-wide text-brand-700">
      Odhadované náklady: <strong>${totalCostUsd.toFixed(3)}</strong>
    </span>
  );
}
