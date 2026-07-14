export function CameraMatchTip() {
  return (
    <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700">
      <strong>Tip:</strong> Porovnanie funguje najlepšie, keď PRED a PO obrázok zdieľajú rovnaký uhol pohľadu.
      V SketchUpe si nastavte fotku súčasného stavu ako pozadie cez <em>Camera → Match New Photo</em> a z rovnakého
      uhla exportujte aj nový návrh.
    </div>
  );
}
