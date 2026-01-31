
# ল্যান্ডিং পেজ পারফরম্যান্স অপটিমাইজেশন ও স্কেলেটন লোডার প্ল্যান

## সমস্যা বিশ্লেষণ

বর্তমান কোডে যে পারফরম্যান্স সমস্যাগুলো আছে:

### ১. **ব্লকিং লোডার (DomainGuard + LandingPage)**
- `DomainGuard.tsx` এ সাধারণ `animate-pulse` দিয়ে একটাই ছোট box দেখায়
- `LandingPage.tsx` এ শুধু "Loading..." টেক্সট দেখায়
- এতে User Experience খারাপ হয় - পেজ ফাঁকা লাগে

### ২. **Sequential Data Loading (Waterfall)**
- প্রথমে landing page fetch করে
- তারপর products fetch করে
- তারপর sections fetch করে
- তারপর theme fetch করে
- এই waterfall প্যাটার্ন slow করে

### ৩. **Heavy useEffect Scripts**
- Tailwind CDN script প্রতিবার inject হচ্ছে
- Google Fonts dynamically load হচ্ছে
- GTM script inject হচ্ছে
- এগুলো First Paint ব্লক করে

### ৪. **Missing Image Optimization**
- Images-এ proper width/height নেই
- Layout shift হয়

---

## সমাধান পরিকল্পনা

### ধাপ ১: Landing Page Skeleton Loader তৈরি
নতুন কম্পোনেন্ট `LandingPageSkeleton.tsx` তৈরি করব যেটা:
- Hero section skeleton
- Content sections skeleton
- Checkout form skeleton
- Smooth fade-in animation দিয়ে show করবে

```text
+------------------------------------------+
|  [███████████████] Hero Image Skeleton   |
|  ████████████████████████                |
|  ████████████  ████████                  |
+------------------------------------------+
|                                          |
|  ████████  ████████████████████████      |
|  ████████████████  ████████              |
|                                          |
+------------------------------------------+
|  Checkout Section Skeleton               |
|  +------------------+  +---------------+ |
|  | Product Skeleton |  | Form Skeleton | |
|  | ████  ████████   |  | ████████████  | |
|  +------------------+  +---------------+ |
+------------------------------------------+
```

### ধাপ ২: DomainGuard Skeleton উন্নতি
`DomainGuard.tsx` এ নতুন skeleton loader add করব যাতে domain check এর সময় সুন্দর skeleton দেখায়

### ধাপ ৩: LandingPage.tsx Optimization

**A. Parallel Data Fetching:**
```typescript
// একসাথে সব queries run করব
const queries = useQueries({
  queries: [
    { queryKey: ['landing-page', slug], ... },
    { queryKey: ['sections', pageId], enabled: !!pageId, ... },
    { queryKey: ['theme', pageId], enabled: !!pageId, ... },
  ]
});
```

**B. Skeleton → Content Transition:**
- `isLoading` state এ skeleton দেখাব
- Data load হলে smooth fade-in দিয়ে content দেখাব

**C. Script Loading Optimization:**
- Tailwind CDN `async` attribute add করব
- GTM script lazy load করব (after first paint)

### ধাপ ৪: CSS Animations যোগ
`src/index.css` এ smooth fade-in animation add করব:
```css
.fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### ধাপ ৫: Image Lazy Loading Enhancement
`ProductList.tsx` এবং `ProductImageGallery.tsx` এ:
- Skeleton placeholder before image loads
- `onLoad` event দিয়ে fade-in

---

## ফাইল পরিবর্তন

| ফাইল | পরিবর্তন |
|------|----------|
| `src/components/landing/LandingPageSkeleton.tsx` | **নতুন** - Full page skeleton component |
| `src/components/landing/DomainGuard.tsx` | Improved skeleton loader |
| `src/pages/LandingPage.tsx` | Skeleton integration + parallel fetch + fade animation |
| `src/index.css` | Fade animation classes |
| `src/components/landing/ProductList.tsx` | Image loading state + skeleton |
| `src/components/landing/ProductImageGallery.tsx` | Image loading state + skeleton |

---

## টেকনিক্যাল বিবরণ

### LandingPageSkeleton Component Structure:
```typescript
export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="w-full h-64 md:h-96 bg-muted" />
      
      {/* Content Sections */}
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      {/* Checkout Skeleton */}
      <div className="bg-muted/50 py-12">
        <div className="container max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Product skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
          {/* Form skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Fade-in Transition Logic:
```typescript
const [showContent, setShowContent] = useState(false);

useEffect(() => {
  if (!isLoading && page) {
    // Small delay for smooth transition
    const timer = setTimeout(() => setShowContent(true), 50);
    return () => clearTimeout(timer);
  }
}, [isLoading, page]);

return isLoading || !showContent ? (
  <LandingPageSkeleton />
) : (
  <div className="fade-in-up">
    {/* Actual content */}
  </div>
);
```

### Script Loading Optimization:
```typescript
// Defer Tailwind CDN
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.tailwindcss.com';
  script.async = true;  // Non-blocking
  script.defer = true;  // After HTML parse
  document.head.appendChild(script);
}, []);

// Defer GTM until after first paint
useEffect(() => {
  if (!page?.gtm_id) return;
  
  // Wait for first paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Inject GTM
    });
  });
}, [page?.gtm_id]);
```

---

## প্রত্যাশিত ফলাফল

| মেট্রিক | আগে | পরে |
|---------|------|------|
| First Paint | ধীর (blank page) | দ্রুত (skeleton) |
| Time to Interactive | Waterfall delays | Parallel loading |
| User Experience | "Loading..." টেক্সট | সুন্দর skeleton animation |
| Layout Shift (CLS) | Image jumps | Stable skeleton placeholders |
| Scroll Behavior | No smooth scroll | `scroll-behavior: smooth` |

এই পরিবর্তনগুলো করলে ল্যান্ডিং পেজ অনেক দ্রুত এবং smooth লোড হবে, বিশেষ করে paid traffic এর জন্য first impression অনেক ভালো হবে।
