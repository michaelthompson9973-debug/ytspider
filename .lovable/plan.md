

# Section List Collapsible Panel

## সমস্যা
Section Builder এ বাম পাশের **Section List** panel টি অনেক জায়গা নেয় (3 columns)। Editor এ কাজ করার সময় Section List collapse করে রাখতে পারলে Editor এর জন্য বেশি জায়গা পাওয়া যাবে।

## সমাধান
Admin Sidebar এর মতো Section List panel এ **collapse/expand** toggle button যোগ করা।

## Visual Design

```text
Expanded State (col-span-3):          Collapsed State (col-span-1):
┌─────────────────────────┐           ┌─────┐
│ ≡ Sections    [Add] [◀]│           │ [▶] │
├─────────────────────────┤           ├─────┤
│ 📄 Hero                 │           │ 📄  │
│ 📄 Features             │  ──────►  │ 📄  │
│ 📄 Pricing              │           │ 📄  │
│ 🛒 Order Form           │           │ 🛒  │
└─────────────────────────┘           └─────┘

Click ▶ to expand, ◀ to collapse
```

## Technical Implementation

### 1. SectionBuilder.tsx পরিবর্তন

**State যোগ:**
```tsx
const [sectionListCollapsed, setSectionListCollapsed] = useState(false);
```

**Grid Layout Update:**
```tsx
// Desktop Layout - Dynamic columns
<div className="hidden lg:grid flex-1 grid-cols-12 gap-4 min-h-0">
  {/* Left: Section List - Dynamic width */}
  <div className={cn(
    "border rounded-lg p-4 overflow-hidden flex flex-col transition-all",
    sectionListCollapsed ? "col-span-1 p-2" : "col-span-3"
  )}>
    <SectionList
      collapsed={sectionListCollapsed}
      onToggleCollapse={() => setSectionListCollapsed(!sectionListCollapsed)}
      // ... other props
    />
  </div>

  {/* Center: Editor - Dynamic width (expands when list collapses) */}
  <div className={cn(
    "border rounded-lg p-4 overflow-hidden",
    sectionListCollapsed ? "col-span-7" : "col-span-5"
  )}>
    ...
  </div>

  {/* Right: Preview (unchanged) */}
  <div className="col-span-4 ...">
    ...
  </div>
</div>
```

### 2. SectionList.tsx পরিবর্তন

**New Props:**
```tsx
interface SectionListProps {
  // ... existing props
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}
```

**Collapsed View:**
```tsx
// Header with collapse button
<div className="flex items-center justify-between mb-2 pb-2 border-b">
  {!collapsed ? (
    <>
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Layers className="h-4 w-4" />
        Sections
      </h3>
      <div className="flex items-center gap-1">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
        <Button size="icon" variant="ghost" onClick={onToggleCollapse}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>
    </>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" onClick={onToggleCollapse} className="mx-auto">
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">Expand sections</TooltipContent>
    </Tooltip>
  )}
</div>

// Collapsed mode - icon only list
{collapsed ? (
  <div className="flex-1 overflow-y-auto space-y-1">
    {sections.map((section) => (
      <Tooltip key={section.id}>
        <TooltipTrigger asChild>
          <button
            onClick={() => onSelectSection(section)}
            className={cn(
              "w-full p-2 rounded flex items-center justify-center",
              activeSection?.id === section.id && "bg-accent"
            )}
          >
            {section.type === 'checkout' ? (
              <ShoppingCart className="h-4 w-4" />
            ) : (
              <FileCode className="h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{section.name}</TooltipContent>
      </Tooltip>
    ))}
  </div>
) : (
  // Full section list (existing code)
)}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/landing-page-editor/SectionBuilder.tsx` | Add collapse state, dynamic grid columns |
| `src/components/admin/landing-page-editor/SectionList.tsx` | Add collapsed prop, toggle button, icon-only view |

## LocalStorage Persistence (Optional)
```tsx
const STORAGE_KEY = 'section-list-collapsed';

const [sectionListCollapsed, setSectionListCollapsed] = useState(() => {
  return localStorage.getItem(STORAGE_KEY) === 'true';
});

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, String(sectionListCollapsed));
}, [sectionListCollapsed]);
```

## Behavior Summary

| State | Section List Width | Editor Width | Features |
|-------|-------------------|--------------|----------|
| Expanded | col-span-3 | col-span-5 | Full list with names, Add button, drag-drop |
| Collapsed | col-span-1 | col-span-7 | Icon-only with tooltips, expand button |

