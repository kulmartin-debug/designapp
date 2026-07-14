import { useEffect, useState } from 'react';
import type { ProviderCredentialSummary } from '../types/api';
import { listProviderCredentials } from '../api/settings';
import { ProviderCredentialRow } from '../components/settings/ProviderCredentialRow';

export function SettingsPage() {
  const [summaries, setSummaries] = useState<ProviderCredentialSummary[] | null>(null);

  useEffect(() => {
    void listProviderCredentials().then(setSummaries);
  }, []);

  function handleChanged(updated: ProviderCredentialSummary) {
    setSummaries((prev) => prev?.map((s) => (s.provider === updated.provider ? updated : s)) ?? prev);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">Nastavenia — API kľúče</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Bez kľúča appka pre daný modul automaticky použije MOCK režim (placeholder obrázok, cena $0). Kľúč sa
          overí hneď po uložení.
        </p>
      </div>

      {summaries === null && <p className="text-sm text-ink-soft">Načítavam...</p>}

      <div className="space-y-4">
        {summaries?.map((summary) => (
          <ProviderCredentialRow key={summary.provider} summary={summary} onChanged={handleChanged} />
        ))}
      </div>
    </div>
  );
}
