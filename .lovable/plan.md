

# Appearance Switching ফিক্স — Forceful DOM Application

## সমস্যা কেন হচ্ছে

`applyThemeToDOM()` ফাংশনটি `document.documentElement.style.setProperty()` দিয়ে CSS variables সেট করে। এই inline styles-এর CSS specificity সবচেয়ে বেশি — তাই `.dark` class-এর variables (background, foreground, card, border ইত্যাদি) কখনোই কাজ করে না।

```text
Specificity Chain:
  :root { --primary: light-value }     ← CSS file (low)
  .dark { --primary: dark-value }      ← CSS file (medium) 
  style="--primary: theme-value"       ← Inline (HIGHEST - always wins!)
```

ফলে Dark mode toggle করলেও UI light-ই থাকে কারণ inline styles override করে দেয়।

## সমাধান

`applyThemeToDOM()` ফাংশনকে সম্পূর্ণভাবে refactor করা হবে যাতে:

1. **Dark mode-এ সব প্রয়োজনীয় variables সেট হয়** — শুধু primary/accent নয়, background, foreground, card, muted, border, input, ring সবকিছু
2. **Light mode-এও সব variables explicitly সেট হয়** — CSS fallback-এর উপর নির্ভর না করে
3. **Mode switch-এ পুরো variable set forcefully re-apply হয়**

### পরিবর্তন:

| ফাইল | কী হবে |
|------|--------|
| `src/contexts/AdminThemeContext.tsx` | `applyThemeToDOM()` refactor — dark/light উভয় mode-এ সব CSS variables (background, foreground, card, muted, border, destructive, input, ring সহ) forcefully সেট করবে |

### টেকনিক্যাল ডিটেইল:

**`ThemeColors` interface-এ নতুন optional dark mode colors যোগ হবে না** — বরং `applyThemeToDOM()` ফাংশনে hardcoded dark-mode base variables থাকবে যেগুলো `.dark` class toggle-এর সাথে সাথে apply হবে:

```text
applyThemeToDOM(theme):
  1. Toggle .dark class (existing)
  2. Set theme-specific colors (primary, sidebar, accent) — existing
  3. NEW: If dark mode → set ALL dark base vars (background, foreground, card, muted, border, etc.)
  4. NEW: If light mode → remove overrides OR set light base vars explicitly
```

এতে mode switch হলে সব variable immediately ও forcefully update হবে — কোনো CSS specificity conflict থাকবে না।

