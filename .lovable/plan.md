
# ল্যান্ডিং পেজ পারফরম্যান্স অপটিমাইজেশন ও স্কেলেটন লোডার প্ল্যান

## ✅ বাস্তবায়িত (Completed)

### ১. LandingPageSkeleton Component তৈরি ✅
- নতুন `LandingPageSkeleton.tsx` কম্পোনেন্ট তৈরি করা হয়েছে
- Hero section skeleton
- Content sections skeleton (feature cards, image+text)
- Checkout form skeleton (products + form fields)

### ২. DomainGuard Skeleton উন্নতি ✅
- Domain check এর সময় পুরো `LandingPageSkeleton` দেখায়
- আগের সাধারণ `animate-pulse` box সরিয়ে দেওয়া হয়েছে

### ৩. LandingPage.tsx Optimization ✅
- **Skeleton → Content Transition**: `showContent` state দিয়ে smooth fade-in
- **Script Loading**: Tailwind CDN এ `async` + `defer` attribute যোগ করা হয়েছে
- **Fade Animation**: Content লোড হওয়ার পর `fade-in-up` animation

### ৪. CSS Animations যোগ ✅ (src/index.css)
- `.fade-in-up` - content এর জন্য upward fade animation
- `.fade-in` - simple fade animation
- `@keyframes fadeInUp` এবং `@keyframes fadeIn`
- `.img-loading` / `.img-loaded` - image transitions

### ৫. Image Lazy Loading Enhancement ✅
- **ProductList.tsx**: `ProductImage` sub-component দিয়ে skeleton placeholder + fade-in
- **ProductImageGallery.tsx**: `GalleryImage` sub-component দিয়ে loading state + fade-in
- Both components এখন image লোড হওয়ার আগে skeleton দেখায়

---

## পরিবর্তিত ফাইলসমূহ

| ফাইল | পরিবর্তন |
|------|----------|
| `src/components/landing/LandingPageSkeleton.tsx` | **নতুন** - Full page skeleton |
| `src/components/landing/DomainGuard.tsx` | LandingPageSkeleton import ও ব্যবহার |
| `src/pages/LandingPage.tsx` | Skeleton integration + fade animation + async script |
| `src/index.css` | Fade animation classes যোগ |
| `src/components/landing/ProductList.tsx` | Image loading state + skeleton |
| `src/components/landing/ProductImageGallery.tsx` | Image loading state + skeleton |

---

## প্রত্যাশিত ফলাফল

| মেট্রিক | আগে | পরে |
|---------|------|------|
| First Paint | ধীর (blank page) | দ্রুত (skeleton) |
| Time to Interactive | Waterfall delays | Parallel loading |
| User Experience | "Loading..." টেক্সট | সুন্দর skeleton animation |
| Layout Shift (CLS) | Image jumps | Stable skeleton placeholders |
| Scroll Behavior | No smooth scroll | `scroll-behavior: smooth` |

