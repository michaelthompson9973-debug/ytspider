
# Admin Panel Settings - Theme Customization System

## Overview

Admin panel এ একটি নতুন **Settings** পেজ তৈরি করব যেখানে থাকবে:
- 4-5টি Pre-built Theme Color Presets (এক ক্লিকে পুরো admin panel এর look বদলে যাবে)
- Custom color picker দিয়ে নিজের মতো করে সাজানোর অপশন
- Smooth transitions এবং better UX feel
- LocalStorage এ save হবে (browser refresh এর পরেও থাকবে)

## Theme Presets Design

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🎨 Theme Settings                                                      │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Choose a Theme                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Default  │ │  Ocean   │ │  Forest  │ │  Sunset  │ │  Slate   │     │
│  │  ●───────│ │  ●───────│ │  ●───────│ │  ●───────│ │  ●───────│     │
│  │  [Blue]  │ │  [Teal]  │ │  [Green] │ │ [Orange] │ │  [Gray]  │     │
│  │   ✓      │ │          │ │          │ │          │ │          │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Custom Colors                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Primary Color      [🎨] #3B82F6                                 │   │
│  │  Sidebar Background [🎨] #F8F9FA                                 │   │
│  │  Accent Color       [🎨] #F1F5F9                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Appearance                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ☀️ Light Mode    🌙 Dark Mode    💻 System                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│       [Reset to Defaults]                      [Apply Changes]         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Color Theme Presets (5টি)

| Theme Name | Primary | Sidebar BG | Accent | Description |
|------------|---------|------------|--------|-------------|
| Default | `#222E3C` | `#F8F9FA` | `#F1F5F9` | Clean professional blue-gray |
| Ocean | `#0891B2` | `#F0FDFA` | `#CCFBF1` | Calming teal/cyan tones |
| Forest | `#16A34A` | `#F0FDF4` | `#DCFCE7` | Fresh green nature feel |
| Sunset | `#EA580C` | `#FFF7ED` | `#FFEDD5` | Warm orange energy |
| Slate | `#475569` | `#F8FAFC` | `#F1F5F9` | Neutral gray minimal |

## Implementation Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        Admin Theme System                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐  │
│  │ AdminThemeContext│───▶│ CSS Variables    │───▶│ All Admin UI    │  │
│  │                  │    │ (document.style) │    │ Components      │  │
│  └────────┬─────────┘    └──────────────────┘    └─────────────────┘  │
│           │                                                             │
│           ▼                                                             │
│  ┌──────────────────┐                                                   │
│  │ localStorage     │                                                   │
│  │ (admin-theme)    │                                                   │
│  └──────────────────┘                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## UX Improvements

1. **Smooth Transitions**
   - সব color change এ `transition-colors duration-200` যোগ হবে
   - Theme switch এ subtle fade effect

2. **Hover States Enhancement**
   - Sidebar items এ better hover feedback
   - Button hover states আরও responsive

3. **Visual Feedback**
   - Theme select এ animated checkmark
   - Color picker এ live preview
   - Save button এ success animation

4. **Consistency**
   - সব admin page এ একই color scheme
   - Cards, buttons, inputs সব consistent হবে

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/contexts/AdminThemeContext.tsx` | Create | Theme state management ও CSS variable injection |
| `src/pages/admin/Settings.tsx` | Create | Settings page with theme controls |
| `src/components/admin/settings/ThemePresetCard.tsx` | Create | Individual theme preset card |
| `src/components/admin/settings/ColorPicker.tsx` | Create | Custom color input component |
| `src/components/admin/settings/AppearanceToggle.tsx` | Create | Light/Dark/System toggle |
| `src/App.tsx` | Modify | AdminThemeProvider wrap করা |
| `src/components/admin/AdminSidebar.tsx` | Modify | Settings nav item যোগ করা |
| `src/index.css` | Modify | Admin-specific CSS variables ও transitions |

## Technical Details

### AdminThemeContext
```typescript
interface AdminTheme {
  preset: 'default' | 'ocean' | 'forest' | 'sunset' | 'slate' | 'custom';
  colors: {
    primary: string;
    sidebarBg: string;
    sidebarFg: string;
    accent: string;
    accentFg: string;
  };
  mode: 'light' | 'dark' | 'system';
}

// CSS Variables inject করবে:
// --admin-primary, --admin-sidebar-bg, --admin-accent, etc.
```

### Theme Preset Structure
```typescript
const themePresets = {
  default: {
    primary: '222.2 47.4% 11.2%',
    sidebarBg: '0 0% 98%',
    accent: '210 40% 96.1%',
  },
  ocean: {
    primary: '189 94% 43%',
    sidebarBg: '166 76% 97%',
    accent: '167 85% 89%',
  },
  // ... more presets
};
```

### LocalStorage Persistence
```typescript
const STORAGE_KEY = 'ytspider-admin-theme';

// Load on init
const stored = localStorage.getItem(STORAGE_KEY);
const initial = stored ? JSON.parse(stored) : defaultTheme;

// Save on change
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}, [theme]);
```

## Navigation Update

Sidebar এ Settings group এ নতুন item যোগ হবে:

```text
Settings
├── Allowed Domains
├── Webhooks
├── API (dropdown)
└── 🆕 Appearance  ← নতুন
```

## Smooth UX Additions

1. **Global Transitions** (index.css এ)
```css
/* Admin panel smooth transitions */
.admin-transition {
  @apply transition-colors duration-200 ease-in-out;
}

[data-sidebar] {
  @apply transition-all duration-200 ease-in-out;
}
```

2. **Hover Improvements**
```css
/* Enhanced hover states */
.sidebar-item-hover {
  @apply hover:bg-sidebar-accent/80 active:scale-[0.98];
}
```

3. **Selection Animation**
```css
/* Theme selection feedback */
.theme-card-selected {
  @apply ring-2 ring-primary ring-offset-2 
         transform scale-[1.02] 
         transition-all duration-200;
}
```

## Mobile Responsiveness

Settings page মোবাইলে:
- Theme cards 2-column grid হবে
- Color pickers full-width হবে
- Sticky save button bottom এ থাকবে

