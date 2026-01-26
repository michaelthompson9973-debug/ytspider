

# Fullscreen Expand Mode Plan

## Overview
Preview এবং Code Editor উভয়ের জন্য fullscreen expand mode যোগ করা হবে। Expand button এ ক্লিক করলে একটি fullscreen modal খুলবে যেখানে:
- **Preview**: সম্পূর্ণ landing page এর আসল version দেখা যাবে
- **Code Editor**: VS Code স্টাইলে বড় editor দেখা যাবে

## UI Design

### Current Toolbar + Expand Button
```text
┌──────────────────────────────────────────────┐
│ [Preview][HTML]   [Desktop][Mobile][🔄][⛶]  │
└──────────────────────────────────────────────┘
                                         ↑
                                    Expand Button
```

### Fullscreen Preview Modal
```text
┌─────────────────────────────────────────────────────────────┐
│  Landing Page Preview                           [Desktop][Mobile][X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌───────────────────────────────────────────────────┐    │
│    │                                                   │    │
│    │                                                   │    │
│    │           FULL PAGE PREVIEW                       │    │
│    │           (iframe - actual size)                  │    │
│    │                                                   │    │
│    │                                                   │    │
│    │                                                   │    │
│    └───────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fullscreen Code Editor Modal
```text
┌─────────────────────────────────────────────────────────────┐
│  Code Editor - Section Name                    [Copy][AI][X]│
├─────────────────────────────────────────────────────────────┤
│ 1 │ <section class="hero-section">                         │
│ 2 │   <div class="container">                              │
│ 3 │     <h1>Welcome</h1>                                   │
│ 4 │     <p>Lorem ipsum dolor sit amet</p>                  │
│ 5 │   </div>                                               │
│ 6 │ </section>                                             │
│   │                                                        │
│   │                                                        │
│   │                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### New Component: FullscreenPreviewModal

Location: `src/components/admin/landing-page-editor/FullscreenPreviewModal.tsx`

```typescript
interface FullscreenPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  themeConfig: ThemeConfig;
  landingPageId: string;
  gtmId?: string;
}
```

Features:
- Uses Dialog component with `max-w-[100vw] h-[100vh]` styling
- Desktop/Mobile toggle preserved
- Refresh button
- Larger iframe for actual page viewing
- Optional: URL bar showing simulated landing page URL

### New Component: FullscreenCodeModal

Location: `src/components/admin/landing-page-editor/FullscreenCodeModal.tsx`

```typescript
interface FullscreenCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  html: string;
  onHtmlChange: (html: string) => void;
  sectionName: string;
  themeConfig: ThemeConfig;
}
```

Features:
- VS Code style dark theme editor
- Line numbers displayed
- Monospace font
- Copy button
- AI Enhance button
- Syntax highlighting (optional - could use a library later)

### File Changes

| File | Changes |
|------|---------|
| `FullscreenPreviewModal.tsx` | New component - fullscreen preview dialog |
| `FullscreenCodeModal.tsx` | New component - fullscreen code editor dialog |
| `FullPagePreview.tsx` | Add expand button, state for modal, integrate FullscreenPreviewModal |
| `SectionEditor.tsx` | Add expand button in code mode, integrate FullscreenCodeModal |
| `CheckoutEditor.tsx` | Add expand button in preview mode |
| `index.ts` | Export new components |

---

## Implementation Details

### 1. FullscreenPreviewModal Component

