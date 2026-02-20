/**
 * Extracts dominant colors from album art URL for snippet card backgrounds.
 * Uses react-native-image-colors when available (development build); in Expo Go returns null.
 */
const DEFAULT_COLOR = "#8B8E98";
const DEFAULT_DARK = "#6B6E78";

export type ColorPair = `${string}|${string}`;

export async function getColorsFromImageUrl(imageUrl: string | null): Promise<ColorPair | null> {
  if (!imageUrl?.startsWith("http")) return null;
  try {
    const { getColors } = require("react-native-image-colors");
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
  } catch {
    return null;
  }
}
