import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemePreset, themePresets } from '@/contexts/AdminThemeContext';

interface ThemePresetCardProps {
  preset: Exclude<ThemePreset, 'custom'>;
  name: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ThemePresetCard({
  preset,
  name,
  description,
  isSelected,
  onSelect,
}: ThemePresetCardProps) {
  const colors = themePresets[preset];

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200',
        'hover:border-primary/50 hover:shadow-md active:scale-[0.98]',
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-md scale-[1.02]'
          : 'border-border'
      )}
    >
      {/* Color Preview */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: `hsl(${colors.primary})` }}
        />
        <div
          className="w-6 h-6 rounded-full border-2 border-white shadow-sm -ml-2"
          style={{ backgroundColor: `hsl(${colors.sidebarBg})` }}
        />
        <div
          className="w-5 h-5 rounded-full border-2 border-white shadow-sm -ml-2"
          style={{ backgroundColor: `hsl(${colors.accent})` }}
        />
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Selected Checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}
