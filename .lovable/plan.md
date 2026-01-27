

# Delivery Amount Settings Fix - Label Edit এবং Inside/Outside System

## বর্তমান সমস্যা বিশ্লেষণ

বর্তমান Zone-Based Delivery Settings এ কিছু UI/UX সমস্যা আছে:

1. **Zone Settings লুকানো থাকে** - শুধুমাত্র "Zone Based" delivery mode সিলেক্ট করলে দেখায়
2. **Label এবং Amount আলাদা আলাদা** - Inside এবং Outside এর জন্য ৪টা আলাদা input, যা confusing
3. **Preview sync issue** - Zone settings পরিবর্তন হলে preview তে তাৎক্ষণিক দেখায় না সবসময়
4. **Save confirmation নেই** - পরিবর্তন করার পর কোন visual feedback নেই

---

## প্রস্তাবিত সমাধান

### 1. Zone Settings UI উন্নতি

Zone settings কে আরও সুন্দর এবং intuitive করা হবে - প্রতিটা zone এর জন্য label এবং amount একসাথে একটা card এ থাকবে:

```text
┌─────────────────────────────────────────────────────────────────┐
│  📍 Zone Settings                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Zone 1: Inside City                                     │   │
│  │  ┌────────────────────────────┐ ┌─────────────────────┐ │   │
│  │  │ Label: ঢাকার মধ্যে________│ │ ৳ 60               │ │   │
│  │  └────────────────────────────┘ └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Zone 2: Outside City                                    │   │
│  │  ┌────────────────────────────┐ ┌─────────────────────┐ │   │
│  │  │ Label: ঢাকার বাহিরে_______│ │ ৳ 120              │ │   │
│  │  └────────────────────────────┘ └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Inline Label + Amount Edit

প্রতিটা zone এ label এবং amount পাশাপাশি থাকবে, একটা row তে:

| Component | Description |
|-----------|-------------|
| Zone Card | Label + Amount একসাথে একটা card এ |
| Inline Edit | Click করলেই edit করা যাবে |
| Real-time Preview | পরিবর্তন করলেই preview তে দেখাবে |

### 3. Save Confirmation Badge

Save করার পর একটা success indicator দেখাবে:

```text
[✓ Saved] - 2 seconds ago
```

---

## Technical Implementation

### CheckoutSettingsPanel.tsx পরিবর্তন

```typescript
{/* Zone-Based Delivery Settings - Improved UI */}
{deliveryMode === 'zoned' && (
  <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
    <div className="flex items-center gap-2 text-sm font-medium">
      <MapPin className="h-4 w-4" />
      Zone Settings
    </div>
    
    {/* Zone 1: Inside City - Combined Label + Amount */}
    <div className="p-3 rounded-lg border bg-background space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold">1</span>
        Inside City Zone
      </div>
      <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
        <Input
          value={insideCityLabel}
          onChange={(e) => setInsideCityLabel(e.target.value)}
          placeholder="ঢাকার মধ্যে"
          className="text-sm"
        />
        <div className="flex items-center gap-1 bg-muted rounded px-2 py-1.5">
          <span className="text-xs text-muted-foreground">{currencySymbol}</span>
          <Input
            type="number"
            min="0"
            value={insideCityAmount}
            onChange={(e) => setInsideCityAmount(e.target.value)}
            className="w-20 text-sm h-8 border-0 bg-transparent p-0 text-right font-digit"
            placeholder="60"
          />
        </div>
      </div>
    </div>
    
    {/* Zone 2: Outside City - Combined Label + Amount */}
    <div className="p-3 rounded-lg border bg-background space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold">2</span>
        Outside City Zone
      </div>
      <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
        <Input
          value={outsideCityLabel}
          onChange={(e) => setOutsideCityLabel(e.target.value)}
          placeholder="ঢাকার বাহিরে"
          className="text-sm"
        />
        <div className="flex items-center gap-1 bg-muted rounded px-2 py-1.5">
          <span className="text-xs text-muted-foreground">{currencySymbol}</span>
          <Input
            type="number"
            min="0"
            value={outsideCityAmount}
            onChange={(e) => setOutsideCityAmount(e.target.value)}
            className="w-20 text-sm h-8 border-0 bg-transparent p-0 text-right font-digit"
            placeholder="120"
          />
        </div>
      </div>
    </div>
  </div>
)}
```

### Save Success Indicator

```typescript
const [lastSaved, setLastSaved] = useState<Date | null>(null);

// In handleSave success:
onSuccess: () => {
  setLastSaved(new Date());
  // ...existing code
}

// In UI near Save button:
{lastSaved && (
  <span className="text-xs text-green-600 flex items-center gap-1">
    <Check className="h-3 w-3" />
    Saved
  </span>
)}
```

---

## Files to Edit

| File | Changes |
|------|---------|
| `src/components/admin/landing-page-editor/CheckoutSettingsPanel.tsx` | Zone settings UI improvement, inline label+amount edit, save indicator |

---

## Expected Results

Implementation এর পরে:

1. **Zone Settings সুন্দর দেখাবে** - প্রতিটা zone আলাদা card এ label এবং amount একসাথে
2. **Label edit সহজ হবে** - Direct inline editing
3. **Amount edit instant হবে** - Real-time preview update
4. **Save confirmation দেখাবে** - User কে জানাবে যে settings saved হয়েছে
5. **Visual hierarchy ভালো হবে** - Zone 1 (Inside) এবং Zone 2 (Outside) clearly distinguishable

