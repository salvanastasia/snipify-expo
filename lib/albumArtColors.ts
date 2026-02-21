/**
 * Extracts dominant colors from album art URL for snippet card backgrounds.
 * Uses react-native-image-colors when available (development build); in Expo Go returns null.
 */
const DEFAULT_COLOR = "#8B8E98";
const DEFAULT_DARK = "#6B6E78";

export type ColorPair = `${string}|${string}`;

/**
 * Darkens a hex color by blending with black. Use for accessible text on light (flat) backgrounds.
 * @param hex - e.g. "#CF9CD1"
 * @param amount - 0 = no change, 1 = black. Use ~0.5–0.65 for readable text on light bg.
 */
export function darkenHexForContrast(hex: string, amount: number = 0.55): string {
  const match = hex.replace(/^#/, "").match(/(..)(..)(..)/);
  if (!match) return "#1a1a1a";
  const r = Math.round(parseInt(match[1], 16) * (1 - amount));
  const g = Math.round(parseInt(match[2], 16) * (1 - amount));
  const b = Math.round(parseInt(match[3], 16) * (1 - amount));
  return `#${[r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Lightens a hex color by blending with white. Use for flat snippet card backgrounds.
 * @param hex - e.g. "#A67C3B"
 * @param amount - 0 = no change, 1 = white. Use ~0.3–0.5 for a soft pastel background.
 */
export function lightenHexByBlendingWithWhite(hex: string, amount: number = 0.4): string {
  const match = hex.replace(/^#/, "").match(/(..)(..)(..)/);
  if (!match) return "#f5f5f5";
  const r = Math.round(parseInt(match[1], 16) + (255 - parseInt(match[1], 16)) * amount);
  const g = Math.round(parseInt(match[2], 16) + (255 - parseInt(match[2], 16)) * amount);
  const b = Math.round(parseInt(match[3], 16) + (255 - parseInt(match[3], 16)) * amount);
  return `#${[r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("")}`;
}

// Lazy load the module to avoid errors if it's not available
let imageColorsModule: any = null;
let moduleChecked = false;

function getImageColorsModule() {
  if (moduleChecked) return imageColorsModule;
  moduleChecked = true;
  
  try {
    // Safely require the module - this will throw if native module isn't linked
    imageColorsModule = require("react-native-image-colors");
  } catch (e: any) {
    // Module not available (e.g., Expo Go) - silently fail
    // The error message typically contains "Cannot find native module"
    imageColorsModule = null;
  }
  
  return imageColorsModule;
}

export async function getColorsFromImageUrl(imageUrl: string | null): Promise<ColorPair | null> {
  if (!imageUrl?.startsWith("http")) return null;
  
  const module = getImageColorsModule();
  if (!module) return null;
  
  try {
    const { getColors } = module;
    const result = await getColors(imageUrl, {
      fallback: DEFAULT_COLOR,
      cache: true,
      key: imageUrl.slice(0, 200),
    });
    if (!result) return null;
    const r = result as Record<string, string>;
    // Android / Web: dominant, darkMuted, darkVibrant
    const main =
      r.dominant ?? r.vibrant ?? r.primary ?? r.background ?? r.muted ?? DEFAULT_COLOR;
    const dark =
      r.darkMuted ?? r.darkVibrant ?? r.secondary ?? r.detail ?? main ?? DEFAULT_DARK;
    return `${main}|${dark}`;
  } catch (e) {
    // Failed to extract colors - return null gracefully
    return null;
  }
}
