

# Preview Page এ Device Simulation যোগ করা

## বর্তমান অবস্থা

- `/p/{slug}?preview=true` → শুধু page দেখায়, device simulation নেই
- `FullscreenPreviewModal.tsx` এ device presets আছে (Desktop, iPhone, iPad etc.)

## নতুন ফিচার

Preview mode এ একটি **floating toolbar** থাকবে যেখানে device সিলেক্ট করা যাবে। সিলেক্ট করলে page টি সেই device এর viewport এ দেখা যাবে।

---

## পরিবর্তন

### File: `src/pages/LandingPage.tsx`

**নতুন যা যোগ হবে:**

1. **Device Presets** - FullscreenPreviewModal থেকে নেওয়া
2. **Floating Preview Toolbar** - শুধু preview mode এ দেখাবে
3. **Viewport Simulation** - iframe দিয়ে সিমুলেট করা হবে

**Implementation:**

```typescript
// Device presets
const devicePresets = [
  { name: 'Desktop', width: 'full', height: 'full' },
  { name: 'iPhone 14 Pro', width: 393, height: 852 },
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
];

// State
const [selectedDevice, setSelectedDevice] = useState('Desktop');

// In render - Preview Mode Toolbar
{isPreviewMode && (
  <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b">
    <div className="flex items-center justify-between px-4 py-2">
      <span className="text-sm font-medium">Preview Mode</span>
      
      {/* Device Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline" size="sm">
            {selectedDevice} <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {devicePresets.map(device => (
            <DropdownMenuItem 
              key={device.name}
              onClick={() => setSelectedDevice(device.name)}
            >
              {device.name} 
              {device.width !== 'full' && `(${device.width}×${device.height})`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Quick toggles */}
      <div className="flex gap-1">
        <Button 
          variant={selectedDevice === 'Desktop' ? 'secondary' : 'ghost'} 
          size="icon"
          onClick={() => setSelectedDevice('Desktop')}
        >
          <Monitor className="h-4 w-4" />
        </Button>
        <Button 
          variant={selectedDevice !== 'Desktop' ? 'secondary' : 'ghost'} 
          size="icon"
          onClick={() => setSelectedDevice('iPhone 14 Pro')}
        >
          <Smartphone className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
)}
```

---

## Layout Logic

```text
Desktop Selected:
┌────────────────────────────────────────┐
│ [Preview Toolbar]                      │
├────────────────────────────────────────┤
│                                        │
│           Full Width Page              │
│                                        │
└────────────────────────────────────────┘

Mobile Selected:
┌────────────────────────────────────────┐
│ [Preview Toolbar]                      │
├────────────────────────────────────────┤
│                                        │
│     ┌─────────────┐                    │
│     │   Mobile    │  ← Device Frame    │
│     │   Preview   │                    │
│     │   393×852   │                    │
│     └─────────────┘                    │
│                                        │
└────────────────────────────────────────┘
```

---

## কিভাবে কাজ করবে

| Device | Behavior |
|--------|----------|
| Desktop | Full width, কোনো frame নেই |
| Mobile/Tablet | Centered device frame সহ, dimensions সহ |

---

## Files Summary

| File | Changes |
|------|---------|
| `LandingPage.tsx` | Device presets, toolbar, viewport simulation যোগ |

---

## Result

`/p/musterd-oil?preview=true` এ গেলে:

1. **Top toolbar** দেখাবে device selector সহ
2. **Desktop/Mobile toggle** button থাকবে
3. **Dropdown** এ সব device দেখা যাবে
4. Mobile/Tablet select করলে **centered frame** এ page দেখাবে
5. Frame এ **device name ও dimensions** দেখাবে

