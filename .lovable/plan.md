

# Section Builder - Master Responsive Resizable Layout & Smart Code Editor

## Overview
পুরো Section Builder canvas টাকে VS Code এর মতো smooth, resizable panels দিয়ে তৈরি করা হবে যেখানে প্রতিটা panel টেনে ছোট-বড় করা যাবে। পাশাপাশি code editor গুলোকে Monaco Editor দিয়ে upgrade করা হবে যেটা syntax highlighting, auto-completion, এবং professional IDE experience দেবে।

## Current Problems
- Fixed column layout (`col-span-3`, `col-span-5`, `col-span-4`) - সাইজ টেনে পরিবর্তন করা যায় না
- Plain textarea code editor - কোন syntax highlighting নেই
- Line numbers manually maintained - sync issues থাকতে পারে
- Mobile/Desktop layout আলাদা, resizing নেই

## Solution Architecture

```text
Before (Fixed Grid):
┌──────────────┬──────────────────┬────────────────┐
│  Section     │     Editor       │    Preview     │
│  List        │                  │                │
│  (col-3)     │    (col-5)       │    (col-4)     │
│  FIXED       │    FIXED         │    FIXED       │
└──────────────┴──────────────────┴────────────────┘

After (Resizable Panels - VS Code Style):
┌──────────────╫──────────────────╫────────────────┐
│  Section     ║     Editor       ║    Preview     │
│  List        ║  + Monaco        ║                │
│              ║                  ║                │
│  ← DRAG →    ║    ← DRAG →      ║   ← DRAG →     │
└──────────────╫──────────────────╫────────────────┘
       ↕              ↕                  ↕
   (10-30%)       (30-60%)           (20-50%)
```

## Implementation Plan

### Part 1: Install Monaco Editor

**File:** `package.json`

Add dependency:
```json
"@monaco-editor/react": "^4.6.0"
```

### Part 2: Create Smart Code Editor Component

**New File:** `src/components/admin/landing-page-editor/SmartCodeEditor.tsx`

Features:
- Monaco Editor integration
- HTML/CSS/JS syntax highlighting
- Auto-completion for HTML tags
- Bracket matching
- Dark theme (VS Code style)
- Line numbers (automatic)
- Word wrap toggle
- Minimap (optional)
- Find & Replace (Ctrl+F)
- Head/Body tab support
- Real-time validation

```tsx
interface SmartCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'html' | 'css' | 'javascript';
  theme?: 'vs-dark' | 'light';
  height?: string;
  placeholder?: string;
}
```

### Part 3: Resizable Panel Layout

**File:** `src/components/admin/landing-page-editor/SectionBuilder.tsx`

Replace CSS Grid with `ResizablePanelGroup`:

```tsx
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';

// Desktop Layout - Resizable 3 columns
<ResizablePanelGroup 
  direction="horizontal" 
  autoSaveId="section-builder-layout"
>
  {/* Left: Section List */}
  <ResizablePanel 
    defaultSize={20} 
    minSize={10} 
    maxSize={30}
    collapsible
    collapsedSize={4}
  >
    <SectionList ... />
  </ResizablePanel>

  <ResizableHandle withHandle />

  {/* Center: Editor */}
  <ResizablePanel 
    defaultSize={45} 
    minSize={30}
  >
    <SectionEditor ... />
  </ResizablePanel>

  <ResizableHandle withHandle />

  {/* Right: Preview/Theme/Products */}
  <ResizablePanel 
    defaultSize={35} 
    minSize={20}
  >
    <FullPagePreview ... />
  </ResizablePanel>
</ResizablePanelGroup>
```

Key features:
- `autoSaveId`: localStorage এ panel sizes save করবে
- `collapsible`: Section list fully collapse করা যাবে
- `minSize/maxSize`: Minimum/Maximum resize limits
- `withHandle`: Visible drag handle (GripVertical icon)

### Part 4: Update SectionEditor with Smart Code Editor

**File:** `src/components/admin/landing-page-editor/SectionEditor.tsx`

Replace textarea with SmartCodeEditor:

```tsx
// Before: Plain textarea
<textarea
  className="flex-1 w-full h-full font-mono ..."
  value={html}
  onChange={(e) => setHtml(e.target.value)}
/>

// After: Monaco Editor
<SmartCodeEditor
  value={html}
  onChange={(newHtml) => {
    setHtml(newHtml);
    setIsDirty(true);
  }}
  language="html"
  theme="vs-dark"
  height="100%"
/>
```

### Part 5: Update Fullscreen Code Modal

**File:** `src/components/admin/landing-page-editor/FullscreenCodeModal.tsx`

