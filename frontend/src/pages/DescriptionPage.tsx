export function DescriptionPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl text-ink">Popis</h1>

      <section className="space-y-3 rounded-lg border border-line bg-card p-4 shadow-sm">
        <h2 className="font-serif text-lg uppercase tracking-[0.1em] text-ink">
          AI služby (voliteľné, bežia len keď zadáte kľúč)
        </h2>
        <p className="text-sm text-ink-soft">
          Appka nemá vlastnú AI — pri generovaní vizualizácie zavolá cez internet jednu z týchto služieb:
        </p>
        <ul className="space-y-2 text-sm text-ink-soft">
          <li>
            <strong className="text-ink">Replicate</strong> — hostuje diffúzne modely (Flux/SDXL) a ControlNet
            modely na depth-mapu a canny hrany. Používa sa pre Modul B aj Modul C.
          </li>
          <li>
            <strong className="text-ink">fal.ai</strong> — to isté ako Replicate (iný poskytovateľ, alternatíva),
            tiež Modul B aj Modul C.
          </li>
          <li>
            <strong className="text-ink">Google Gemini</strong> — jeho obrázkový model (Nano Banana /
            gemini-2.5-flash-image), len na Modul B.
          </li>
          <li>
            <strong className="text-ink">MOCK</strong> — žiadna externá služba, len appka sama si lokálne
            vygeneruje placeholder obrázok (cez knižnicu sharp, bez pripojenia na internet).
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-line bg-card p-4 shadow-sm">
        <h2 className="font-serif text-lg uppercase tracking-[0.1em] text-ink">
          Povinné (appka bez nich nefunguje)
        </h2>

        <div>
          <h3 className="font-medium text-ink">Render</h3>
          <p className="text-sm text-ink-soft">
            Hosting appky — beží tu skutočný server (Node.js proces), ktorý servíruje webové rozhranie aj API.
            Appka je tu 24/7 online (na free pláne sa po ~15 min nečinnosti "uspí" a prvé ďalšie otvorenie trvá
            dlhšie).
          </p>
        </div>

        <div>
          <h3 className="font-medium text-ink">Supabase (jeden účet, dve funkcie)</h3>
          <ul className="mt-1 space-y-2 text-sm text-ink-soft">
            <li>
              <strong className="text-ink">PostgreSQL databáza</strong> — ukladá všetky dáta: projekty, zoznam
              nahraných súborov (názvy, kategórie...), stav generovacích jobov, porovnania PRED/PO, a zašifrované
              API kľúče z /nastavenia.
            </li>
            <li>
              <strong className="text-ink">Storage</strong> — ukladá samotné súbory (fotky, vygenerované obrázky,
              exportované porovnania) ako objekty v "bucketi" (podobne ako AWS S3).
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-ink">GitHub</h3>
          <p className="text-sm text-ink-soft">
            Uchováva zdrojový kód appky. Render je s ním prepojený tak, že pri každom git push automaticky stiahne
            najnovšiu verziu a znova appku zostaví a nasadí.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-line bg-card p-4 shadow-sm">
        <h2 className="font-serif text-lg uppercase tracking-[0.1em] text-ink">
          Voliteľné (appka funguje aj bez nich — MOCK režim)
        </h2>

        <div>
          <h3 className="font-medium text-ink">Replicate</h3>
          <p className="text-sm text-ink-soft">
            Poskytuje beh AI modelov (Flux/SDXL diffúzne modely + ControlNet) cez API — appka mu pošle obrázok a
            prompt, on vráti vygenerovaný výstup. Používa sa pre Modul B aj Modul C.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-ink">fal.ai</h3>
          <p className="text-sm text-ink-soft">
            To isté ako Replicate — alternatívny poskytovateľ tej istej kategórie AI modelov, pre Modul B aj Modul
            C.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-ink">Google Gemini</h3>
          <p className="text-sm text-ink-soft">
            Googlí AI s obrázkovými schopnosťami (Nano Banana) — poskytuje len úpravu/vylepšenie fotky, používa sa
            výhradne pre Modul B.
          </p>
        </div>
      </section>
    </div>
  );
}
