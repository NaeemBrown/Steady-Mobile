/**
 * theme.js — React Native theme system
 *
 * Same color tokens as the web app, adapted for StyleSheet usage.
 */

import { createContext, useContext, useState, useCallback } from "react";

export const themes = {
  midnight: {
    id: "midnight", name: "Midnight", emoji: "🌙",
    bg: "#0B0E14", bgSoft: "#111520", surface: "#161B27", surfaceHover: "#1C2333",
    border: "#1E2535", borderLight: "#2A3347",
    text: "#E8ECF4", textSecondary: "#8B95A8", textMuted: "#5A6478",
    accent: "#6C5CE7", accentSoft: "rgba(108,92,231,0.12)", accentGlow: "rgba(108,92,231,0.25)",
    success: "#2ED47A", warning: "#FFB020", danger: "#F45B69", info: "#4DABF7",
    google: "#4285F4", outlook: "#0078D4", work: "#6C5CE7", personal: "#2ED47A",
    gradient: ["#6C5CE7", "#a855f7"],
    tabBar: "#0B0E14", tabBarBorder: "#1E2535",
    statusBar: "light",
  },
  cloud: {
    id: "cloud", name: "Cloud", emoji: "☁️",
    bg: "#F5F0FF", bgSoft: "rgba(245,240,255,0.85)", surface: "rgba(255,255,255,0.92)", surfaceHover: "rgba(255,255,255,0.96)",
    border: "rgba(140,100,200,0.28)", borderLight: "rgba(200,170,240,0.16)",
    text: "#1e1030", textSecondary: "#4a3566", textMuted: "#7a6090",
    accent: "#7c3aed", accentSoft: "rgba(124,58,237,0.10)", accentGlow: "rgba(124,58,237,0.25)",
    success: "#0d9488", warning: "#d97706", danger: "#e11d48", info: "#2563eb",
    google: "#2563eb", outlook: "#7c3aed", work: "#7c3aed", personal: "#0d9488",
    gradient: ["#7c3aed", "#a78bfa"],
    tabBar: "#F5F0FF", tabBarBorder: "rgba(140,100,200,0.20)",
    statusBar: "dark",
  },
  ocean: {
    id: "ocean", name: "Ocean", emoji: "🌊",
    bg: "#0A1628", bgSoft: "#0E1E36", surface: "#122441", surfaceHover: "#183054",
    border: "#1B3A5C", borderLight: "#245080",
    text: "#E0F0FF", textSecondary: "#7EB3DC", textMuted: "#4A7CA8",
    accent: "#00B4D8", accentSoft: "rgba(0,180,216,0.12)", accentGlow: "rgba(0,180,216,0.25)",
    success: "#00E5A0", warning: "#FFC44D", danger: "#FF6B8A", info: "#48CAE4",
    google: "#48CAE4", outlook: "#0096C7", work: "#00B4D8", personal: "#00E5A0",
    gradient: ["#0077B6", "#00B4D8"],
    tabBar: "#0A1628", tabBarBorder: "#1B3A5C",
    statusBar: "light",
  },
  sunset: {
    id: "sunset", name: "Sunset", emoji: "🌅",
    bg: "#1A0E1E", bgSoft: "#231228", surface: "#2D1833", surfaceHover: "#3A2040",
    border: "#44264D", borderLight: "#5C3366",
    text: "#F8E8F0", textSecondary: "#C49AB4", textMuted: "#8A6080",
    accent: "#FF6B6B", accentSoft: "rgba(255,107,107,0.12)", accentGlow: "rgba(255,107,107,0.25)",
    success: "#7BF1A8", warning: "#FFD166", danger: "#E83562", info: "#C77DFF",
    google: "#FF9F43", outlook: "#C77DFF", work: "#FF9F43", personal: "#7BF1A8",
    gradient: ["#FF6B6B", "#FF9F43"],
    tabBar: "#1A0E1E", tabBarBorder: "#44264D",
    statusBar: "light",
  },
  forest: {
    id: "forest", name: "Forest", emoji: "🌲",
    bg: "#0C1410", bgSoft: "#111D16", surface: "#162419", surfaceHover: "#1E3022",
    border: "#243A28", borderLight: "#305038",
    text: "#E0F0E4", textSecondary: "#88B494", textMuted: "#567862",
    accent: "#4ADE80", accentSoft: "rgba(74,222,128,0.12)", accentGlow: "rgba(74,222,128,0.25)",
    success: "#34D399", warning: "#FBBF24", danger: "#FB7185", info: "#38BDF8",
    google: "#38BDF8", outlook: "#818CF8", work: "#4ADE80", personal: "#A3E635",
    gradient: ["#166534", "#22C55E"],
    tabBar: "#0C1410", tabBarBorder: "#243A28",
    statusBar: "light",
  },
  rose: {
    id: "rose", name: "Rosé", emoji: "🌸",
    bg: "#FFF5F7", bgSoft: "#FFF0F3", surface: "#FFFFFF", surfaceHover: "#FFF5F7",
    border: "rgba(225,29,116,0.15)", borderLight: "rgba(225,29,116,0.08)",
    text: "#2D0A1B", textSecondary: "#8B3A5E", textMuted: "#B06080",
    accent: "#E11D74", accentSoft: "rgba(225,29,116,0.10)", accentGlow: "rgba(225,29,116,0.25)",
    success: "#059669", warning: "#D97706", danger: "#DC2626", info: "#7C3AED",
    google: "#7C3AED", outlook: "#E11D74", work: "#E11D74", personal: "#059669",
    gradient: ["#E11D74", "#F472B6"],
    tabBar: "#FFF5F7", tabBarBorder: "rgba(225,29,116,0.12)",
    statusBar: "dark",
  },
  nord: {
    id: "nord", name: "Nord", emoji: "❄️",
    bg: "#2E3440", bgSoft: "#3B4252", surface: "#434C5E", surfaceHover: "#4C566A",
    border: "#4C566A", borderLight: "#5A657A",
    text: "#ECEFF4", textSecondary: "#D8DEE9", textMuted: "#81A1C1",
    accent: "#88C0D0", accentSoft: "rgba(136,192,208,0.12)", accentGlow: "rgba(136,192,208,0.25)",
    success: "#A3BE8C", warning: "#EBCB8B", danger: "#BF616A", info: "#81A1C1",
    google: "#81A1C1", outlook: "#5E81AC", work: "#88C0D0", personal: "#A3BE8C",
    gradient: ["#5E81AC", "#88C0D0"],
    tabBar: "#2E3440", tabBarBorder: "#4C566A",
    statusBar: "light",
  },
  ember: {
    id: "ember", name: "Ember", emoji: "🔥",
    bg: "#1C1008", bgSoft: "#261810", surface: "#302014", surfaceHover: "#3A2818",
    border: "#4A3420", borderLight: "#5C4430",
    text: "#F8ECD8", textSecondary: "#C4A878", textMuted: "#8A7050",
    accent: "#F97316", accentSoft: "rgba(249,115,22,0.12)", accentGlow: "rgba(249,115,22,0.25)",
    success: "#84CC16", warning: "#EAB308", danger: "#EF4444", info: "#F59E0B",
    google: "#F59E0B", outlook: "#F97316", work: "#F97316", personal: "#84CC16",
    gradient: ["#EA580C", "#F97316"],
    tabBar: "#1C1008", tabBarBorder: "#4A3420",
    statusBar: "light",
  },
};

export const themeOrder = ["midnight", "cloud", "ocean", "sunset", "forest", "rose", "nord", "ember"];

// ─── Theme Context ────────────────────────────────────────────────────────────

const ThemeContext = createContext(null);

export function ThemeProvider({ children, initialTheme = "midnight" }) {
  const [themeId, setThemeId] = useState(initialTheme);
  const t = themes[themeId] || themes.midnight;

  const changeTheme = useCallback((id) => {
    if (themes[id]) setThemeId(id);
  }, []);

  return (
    <ThemeContext.Provider value={{ t, themeId, changeTheme, themes, themeOrder }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() must be used inside <ThemeProvider>");
  return ctx;
}
