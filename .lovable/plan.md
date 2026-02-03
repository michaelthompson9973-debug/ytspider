
# Theme-Aware Table Headers + Language Toggle System

## Overview

এই প্ল্যান দুইটি ফিচার যুক্ত করবে:
1. **Theme-Aware Headers**: Table/Card headers গুলো থিম অনুযায়ী রঙ পরিবর্তন করবে
2. **Language Toggle**: বাংলা ↔ ইংলিশ ভাষা সুইচ করার অপশন

---

## Part 1: Theme-Aware Table Headers

### বর্তমান সমস্যা
- Table headers এ হার্ডকোডেড `bg-muted/50` ব্যবহার হচ্ছে
- Theme পরিবর্তন করলে headers একই রঙে থাকে

### সমাধান
নতুন CSS variable `--table-header` যোগ করব যা theme এর সাথে বদলাবে:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Theme        │  Table Header BG    │  Header Text            │
├───────────────┼─────────────────────┼─────────────────────────┤
│  Default      │  Soft gray          │  Dark gray              │
│  Ocean        │  Light teal tint    │  Teal dark              │
│  Forest       │  Light green tint   │  Green dark             │
│  Sunset       │  Light orange tint  │  Orange dark            │
│  Slate        │  Soft neutral       │  Slate dark             │
└─────────────────────────────────────────────────────────────────┘
```

### প্রভাবিত Files

| File | পরিবর্তন |
|------|----------|
| `AdminThemeContext.tsx` | নতুন `tableHeader` ও `tableHeaderFg` color যোগ |
| `index.css` | `--table-header` CSS variable যোগ |
| `Products.tsx` | `bg-muted/50` → `bg-[hsl(var(--accent))]` |
| `OrderTable.tsx` | `bg-muted/50` → `bg-[hsl(var(--accent))]` |
| `table.tsx` | TableHeader component এ default class update |

---

## Part 2: Language Toggle System

### ডিজাইন

```text
┌─────────────────────────────────────────────────────────────────┐
│  Settings > Appearance                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 Language / ভাষা                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │   [  বাংলা  ]  ←→  [  English  ]                       │    │
│  │         ▲ Toggle Switch                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  নোট: শুধুমাত্র Admin Panel এ প্রযোজ্য                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Translation System

নতুন `LanguageContext` তৈরি করব যেখানে সব admin panel এর text translations থাকবে:

```text
src/
├── contexts/
│   └── LanguageContext.tsx    ← নতুন
├── locales/
│   ├── bn.ts                  ← বাংলা translations
│   └── en.ts                  ← English translations
```

### Sample Translations Structure

```typescript
// locales/bn.ts
export const bn = {
  common: {
    save: 'সেভ করুন',
    cancel: 'বাতিল',
    delete: 'ডিলিট',
    edit: 'এডিট',
    loading: 'লোড হচ্ছে...',
    noData: 'কোনো ডেটা নেই',
  },
  sidebar: {
    dashboard: 'ড্যাশবোর্ড',
    products: 'প্রোডাক্ট',
    orders: 'অর্ডার',
    media: 'মিডিয়া',
    settings: 'সেটিংস',
    appearance: 'অ্যাপেয়ারেন্স',
  },
  products: {
    title: 'প্রোডাক্ট',
    addProduct: 'প্রোডাক্ট যোগ করুন',
    name: 'নাম',
    price: 'মূল্য',
    status: 'স্ট্যাটাস',
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',
  },
  orders: {
    title: 'অর্ডার',
    customer: 'কাস্টমার',
    total: 'মোট',
    status: 'স্ট্যাটাস',
  },
  settings: {
    title: 'সেটিংস',
    appearance: 'অ্যাপেয়ারেন্স',
    chooseTheme: 'থিম বেছে নিন',
    customColors: 'কাস্টম কালার',
    language: 'ভাষা',
    resetDefaults: 'ডিফল্টে ফেরান',
  },
};

// locales/en.ts
export const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    noData: 'No data',
  },
  sidebar: {
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    media: 'Media',
    settings: 'Settings',
    appearance: 'Appearance',
  },
  // ... same structure
};
```

### Language Hook Usage

```typescript
// যেকোনো component এ ব্যবহার:
const { t, language, setLanguage } = useLanguage();

// Use translations
<h1>{t('products.title')}</h1>
<Button>{t('common.save')}</Button>

// Toggle language
<LanguageToggle value={language} onChange={setLanguage} />
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/contexts/LanguageContext.tsx` | Create | Language state ও t() function |
| `src/locales/bn.ts` | Create | বাংলা translations |
| `src/locales/en.ts` | Create | English translations |
| `src/components/admin/settings/LanguageToggle.tsx` | Create | Language switch UI |
| `src/contexts/AdminThemeContext.tsx` | Modify | Table header colors যোগ |
| `src/pages/admin/Settings.tsx` | Modify | Language toggle section যোগ |
| `src/App.tsx` | Modify | LanguageProvider wrap |
| `src/components/admin/AdminSidebar.tsx` | Modify | Translation keys ব্যবহার |
| `src/pages/admin/Products.tsx` | Modify | Theme-aware headers + translations |
| `src/components/admin/orders/OrderTable.tsx` | Modify | Theme-aware headers + translations |
| `src/index.css` | Modify | Table header CSS variables |

---

## UX Flow

```text
1. User opens Settings > Appearance
           │
           ▼
2. Sees Language section with toggle
           │
           ▼
3. Clicks "English" 
           │
           ▼
4. Entire admin panel instantly switches to English
   - Sidebar menus
   - Page titles
   - Table headers
   - Button labels
   - Toast messages
           │
           ▼
5. Preference saved in localStorage
   (persists across sessions)
```

---

## LocalStorage Persistence

```typescript
const LANG_STORAGE_KEY = 'ytspider-admin-language';

// Default: 'bn' (Bengali)
// Options: 'bn' | 'en'
```

---

## Technical Notes

### Theme-Aware Classes
বর্তমান `bg-muted/50` এর বদলে ব্যবহার করব:
```css
.table-header-themed {
  background-color: hsl(var(--accent) / 0.5);
  color: hsl(var(--accent-foreground));
}
```

### Admin-Only Scope
এই সিস্টেম শুধুমাত্র admin panel এ কাজ করবে। Landing pages ও public pages এর ভাষা আলাদা থাকবে।

### Gradual Migration
প্রথমে core pages (Products, Orders, Settings) এ translation যোগ হবে। পরবর্তীতে বাকি pages এ যোগ করা যাবে।
