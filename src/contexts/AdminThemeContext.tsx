import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemePreset = 'default' | 'ocean' | 'forest' | 'sunset' | 'slate' | 'custom';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  sidebarBg: string;
  sidebarFg: string;
  sidebarAccent: string;
  sidebarAccentFg: string;
  sidebarPrimary: string;
  sidebarPrimaryFg: string;
  accent: string;
  accentFg: string;
}

export interface AdminTheme {
  preset: ThemePreset;
  colors: ThemeColors;
  mode: ThemeMode;
}

interface AdminThemeContextType {
  theme: AdminTheme;
  draftTheme: AdminTheme;
  hasUnsavedChanges: boolean;
  setPreset: (preset: ThemePreset) => void;
  setMode: (mode: ThemeMode) => void;
  setCustomColor: (key: keyof ThemeColors, value: string) => void;
  resetToDefaults: () => void;
  applyTheme: (theme: AdminTheme) => void;
  discardChanges: () => void;
}

// Theme presets with HSL values
export const themePresets: Record<Exclude<ThemePreset, 'custom'>, ThemeColors> = {
  default: {
    // Command Center: Deep Navy + Electric Blue
    primary: '217 91% 60%',              // Electric Blue #3B82F6
    primaryForeground: '0 0% 100%',
    sidebarBg: '222 47% 11%',            // Deep Navy #0F172A
    sidebarFg: '213 31% 81%',            // Muted light on navy
    sidebarAccent: '222 47% 16%',         // Slightly lighter navy
    sidebarAccentFg: '210 40% 98%',
    sidebarPrimary: '217 91% 60%',        // Electric Blue
    sidebarPrimaryFg: '0 0% 100%',
    accent: '214 95% 93%',                // Subtle blue tint
    accentFg: '222 47% 11%',
  },
  ocean: {
    primary: '189 94% 37%',
    primaryForeground: '0 0% 100%',
    sidebarBg: '166 76% 97%',
    sidebarFg: '189 60% 20%',
    sidebarAccent: '167 85% 89%',
    sidebarAccentFg: '189 80% 15%',
    sidebarPrimary: '189 94% 37%',
    sidebarPrimaryFg: '0 0% 100%',
    accent: '167 85% 89%',
    accentFg: '189 94% 20%',
  },
  forest: {
    primary: '142 76% 36%',
    primaryForeground: '0 0% 100%',
    sidebarBg: '138 76% 97%',
    sidebarFg: '142 60% 20%',
    sidebarAccent: '141 79% 85%',
    sidebarAccentFg: '142 80% 15%',
    sidebarPrimary: '142 76% 36%',
    sidebarPrimaryFg: '0 0% 100%',
    accent: '141 79% 85%',
    accentFg: '142 76% 20%',
  },
  sunset: {
    primary: '21 90% 48%',
    primaryForeground: '0 0% 100%',
    sidebarBg: '33 100% 96%',
    sidebarFg: '21 60% 20%',
    sidebarAccent: '33 100% 90%',
    sidebarAccentFg: '21 80% 15%',
    sidebarPrimary: '21 90% 48%',
    sidebarPrimaryFg: '0 0% 100%',
    accent: '33 100% 90%',
    accentFg: '21 90% 25%',
  },
  slate: {
    primary: '215 16% 47%',
    primaryForeground: '0 0% 100%',
    sidebarBg: '210 20% 98%',
    sidebarFg: '215 25% 27%',
    sidebarAccent: '210 40% 96.1%',
    sidebarAccentFg: '215 25% 17%',
    sidebarPrimary: '215 16% 47%',
    sidebarPrimaryFg: '0 0% 100%',
    accent: '210 40% 96.1%',
    accentFg: '215 16% 30%',
  },
};

export const defaultTheme: AdminTheme = {
  preset: 'default',
  colors: themePresets.default,
  mode: 'light',
};

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

// Base variables for light mode (matches :root in index.css)
const lightBaseVars: Record<string, string> = {
  '--background': '0 0% 100%',
  '--foreground': '222.2 84% 4.9%',
  '--card': '0 0% 100%',
  '--card-foreground': '222.2 84% 4.9%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '222.2 84% 4.9%',
  '--secondary': '210 40% 96.1%',
  '--secondary-foreground': '222.2 47.4% 11.2%',
  '--muted': '210 40% 96.1%',
  '--muted-foreground': '215.4 16.3% 46.9%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '210 40% 98%',
  '--border': '214.3 31.8% 91.4%',
  '--input': '214.3 31.8% 91.4%',
  '--ring': '222.2 84% 4.9%',
  '--sidebar-border': '220 13% 91%',
  '--sidebar-ring': '217.2 91.2% 59.8%',
};

