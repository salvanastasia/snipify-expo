import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "app_theme";
const FONT_STORAGE_KEY = "profile_font";

export type ThemeId = "default" | "cream" | "flat";
export type FontId = "default" | "Doto";

export type ThemeColors = {
  background: string;
  text: string;
  textMuted: string;
  card: string;
  input: string;
  border: string;
  /** StatusBar style: "light" | "dark" */
  statusBar: "light" | "dark";
  /** RefreshControl / accent tint */
  tint: string;
};

const THEMES: Record<ThemeId, ThemeColors> = {
  default: {
    background: "#121212",
    text: "#fff",
    textMuted: "rgba(255,255,255,0.6)",
    card: "#282828",
    input: "#383838",
    border: "rgba(255,255,255,0.3)",
    statusBar: "light",
    tint: "#fff",
  },
  cream: {
    background: "#F2EDE7",
    text: "#3D2C2C",
    textMuted: "#5C4A3A",
    card: "#E8E2DB",
    input: "#E0D9D0",
    border: "rgba(61,44,44,0.25)",
    statusBar: "dark",
    tint: "#3D2C2C",
  },
  flat: {
    background: "#121212",
    text: "#fff",
    textMuted: "rgba(255,255,255,0.6)",
    card: "#282828",
    input: "#383838",
    border: "rgba(255,255,255,0.3)",
    statusBar: "light",
    tint: "#fff",
  },
};

/** Swatch preview color for theme picker (circle background) */
export const THEME_SWATCH_COLORS: Record<ThemeId, string> = {
  default: "#121212",
  cream: "#F2EDE7",
  flat: "#5C5C5C",
};

type ThemeContextType = {
  theme: ThemeId;
  colors: ThemeColors;
  setTheme: (id: ThemeId) => void;
  font: FontId;
  setFont: (id: FontId) => void;
  defaultFontFamily: string;
  defaultFontFamilyBold: string;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("default");
  const [font, setFontState] = useState<FontId>("default");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === "cream" || stored === "default" || stored === "flat") setThemeState(stored);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(FONT_STORAGE_KEY).then((stored) => {
      if (stored === "Doto" || stored === "default") setFontState(stored);
    });
  }, []);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => {});
  };

  const setFont = (id: FontId) => {
    setFontState(id);
    AsyncStorage.setItem(FONT_STORAGE_KEY, id).catch(() => {});
  };

  const colors = THEMES[theme];
  const defaultFontFamily = font === "Doto" ? "Doto" : "MDNichrome";
  const defaultFontFamilyBold = font === "Doto" ? "Doto" : "MDNichromeBold";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        setTheme,
        font,
        setFont,
        defaultFontFamily,
        defaultFontFamilyBold,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
