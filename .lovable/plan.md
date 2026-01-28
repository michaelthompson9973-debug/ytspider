

# Phone Version এ 1 Column Layout - Fix Plan

## সমস্যা

Preview এর Phone mode এ checkout section 2 column দেখাচ্ছে কিন্তু এটা 1 column হওয়া উচিত।

**বর্তমান সমস্যাযুক্ত কোড (`themeUtils.ts` line 381):**
```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
```
এটা সবসময় 2 column, responsive breakpoint নেই।

## সমাধান

`generateCheckoutPreviewHTML` function এ Tailwind CSS classes ব্যবহার করে responsive grid implement করতে হবে:

**নতুন কোড:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
```

এতে:
- **Phone (< 768px)**: 1 column (grid-cols-1)
- **Desktop (≥ 768px)**: 2 column (md:grid-cols-2)

---

## Technical Implementation

### File: `src/components/admin/landing-page-editor/themeUtils.ts`

**পরিবর্তন:**
- Line 381: inline style এর বদলে Tailwind responsive classes ব্যবহার করা
- `grid-template-columns: 1fr 1fr` হটিয়ে `class="grid grid-cols-1 md:grid-cols-2 gap-6"` দেওয়া

---

## Expected Result

### Fix এর পরে:

1. **Phone Mode Preview (375px)**
   - Product image/info এবং form একটার নিচে আরেকটা (stacked)
   - সিঙ্গেল কলাম লেআউট

2. **Desktop Mode Preview**
   - বাম পাশে Product info, ডান পাশে Form
   - 2 কলাম লেআউট

এটা `CheckoutSection.tsx` এর React component এর সাথে match করবে যেখানে `grid grid-cols-1 md:grid-cols-2` ব্যবহার করা হয়েছে।

