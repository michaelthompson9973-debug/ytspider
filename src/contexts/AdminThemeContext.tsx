import React, { createContext, useContext, useEffect, useState } from 'react';

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
  setPreset: (preset: ThemePreset) => void;
  setMode: (mode: ThemeMode) => void;
  setCustomColor: (key: keyof ThemeColors, value: string) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'ytspider-admin-theme';

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

const defaultTheme: AdminTheme = {
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
  const [theme, setTheme] = useState<AdminTheme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultTheme, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse stored theme:', e);
    }
    return defaultTheme;
  });

  // Apply theme on mount and changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDOM(theme);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setPreset = (preset: ThemePreset) => {
    if (preset === 'custom') {
      setTheme((prev) => ({ ...prev, preset: 'custom' }));
    } else {
      setTheme((prev) => ({
        ...prev,
        preset,
        colors: themePresets[preset],
      }));
    }
  };

  const setMode = (mode: ThemeMode) => {
    setTheme((prev) => ({ ...prev, mode }));
  };

  const setCustomColor = (key: keyof ThemeColors, value: string) => {
    setTheme((prev) => ({
      ...prev,
      preset: 'custom',
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const resetToDefaults = () => {
    setTheme(defaultTheme);
  };

  return (
    <AdminThemeContext.Provider
      value={{ theme, setPreset, setMode, setCustomColor, resetToDefaults }}
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
