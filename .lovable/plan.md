
# Maximize2 বাটনে Modal Preview যুক্ত করা

## সমস্যা
বর্তমানে `Maximize2` (expand) আইকন বাটনে ক্লিক করলে নতুন ট্যাবে preview page খোলে। কিন্তু instant view এর জন্য modal open হওয়া উচিত।

## সমাধান
`FullscreenPreviewModal` component ব্যবহার করে in-app fullscreen preview modal দেখাবো।

## পরিবর্তন

### `src/components/admin/landing-page-editor/FullPagePreview.tsx`

**১. Import যোগ করা:**
```typescript
import { FullscreenPreviewModal } from './FullscreenPreviewModal';
```

**২. Modal state যোগ করা:**
```typescript
const [fullscreenOpen, setFullscreenOpen] = useState(false);
```

**৩. বাটন onClick পরিবর্তন করা:**
বর্তমান:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={handleOpenRealPreview}
  title={landingPage?.slug ? `/p/${landingPage.slug}?preview=true` : 'Preview link'}
>
  <Maximize2 className="h-4 w-4" />
</Button>
```

নতুন:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={() => setFullscreenOpen(true)}
  title="Fullscreen Preview"
>
  <Maximize2 className="h-4 w-4" />
</Button>
```

**৪. Modal component যোগ করা:**
Component এর শেষে (return এর ভিতরে):
```tsx
<FullscreenPreviewModal
  open={fullscreenOpen}
  onOpenChange={setFullscreenOpen}
  sections={sections}
  themeConfig={themeConfig}
  landingPageId={landingPageId}
  gtmId={gtmId}
/>
```

## ফলাফল
- Maximize2 বাটনে ক্লিক করলে instant fullscreen modal ওপেন হবে
- Modal এ device simulation (Desktop, iPhone, Samsung, iPad) থাকবে
- নতুন ট্যাবে না গিয়ে app এর ভিতরেই preview দেখা যাবে
- Modal এর ভিতরে "External Link" বাটন থাকবে যা নতুন ট্যাবে খুলতে পারবে
