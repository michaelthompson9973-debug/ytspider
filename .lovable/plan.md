
# Landing Page CSS ও Section Rendering সমস্যা সমাধান

## সমস্যা সনাক্তকরণ

### সমস্যা ১: Local Fonts লোড হচ্ছে না
**কারণ:** `LandingPage.tsx` এ `generateThemeCSS()` ফাংশন call করার সময় `baseUrl` argument পাস করা হচ্ছে না। এর ফলে font `@font-face` এর URLs relative path হয়ে যাচ্ছে এবং fonts সঠিকভাবে load হচ্ছে না।

```typescript
// বর্তমান কোড (Line 299)
const themeStyles = generateThemeCSS(themeConfig);

// সমাধান
const themeStyles = generateThemeCSS(themeConfig, window.location.origin);
```

### সমস্যা ২: Tailwind CSS Classes কাজ করছে না
**কারণ:** Live landing page এ sections যেগুলোতে Tailwind utility classes আছে (`py-12`, `px-4`, `bg-gradient-to-r`, `text-white`, etc.) সেগুলো render হচ্ছে না। Admin preview তে iframe এ Tailwind CDN include আছে কিন্তু live page এ এটি নেই।

**সমাধান:** Landing page এ dynamically Tailwind CDN inject করতে হবে।

### সেভ বাটন সম্পর্কে
**খবর:** SectionEditor.tsx এ Save বাটন মিসিং নয়। এটি দুই জায়গায় আছে:
- Header এ (Line 116-124) - সবসময় দেখায়
- Mobile sticky button (Line 265-278) - শুধু পরিবর্তন করলে দেখায়

---

## সমাধান পরিকল্পনা

### ধাপ ১: LandingPage.tsx এ baseUrl যোগ
```typescript
// Line 299 পরিবর্তন করতে হবে
const themeStyles = generateThemeCSS(themeConfig, window.location.origin);
```

### ধাপ ২: Tailwind CDN Inject করা
Landing page এ একটি useEffect যোগ করতে হবে যা Tailwind CDN script inject করবে:

```typescript
// Inject Tailwind CDN for landing page content
useEffect(() => {
  const scriptId = 'tailwind-cdn';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(script);
  }
  
  return () => {
    script?.remove();
  };
}, []);
```

---

## ফাইল পরিবর্তন সারাংশ

| ফাইল | পরিবর্তন |
|------|---------|
| `src/pages/LandingPage.tsx` | `generateThemeCSS` এ `baseUrl` যোগ + Tailwind CDN inject |

## প্রত্যাশিত ফলাফল
- ✅ Local fonts (Hind Siliguri, Anek Bangla, Inter) সঠিকভাবে load হবে
- ✅ Tailwind CSS classes (py-12, bg-gradient-to-r, etc.) render হবে
- ✅ Sections সঠিক styling সহ দেখাবে
- ✅ CSS এবং theme ঠিকমতো apply হবে
