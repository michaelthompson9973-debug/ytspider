

## Problem

`ComponentLibrary.tsx` (line 145) wraps its category sidebar in a nested `<SidebarProvider>` + `<Sidebar>` component. Since `AdminLayout` already provides a `SidebarProvider`, nesting another one causes CSS variable conflicts and layout collapse. The component cards in the main content area become invisible or pushed off-screen.

## Root Cause

```
AdminLayout → SidebarProvider (outer)
  └── ComponentLibrary → SidebarProvider (inner) ← CONFLICT
        └── Sidebar (category menu)
```

The shadcn/ui Sidebar components use CSS variables (`--sidebar-width`) and flex layout that clash when nested.

## Fix

Replace the inner `SidebarProvider` + `Sidebar` wrapper with a plain `<div>` styled as a sidebar panel. The category menu content (Collapsible + SidebarMenu items) can remain, but the outer container must not be a `Sidebar` component.

### Changes in `src/pages/admin/ComponentLibrary.tsx`:

1. **Remove** the `SidebarProvider` and `Sidebar` wrapper around the desktop category panel (lines 144-152).
2. **Replace** with a simple `<div className="w-56 shrink-0 border-r bg-card overflow-y-auto p-2">` that holds the `<CategorySidebar />` content.
3. **Remove unused imports**: `Sidebar`, `SidebarContent`, `SidebarProvider` (keep `SidebarGroup`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuButton`, `SidebarMenuItem` since those are used inside CategorySidebar and work fine without a parent `SidebarProvider` context for simple rendering).

Actually — to be safe and avoid any `useSidebar()` context issues from the menu sub-components, we should also replace the `SidebarGroup/SidebarMenu*` components with plain styled `<div>/<button>` elements, or simply keep them since they inherit the outer AdminLayout's SidebarProvider context (which is fine for rendering, they just won't control the admin sidebar).

The simplest and cleanest fix: keep the `SidebarMenu*` components (they'll inherit the outer provider) but remove the nested `SidebarProvider` + `Sidebar` wrapper, replacing with a plain div container.

