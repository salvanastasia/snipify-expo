/**
 * Extracts dominant colors from album art URL for snippet card backgrounds.
 * Uses react-native-image-colors when available (development build); in Expo Go returns null.
 */
const DEFAULT_COLOR = "#8B8E98";
const DEFAULT_DARK = "#6B6E78";

export type ColorPair = `${string}|${string}`;

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
