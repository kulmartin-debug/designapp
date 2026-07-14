// Slovak-facing copy. API responses carry an English `errorCode`; this map
// decouples the wire contract from the displayed text.
export const errorMessages: Record<string, string> = {
  ERR_TIMEOUT: 'Vypršal časový limit pri komunikácii s AI providerom. Skúste to znova.',
  ERR_RATE_LIMITED: 'Provider momentálne odmieta ďalšie požiadavky (rate limit). Skúste to o chvíľu.',
  ERR_INVALID_INPUT: 'Zadané údaje nie sú v poriadku.',
  ERR_PROVIDER_ERROR: 'AI provider vrátil chybu pri generovaní.',
  ERR_UNSUPPORTED_PROVIDER_FOR_MODULE: 'Tento provider nepodporuje zvolený typ generovania.',
  ERR_FILE_TOO_LARGE: 'Súbor je príliš veľký (max. 15 MB).',
  ERR_INVALID_MIME_TYPE: 'Nepodporovaný typ súboru pre túto kategóriu.',
  ERR_NOT_FOUND: 'Záznam sa nenašiel.',
  ERR_CONFLICT: 'Túto akciu nie je možné vykonať kvôli existujúcim väzbám.',
  ERR_INTERNAL: 'Nastala neočakávaná chyba na serveri.',
};

export function translateError(code?: string | null, fallback = 'Nastala neočakávaná chyba.'): string {
  if (!code) return fallback;
  return errorMessages[code] ?? fallback;
}

export const sk = {
  appName: 'DESIGNapp',
  appTagline: 'by Lucie Džama',
  nav: {
    projects: 'Projekty',
  },
  projectList: {
    title: 'Projekty',
    newProject: 'Nový projekt',
    namePlaceholder: 'Názov projektu',
    notePlaceholder: 'Poznámka (nepovinné)',
    create: 'Vytvoriť',
    empty: 'Zatiaľ nemáte žiadne projekty.',
    totalCost: 'Odhadované náklady',
  },
  assetCategories: {
    FOTO_SUCASNY_STAV: 'Foto súčasný stav',
    PODORYS: 'Pôdorys',
    NAVRH_SKETCHUP: 'Návrh zo SketchUp',
    DERIVED_DEPTH_MAP: 'Hĺbková mapa',
    DERIVED_CANNY_EDGE: 'Hrany (canny)',
    GENERATED_OUTPUT: 'Vygenerovaný výstup',
    EXPORT_COMPARISON: 'Export porovnania',
  },
  upload: {
    title: 'Nahrať súbory',
    dropHint: 'Presuňte súbory sem alebo kliknite pre výber',
    maxSize: 'Max. 15 MB na súbor',
    uploading: 'Nahrávam...',
    single: 'Táto kategória povoľuje len 1 súbor — nový nahratý súbor nahradí predchádzajúci.',
  },
  common: {
    delete: 'Zmazať',
    cancel: 'Zrušiť',
    save: 'Uložiť',
    back: 'Späť na projekty',
    loading: 'Načítavam...',
  },
};