```typescript
export function FullscreenPreviewModal({
  open,
  onOpenChange,
  sections,
  themeConfig,
  landingPageId,
  gtmId,
}: FullscreenPreviewModalProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Generate preview HTML same as FullPagePreview
  const previewHtml = generatePreviewHTML(sectionsHtml, themeConfig);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen p-0 gap-0">
        {/* Header with controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DialogTitle>Landing Page Preview</DialogTitle>
          <div className="flex items-center gap-2">
            {/* Device toggles */}
            <Button variant={device === 'desktop' ? 'secondary' : 'ghost'} onClick={() => setDevice('desktop')}>
              <Monitor className="h-4 w-4" />
            </Button>
            <Button variant={device === 'mobile' ? 'secondary' : 'ghost'} onClick={() => setDevice('mobile')}>
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => setRefreshKey(k => k + 1)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Full height iframe */}
        <div className="flex-1 overflow-hidden bg-muted/30">
          <div className={cn(
            'h-full mx-auto transition-all',
            device === 'mobile' ? 'max-w-[375px] border-x' : 'w-full'
          )}>
            <iframe
              key={refreshKey}
              srcDoc={previewHtml}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. FullscreenCodeModal Component

```typescript
export function FullscreenCodeModal({
  open,
  onOpenChange,
  html,
  onHtmlChange,
  sectionName,
  themeConfig,
}: FullscreenCodeModalProps) {
  const [localHtml, setLocalHtml] = useState(html);
  const lines = localHtml.split('\n');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-zinc-900 text-white">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <DialogTitle className="text-white">{sectionName}</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white">
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <AiEnhanceButton html={localHtml} onEnhanced={setLocalHtml} />
          </div>
        </div>
        
        {/* VS Code style editor */}
        <div className="flex-1 overflow-hidden bg-zinc-900">
          <div className="flex h-full">
            {/* Line numbers */}
            <div className="px-3 py-4 text-right text-zinc-500 select-none font-mono text-sm border-r border-zinc-700">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            
            {/* Code area */}
            <textarea
              className="flex-1 p-4 bg-transparent text-zinc-100 font-mono text-sm resize-none focus:outline-none"
              value={localHtml}
              onChange={(e) => setLocalHtml(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
        
        {/* Footer with Apply button */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t bg-zinc-800">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            onHtmlChange(localHtml);
            onOpenChange(false);
          }}>
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Update FullPagePreview.tsx

Add expand button and modal state:

```typescript
// New state
const [fullscreenOpen, setFullscreenOpen] = useState(false);

// In toolbar, add expand button
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={() => setFullscreenOpen(true)}
  title="Expand to fullscreen"
>
  <Maximize2 className="h-4 w-4" />
</Button>

// Add modal at end
<FullscreenPreviewModal
  open={fullscreenOpen}
  onOpenChange={setFullscreenOpen}
  sections={sections}
  themeConfig={themeConfig}
  landingPageId={landingPageId}
  gtmId={gtmId}
/>
```

### 4. Update SectionEditor.tsx

Add expand button for code mode:

```typescript
// New state
const [codeFullscreenOpen, setCodeFullscreenOpen] = useState(false);

// In code mode toolbar
{viewMode === 'code' && (
  <>
    <AiEnhanceButton ... />
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setCodeFullscreenOpen(true)}
    >
      <Maximize2 className="h-4 w-4" />
    </Button>
  </>
)}

// Add modal
<FullscreenCodeModal
  open={codeFullscreenOpen}
  onOpenChange={setCodeFullscreenOpen}
  html={html}
  onHtmlChange={(newHtml) => {
    setHtml(newHtml);
    setIsDirty(true);
  }}
  sectionName={name}
  themeConfig={themeConfig}
/>
```

---

## Summary Table

| Component | Changes |
|-----------|---------|
| `FullscreenPreviewModal.tsx` | New - Fullscreen preview dialog with device toggle |
| `FullscreenCodeModal.tsx` | New - VS Code style fullscreen code editor |
| `FullPagePreview.tsx` | Add Maximize2 button, integrate FullscreenPreviewModal |
| `SectionEditor.tsx` | Add expand button in code mode, integrate FullscreenCodeModal |
| `CheckoutEditor.tsx` | Add expand button for preview mode |
| `index.ts` | Export new modal components |

---

## User Experience

1. **Preview Expand**: Preview panel এর toolbar এ ⛶ (maximize) icon এ click করলে fullscreen modal ওপেন হবে
2. **Code Expand**: Code mode এ থাকাকালীন expand button এ click করলে VS Code style dark editor ওপেন হবে
3. **Mobile Friendly**: Fullscreen modal গুলো mobile এও সঠিকভাবে কাজ করবে
4. **Changes Sync**: Fullscreen code editor এ changes করে Apply করলে main editor এ reflect হবে