// Base variables for dark mode (matches .dark in index.css)
const darkBaseVars: Record<string, string> = {
  '--background': '222.2 84% 4.9%',
  '--foreground': '210 40% 98%',
  '--card': '222.2 84% 4.9%',
  '--card-foreground': '210 40% 98%',
  '--popover': '222.2 84% 4.9%',
  '--popover-foreground': '210 40% 98%',
  '--secondary': '217.2 32.6% 17.5%',
  '--secondary-foreground': '210 40% 98%',
  '--muted': '217.2 32.6% 17.5%',
  '--muted-foreground': '215 20.2% 65.1%',
  '--destructive': '0 62.8% 30.6%',
  '--destructive-foreground': '210 40% 98%',
  '--border': '217.2 32.6% 17.5%',
  '--input': '217.2 32.6% 17.5%',
  '--ring': '212.7 26.8% 83.9%',
  '--sidebar-border': '240 3.7% 15.9%',
  '--sidebar-ring': '217.2 91.2% 59.8%',
};

function applyThemeToDOM(theme: AdminTheme) {
  const root = document.documentElement;
  const { colors, mode } = theme;

  // 1. Determine effective dark/light
  const isDark = mode === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : mode === 'dark';

  root.classList.toggle('dark', isDark);

  // 2. Forcefully set ALL base variables for the active mode
  const baseVars = isDark ? darkBaseVars : lightBaseVars;
  for (const [key, value] of Object.entries(baseVars)) {
    root.style.setProperty(key, value);
  }

  // 3. Set theme-specific colors (primary, accent, sidebar)
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--sidebar-background', colors.sidebarBg);
  root.style.setProperty('--sidebar-foreground', colors.sidebarFg);
  root.style.setProperty('--sidebar-accent', colors.sidebarAccent);
  root.style.setProperty('--sidebar-accent-foreground', colors.sidebarAccentFg);
  root.style.setProperty('--sidebar-primary', colors.sidebarPrimary);
  root.style.setProperty('--sidebar-primary-foreground', colors.sidebarPrimaryFg);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentFg);
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  // Saved theme (from database)
  const [theme, setTheme] = useState<AdminTheme>(defaultTheme);
  // Draft theme (unsaved changes)
  const [draftTheme, setDraftTheme] = useState<AdminTheme>(defaultTheme);

  const hasUnsavedChanges = JSON.stringify(theme) !== JSON.stringify(draftTheme);

  // Apply draft theme to DOM for live preview
  useEffect(() => {
    applyThemeToDOM(draftTheme);
  }, [draftTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (draftTheme.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDOM(draftTheme);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [draftTheme]);

  const setPreset = useCallback((preset: ThemePreset) => {
    if (preset === 'custom') {
      setDraftTheme((prev) => ({ ...prev, preset: 'custom' }));
    } else {
      setDraftTheme((prev) => ({
        ...prev,
        preset,
        colors: themePresets[preset],
      }));
    }
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    setDraftTheme((prev) => ({ ...prev, mode }));
  }, []);

  const setCustomColor = useCallback((key: keyof ThemeColors, value: string) => {
    setDraftTheme((prev) => ({
      ...prev,
      preset: 'custom',
      colors: { ...prev.colors, [key]: value },
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setDraftTheme(defaultTheme);
  }, []);

  const applyTheme = useCallback((newTheme: AdminTheme) => {
    setTheme(newTheme);
    setDraftTheme(newTheme);
    applyThemeToDOM(newTheme);
  }, []);

  const discardChanges = useCallback(() => {
    setDraftTheme(theme);
  }, [theme]);

  return (
    <AdminThemeContext.Provider
      value={{
        theme,
        draftTheme,
        hasUnsavedChanges,
        setPreset,
        setMode,
        setCustomColor,
        resetToDefaults,
        applyTheme,
        discardChanges,
      }}
    >
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used within AdminThemeProvider');
  }
  return context;
}
