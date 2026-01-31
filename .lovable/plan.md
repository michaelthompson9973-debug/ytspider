
# Thank You পেজে ল্যান্ডিং পেজ থিম ইন্টিগ্রেশন প্ল্যান

## বর্তমান সমস্যা

Thank You পেজ (`/thank-you`) বর্তমানে হার্ডকোডেড স্টাইল ব্যবহার করে। যখন কোনো ল্যান্ডিং পেজে থিম (Primary Color, Fonts, Button Style ইত্যাদি) সেট করা হয়, সেই থিম Thank You পেজে প্রতিফলিত হয় না। 

## সমাধান ধারণা

অর্ডারে `landing_page_id` সেভ আছে। এই ID ব্যবহার করে আমরা সেই ল্যান্ডিং পেজের থিম fetch করব এবং Thank You পেজে apply করব।

```text
Order (landing_page_id) ─────> Theme (config) ─────> Thank You Page
                                   │
                                   ├── primaryColor
                                   ├── headingFont
                                   ├── bodyFont
                                   ├── buttonFont
                                   └── digitFont
```

## পরিবর্তনের তালিকা

### ফাইল: `src/pages/ThankYou.tsx`

| পরিবর্তন | বিবরণ |
|----------|-------|
| Theme Query যোগ | `landing_page_id` দিয়ে `landing_page_theme` টেবিল থেকে থিম fetch করব |
| Font Loading | Google Fonts dynamically inject করব |
| CSS Variables | `generateThemeCSS` ব্যবহার করে থিম স্টাইল inject করব |
| Skeleton Loader | থিম লোড না হওয়া পর্যন্ত skeleton দেখাব |

---

## টেকনিক্যাল ইমপ্লিমেন্টেশন

### ১. Theme Fetch করা (Order এর `landing_page_id` থেকে)

```typescript
// Fetch theme for the landing page
const { data: themeData } = useQuery({
  queryKey: ['thank-you-theme', order?.landing_page_id],
  queryFn: async () => {
    if (!order?.landing_page_id) return null;
    const { data, error } = await supabase
      .from('landing_page_theme')
      .select('*')
      .eq('landing_page_id', order.landing_page_id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  enabled: !!order?.landing_page_id,
});

const themeConfig = (themeData?.config as ThemeConfig) ?? defaultThemeConfig;
```

### ২. Font Loading (useEffect)

```typescript
// Inject Google Fonts
useEffect(() => {
  const fontUrls = getGoogleFontsImports(themeConfig);
  
  fontUrls.forEach((url, index) => {
    const linkId = `thank-you-font-${index}`;
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  });

  return () => {
    // Clean up on unmount
  };
}, [themeConfig]);
```

### ৩. Theme CSS Injection (useEffect)

```typescript
// Inject theme styles
useEffect(() => {
  const styleId = 'thank-you-theme-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  const themeStyles = generateThemeCSS(themeConfig, window.location.origin);
  styleEl.textContent = themeStyles;

  return () => {
    styleEl?.remove();
  };
}, [themeConfig]);
```

### ৪. Dynamic Styling প্রয়োগ

বর্তমান হার্ডকোডেড স্টাইল → CSS Variables এ পরিবর্তন:

```typescript
// আগে (হার্ডকোডেড)
<h1 className="text-3xl font-bold text-primary mb-2">ধন্যবাদ!</h1>

// পরে (থিম-ভিত্তিক)
<h1 
  className="text-3xl font-bold mb-2 font-heading"
  style={{ color: themeConfig.primaryColor }}
>
  ধন্যবাদ!
</h1>
```

### ৫. Button স্টাইল থিম অনুযায়ী

```typescript
const buttonRadius = themeConfig.buttonStyle === 'pill' 
  ? '9999px' 
  : themeConfig.buttonStyle === 'square' 
  ? '0' 
  : themeConfig.borderRadius;

<Link 
  style={{ 
    borderRadius: buttonRadius,
    backgroundColor: themeConfig.primaryColor 
  }}
>
  হোমে ফিরুন
</Link>
```

---

## প্রত্যাশিত ফলাফল

| থিম সেটিং | Thank You পেজে প্রভাব |
|-----------|----------------------|
| Primary Color | টাইটেল, বাটন, মূল্য সামারি রঙ |
| Heading Font | "ধন্যবাদ!", সেকশন হেডার ফন্ট |
| Body Font | প্যারাগ্রাফ, গ্রাহক তথ্য ফন্ট |
| Digit Font | দাম, অর্ডার আইডি নম্বর ফন্ট |
| Button Style | "হোমে ফিরুন" বাটন বর্ডার রেডিয়াস |

---

## ফাইল পরিবর্তন সারাংশ

| ফাইল | পরিবর্তন |
|------|----------|
| `src/pages/ThankYou.tsx` | Theme query, font loading, CSS injection, dynamic styling |

এই পরিবর্তনের পরে, প্রতিটি ল্যান্ডিং পেজের জন্য আলাদা থিম সেট করলে সেই থিম অনুযায়ী Thank You পেজ রেন্ডার হবে।
