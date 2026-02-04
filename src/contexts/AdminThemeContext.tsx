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
    primary: '222.2 47.4% 11.2%',
    primaryForeground: '210 40% 98%',
    sidebarBg: '0 0% 98%',
    sidebarFg: '240 5.3% 26.1%',
    sidebarAccent: '240 4.8% 95.9%',
    sidebarAccentFg: '240 5.9% 10%',
    sidebarPrimary: '240 5.9% 10%',
    sidebarPrimaryFg: '0 0% 98%',
    accent: '210 40% 96.1%',
    accentFg: '222.2 47.4% 11.2%',
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

function applyThemeToDOM(theme: AdminTheme) {
  const root = document.documentElement;
  const { colors, mode } = theme;

  // Apply mode
  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', mode === 'dark');
  }

  // Apply colors as CSS variables
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
