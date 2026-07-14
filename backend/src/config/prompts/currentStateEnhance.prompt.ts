/**
 * MODUL B — vylepšenie fotky súčasného stavu.
 *
 * Cieľ: zjednotiť osvetlenie, odstrániť šum/neporiadok, ale ZACHOVAŤ geometriu
 * miestnosti a existujúce zariadenie (nízka miera kreativity / vysoká vernosť
 * vstupu). Toto NIE JE redesign - len "upratanie a fotorealistické doladenie".
 *
 * Ladiaci tip: ak výstup mení rozloženie miestnosti alebo nábytok, znížte
 * CURRENT_STATE_ENHANCE_STRENGTH (denoise strength) namiesto úpravy promptu -
 * pri image-to-image modeloch je strength väčšinou účinnejší páka na
 * "vernosť vstupu" ako textový prompt samotný.
 */
export const CURRENT_STATE_ENHANCE_PROMPT = `
Photorealistic real-estate interior photo, same room, same furniture layout,
same camera angle and perspective. Unify and soften the lighting, remove
visual noise/graininess, remove clutter and small mess from visible surfaces,
correct white balance. Keep all structural elements unchanged: walls, windows,
doors, ceiling, floor, and existing furniture placement. Natural, believable
materials and shadows. No new objects, no layout changes, no style change.
`.trim();

export const CURRENT_STATE_ENHANCE_NEGATIVE_PROMPT = `
extra furniture, moved furniture, different room layout, different windows,
cartoon, illustration, oversaturated, warped geometry, blurry, low quality
`.trim();

// Denoise/creativity strength for image-to-image (0 = return input unchanged, 1 = ignore input).
// Kept low on purpose: this module cleans up a photo, it does not redesign it.
export const CURRENT_STATE_ENHANCE_STRENGTH = 0.25;
