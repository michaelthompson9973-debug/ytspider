import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  label: string;
  value: string; // HSL format: "222.2 47.4% 11.2%"
  onChange: (value: string) => void;
}

// Convert HSL string to hex
function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map((v) => parseFloat(v.replace('%', '')));
  const sNorm = s / 100;
  const lNorm = l / 100;

  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Convert hex to HSL string
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hexValue, setHexValue] = useState(() => hslToHex(value));

  useEffect(() => {
    setHexValue(hslToHex(value));
  }, [value]);

  const handleChange = (hex: string) => {
    setHexValue(hex);
    onChange(hexToHsl(hex));
  };

  return (
    <div className="flex items-center gap-3">
      <Label className="w-36 text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2 flex-1">
        <div className="relative">
          <input
            type="color"
            value={hexValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer appearance-none bg-transparent"
            style={{ backgroundColor: hexValue }}
          />
        </div>
        <Input
          value={hexValue.toUpperCase()}
          onChange={(e) => handleChange(e.target.value)}
          className="w-28 font-mono text-sm uppercase"
          maxLength={7}
        />
        <div
          className="w-16 h-10 rounded-lg border shadow-sm"
          style={{ backgroundColor: hexValue }}
        />
      </div>
    </div>
  );
}