Replace textarea with Monaco Editor:
- Remove manual line number sync
- Use Monaco's built-in features
- Keep Head/Body tab structure
- Add minimap toggle
- Add find/replace support

### Part 6: Responsive Breakpoints

Desktop (lg+):
```text
ResizablePanelGroup (horizontal)
├── SectionList (10-30%)
├── Editor (30-60%)
└── Preview (20-50%)
```

Tablet (md):
```text
ResizablePanelGroup (horizontal)
├── SectionList (collapsible)
└── Editor+Preview (tabbed)
```

Mobile (sm):
```text
Bottom Navigation Tabs
├── Sections Tab
├── Editor Tab
└── Preview Tab
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add @monaco-editor/react |
| `SmartCodeEditor.tsx` | Create | Monaco Editor wrapper component |
| `SectionBuilder.tsx` | Modify | Replace grid with ResizablePanelGroup |
| `SectionEditor.tsx` | Modify | Use SmartCodeEditor instead of textarea |
| `FullscreenCodeModal.tsx` | Modify | Upgrade to Monaco Editor |

## Technical Details

### Monaco Editor Configuration

```tsx
const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false }, // Toggle-able
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  wordWrap: 'on',
  lineNumbers: 'on',
  renderLineHighlight: 'all',
  bracketPairColorization: { enabled: true },
  formatOnPaste: true,
  autoClosingBrackets: 'always',
  autoClosingTags: true,
  tabSize: 2,
  scrollBeyondLastLine: false,
};
```

### ResizablePanel Props

```tsx
<ResizablePanel
  defaultSize={20}      // Initial size (percentage)
  minSize={10}          // Minimum size when dragging
  maxSize={30}          // Maximum size when dragging
  collapsible={true}    // Can collapse to 0
  collapsedSize={4}     // Size when collapsed (icon-only)
  onCollapse={() => {}} // Callback when collapsed
  onExpand={() => {}}   // Callback when expanded
/>
```

### localStorage Persistence

```tsx
// Panel sizes automatically saved
<ResizablePanelGroup autoSaveId="section-builder-layout">

// Format in localStorage:
// "react-resizable-panels:section-builder-layout" = [20, 45, 35]
```

## Visual Result

### Desktop (1920px+)
```text
┌────────────────────────────────────────────────────────────────┐
│ [<] Section Builder                     [Save] [Theme] [Preview]│
├───────╫────────────────────────────────╫───────────────────────┤
│ [▶]   ║ ┌─────────────────────────────┐║ ┌──────────────────┐ │
│ 📄 H  ║ │ Section Name: [Hero      ] ║ │ ┌──────────────┐ │ │
│ 📄 F  ╫─│─────────────────────────────│─║─│   PREVIEW    │ │ │
│ 📄 P  ║ │ [Editor] [Preview] [HTML]   │ ║ │              │ │ │
│ 🛒 C  ║ │                             │ ║ │   📱 375px   │ │ │
│       ║ │ <section class="hero">      │ ║ │              │ │ │
│ [+]   ║ │   <h1>Welcome</h1>          │ ║ └──────────────┘ │ │
│       ║ │ </section>                  │ ║                  │ │
├───────╫─└─────────────────────────────┘─╫──────────────────────┤
    ↕                    ↕                          ↕
 Draggable          Draggable                  Draggable
```

### Tablet (768px - 1024px)
```text
┌──────────────────────────────────────────┐
│ [≡] Section Builder        [Save]        │
├──────╫───────────────────────────────────┤
│ [▶]  ║ [Editor Tab] [Preview Tab]        │
│ 📄 H ║ ┌───────────────────────────────┐ │
│ 📄 F ║ │ Monaco Editor                 │ │
│ [+]  ║ │ Full width                    │ │
└──────╫─└───────────────────────────────┘─┘
    ↕
Collapsible
```

## Smart Code Editor Features

| Feature | Description |
|---------|-------------|
| Syntax Highlighting | HTML, CSS, JavaScript রঙিন হবে |
| Auto-complete | `<div` লিখলে suggestions আসবে |
| Bracket Matching | `{}`, `[]`, `()` highlight হবে |
| Auto-close Tags | `<div>` লিখলে `</div>` auto add হবে |
| Format on Paste | Code paste করলে auto format হবে |
| Find & Replace | Ctrl+F দিয়ে search করা যাবে |
| Multi-cursor | Alt+Click দিয়ে multiple cursor |
| Code Folding | Section collapse করা যাবে |
| Error Hints | Invalid HTML red underline |

## Mobile UX Preserved

- Bottom navigation tabs unchanged
- Swipe gestures work
- Fullscreen code modal available
- Touch-friendly controls

