

# Preview বাটন নামকরণ সংশোধন

## সমস্যা
Section Builder এ দুইটি "Preview" বাটন আছে যা ভিন্ন কাজ করে:
- বাটন ১: নতুন ট্যাবে Live Page খোলে (External Link)
- বাটন ২: পাশের প্যানেলে Section Preview দেখায়

## সমাধান
প্রতিটি বাটনের নাম তার কাজ অনুযায়ী পরিবর্তন করা হবে:

| বর্তমান নাম | নতুন নাম | কাজ |
|------------|---------|-----|
| Preview (ExternalLink icon) | **View Live** | নতুন ট্যাবে পাবলিশড পেজ দেখায় |
| Preview (Eye icon) | **Canvas** | পাশের প্যানেলে section preview দেখায় |

## পরিবর্তন

### `src/components/admin/landing-page-editor/SectionBuilder.tsx`

**Line 184**: "Preview" → "View Live"
```typescript
<span className="hidden sm:inline">View Live</span>
```

**Line 207**: "Preview" → "Canvas"
```typescript
<Eye className="h-4 w-4 mr-1" />
Canvas
```

## ফলাফল
- ✅ দুইটি বাটনের নাম এখন তাদের কাজ স্পষ্টভাবে বলছে
- ✅ "View Live" = বাইরে দেখা
- ✅ "Canvas" = ভিতরে Preview Panel

