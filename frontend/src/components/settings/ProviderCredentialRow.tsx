import { useState } from 'react';
import type { ProviderCredentialSummary, ProviderName } from '../../types/api';
import { removeProviderKey, saveProviderKey, testProviderConnection } from '../../api/settings';
import { ApiRequestError } from '../../api/client';
import { StatusDot, type DotColor } from './StatusDot';

const PROVIDER_LABELS: Record<ProviderName, string> = {
  REPLICATE: 'Replicate',
  FAL: 'fal.ai',
  GEMINI: 'Gemini',
  MOCK: 'Mock',
};

const PROVIDER_DESCRIPTIONS: Partial<Record<ProviderName, string>> = {
  REPLICATE:
    'Používa sa pre Modul B (vylepšenie fotky súčasného stavu) aj Modul C (fotorealistický render zo SketchUp náčrtu so zachovaním geometrie). Kľúč získate na replicate.com/account/api-tokens.',
  FAL: 'Alternatíva k Replicate — rovnaké možnosti (Modul B aj Modul C), iný poskytovateľ AI modelov. Kľúč získate na fal.ai/dashboard/keys.',
  GEMINI:
    'Používa sa len pre Modul B (vyčistenie a zjednotenie fotky súčasného stavu) — nepodporuje Modul C (návrh zo SketchUp náčrtu). Kľúč získate na aistudio.google.com/apikey.',
};

function statusColor(summary: ProviderCredentialSummary, isBusy: boolean): DotColor {
  if (isBusy) return 'orange';
  if (!summary.hasKey) return 'red';
  if (summary.lastStatus === 'OK') return 'green';
  if (summary.lastStatus === 'FAILED') return 'red';
  return 'orange'; // key saved but never tested yet
}

export function ProviderCredentialRow({
  summary,
  onChanged,
}: {
  summary: ProviderCredentialSummary;
  onChanged: (updated: ProviderCredentialSummary) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    if (!apiKey.trim()) return;
    setIsBusy(true);
    setMessage(null);
    try {
      const updated = await saveProviderKey(summary.provider, apiKey.trim());
      setApiKey('');
      onChanged(updated);
      setMessage(updated.lastStatus === 'OK' ? 'Kľúč uložený a funguje.' : updated.lastError);
    } catch (err) {
      setMessage(err instanceof ApiRequestError ? err.message : 'Uloženie zlyhalo.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleTest() {
    setIsBusy(true);
    setMessage(null);
    try {
      const updated = await testProviderConnection(summary.provider);
      onChanged(updated);
      setMessage(updated.lastStatus === 'OK' ? 'Pripojenie funguje.' : updated.lastError);
    } catch (err) {
      setMessage(err instanceof ApiRequestError ? err.message : 'Test zlyhal.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRemove() {
    setIsBusy(true);
    setMessage(null);
    try {
      const updated = await removeProviderKey(summary.provider);
      onChanged(updated);
      setMessage('Kľúč odstránený.');
    } catch (err) {
      setMessage(err instanceof ApiRequestError ? err.message : 'Odstránenie zlyhalo.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink">{PROVIDER_LABELS[summary.provider]}</h3>
        <StatusDot color={statusColor(summary, isBusy)} />
      </div>

      {PROVIDER_DESCRIPTIONS[summary.provider] && (
        <p className="text-sm text-ink-soft">{PROVIDER_DESCRIPTIONS[summary.provider]}</p>
      )}

      {summary.hasKey && (
        <p className="text-xs text-ink-soft">
          {summary.usingEnvFallback ? 'Kľúč sa berie z .env (záloha).' : 'Kľúč je uložený.'}
          {summary.lastCheckedAt && ` Naposledy overené: ${new Date(summary.lastCheckedAt).toLocaleString('sk-SK')}.`}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={summary.hasKey ? 'Nový kľúč (nahradí uložený)' : 'Vložte API kľúč'}
          className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
        />
        <button
          type="button"
          disabled={isBusy || !apiKey.trim()}
          onClick={() => void handleSave()}
          className="rounded-md bg-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
        >
          Uložiť
        </button>
      </div>

      <div className="flex gap-3 text-xs">
        <button
          type="button"
          disabled={isBusy || !summary.hasKey}
          onClick={() => void handleTest()}
          className="uppercase tracking-wide text-brand-600 underline disabled:opacity-40"
        >
          Otestovať pripojenie
        </button>
        {!summary.usingEnvFallback && summary.hasKey && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleRemove()}
            className="uppercase tracking-wide text-red-700 underline disabled:opacity-40"
          >
            Odstrániť kľúč
          </button>
        )}
      </div>

      {message && <p className="text-xs text-ink-soft">{message}</p>}
    </div>
  );
}
