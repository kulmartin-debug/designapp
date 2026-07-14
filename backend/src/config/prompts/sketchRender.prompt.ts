/**
 * MODUL C — fotorealistický render z SketchUp náčrtu.
 *
 * Cieľ: zachovať PRESNÚ geometriu náčrtu (steny, okná, dvere, rozmiestnenie
 * nábytku) cez ControlNet depth+canny podmienenie, a aplikovať iba
 * {{styleDescription}} zadané používateľom (materiály, textúry, osvetlenie).
 * ControlNet conditioning scale by mal byť nastavený vysoko (viď adaptér),
 * aby model "nekreslil vlastnú" izbu na základe promptu.
 */
export function buildSketchRenderPrompt(styleDescription: string): string {
  return `
Photorealistic interior rendering, generated strictly from the provided sketch
geometry (walls, windows, doors, furniture layout must match exactly).
Apply the following style: ${styleDescription}.
High quality architectural visualization, realistic materials, realistic
lighting consistent with the requested style. Do not alter the room shape,
window/door positions, or furniture placement from the sketch.
`.trim();
}

export const SKETCH_RENDER_NEGATIVE_PROMPT = `
different room shape, moved walls, moved windows, moved doors, extra rooms,
cartoon, sketch lines visible, blurry, low quality, warped perspective
`.trim();

// How strongly the diffusion model must respect the depth/canny control images
// vs. the text prompt. Kept high so geometry from the sketch wins over creative drift.
export const SKETCH_RENDER_CONTROLNET_CONDITIONING_SCALE = 0.85;
