
# HTML Code Editor Tabs Feature

## বর্তমান অবস্থা
- Single `html` field-এ সব HTML content সংরক্ষিত
- একটি textarea-তে সম্পূর্ণ code edit হয়

## প্রস্তাবিত সমাধান

### UI Design

```text
┌─────────────────────────────────────────────────────────┐
│  [এডিটর]  [প্রিভিউ]  [HTML] ←── এটায় ক্লিক করলে নিচে ট্যাব আসবে │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┬────────┬────────┐                      │
│  │  Full Code ✓ │  Head  │  Body  │ ←── Sub-tabs        │
│  └──────────────┴────────┴────────┘                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 1 │ <style>                                         │ │
│  │ 2 │   .hero { background: #fff; }                   │ │
│  │ 3 │ </style>                                        │ │
│  │ 4 │ <section class="hero">                          │ │
│  │ 5 │   <h1>Welcome</h1>                              │ │
│  │ 6 │ </section>                                      │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### কিভাবে কাজ করবে

| Tab | বিষয়বস্তু | উদ্দেশ্য |
|-----|-----------|----------|
| **Full Code** | সম্পূর্ণ HTML | সব একসাথে edit করা (বর্তমান behavior) |
| **Head** | শুধু `<style>`, `<script>` | CSS/JS আলাদাভাবে edit করা |
| **Body** | শুধু main content | HTML structure আলাদাভাবে edit করা |

### Technical Approach

**Option A: Parse & Merge (Recommended)**
- Database-এ কোনো change লাগবে না
- Single `html` field-ই থাকবে
- UI-তে parse করে আলাদা tabs-এ দেখাবে
- Save করার সময় merge করে একটা html-এ রাখবে

```typescript
// Parse logic
function parseHtml(fullHtml: string) {
  // Extract <style>...</style> and <script>...</script> as "head"
  // Remaining content as "body"
  const styleRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
  const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;
  
  const styles = fullHtml.match(styleRegex) || [];
  const scripts = fullHtml.match(scriptRegex) || [];
  
  const head = [...styles, ...scripts].join('\n');
  const body = fullHtml
    .replace(styleRegex, '')
    .replace(scriptRegex, '')
    .trim();
  
  return { head, body };
}

// Merge logic
function mergeHtml(head: string, body: string) {
  return `${head}\n\n${body}`;
}
```

---

## Implementation Steps

### Step 1: Update SectionEditor.tsx

**Sub-tab state management:**
```typescript
const [codeTab, setCodeTab] = useState<'full' | 'head' | 'body'>('full');
const [headCode, setHeadCode] = useState('');
const [bodyCode, setBodyCode] = useState('');
```

**Parse on tab switch:**
- Full → Head/Body: Parse current `html` into parts
- Head/Body → Full: Merge parts back

### Step 2: Add Tab UI

```typescript
{viewMode === 'code' && (
  <div className="flex items-center gap-1 mb-2">
    <Button 
      variant={codeTab === 'full' ? 'default' : 'ghost'}
      size="sm" 
      onClick={() => setCodeTab('full')}
    >
      Full Code
    </Button>
    <Button 
      variant={codeTab === 'head' ? 'default' : 'ghost'}
      size="sm" 
      onClick={() => setCodeTab('head')}
    >
      Head
    </Button>
    <Button 
      variant={codeTab === 'body' ? 'default' : 'ghost'}
      size="sm" 
      onClick={() => setCodeTab('body')}
    >
      Body
    </Button>
  </div>
)}
```

### Step 3: Textarea Switching

```typescript
{codeTab === 'full' ? (
  <textarea value={html} onChange={...} />
) : codeTab === 'head' ? (
  <textarea value={headCode} onChange={...} placeholder="<style>...</style>" />
) : (
  <textarea value={bodyCode} onChange={...} placeholder="<section>...</section>" />
)}
```

### Step 4: Update FullscreenCodeModal

Same 3-tab system FullscreenCodeModal-এও add করতে হবে।

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/landing-page-editor/SectionEditor.tsx` | Sub-tabs + parse/merge logic |
| `src/components/admin/landing-page-editor/FullscreenCodeModal.tsx` | Same sub-tabs |

---

## Technical Details

### Parse Function
```typescript
function parseHtmlParts(fullHtml: string): { head: string; body: string } {
  const styleMatches = fullHtml.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  const scriptMatches = fullHtml.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
  
  let bodyHtml = fullHtml;
  [...styleMatches, ...scriptMatches].forEach(match => {
    bodyHtml = bodyHtml.replace(match, '');
  });
  
  return {
    head: [...styleMatches, ...scriptMatches].join('\n\n'),
    body: bodyHtml.trim()
  };
}
```

### Merge Function
```typescript
function mergeHtmlParts(head: string, body: string): string {
  const trimmedHead = head.trim();
  const trimmedBody = body.trim();
  
  if (!trimmedHead) return trimmedBody;
  if (!trimmedBody) return trimmedHead;
  return `${trimmedHead}\n\n${trimmedBody}`;
}
```

---

## Expected Result

- HTML button-এ ক্লিক করলে 3টা sub-tab দেখাবে
- **Full Code**: বর্তমান behavior (সম্পূর্ণ HTML)
- **Head**: শুধু `<style>` এবং `<script>` tags
- **Body**: বাকি সব content
- Tab switch করলে automatically parse/merge হবে
- Database-এ কোনো পরিবর্তন লাগবে না

