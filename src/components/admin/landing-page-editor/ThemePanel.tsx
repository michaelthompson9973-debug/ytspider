import { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeConfig, availableFonts, buttonStyles, defaultThemeConfig } from './types';
import { cn } from '@/lib/utils';

interface ThemePanelProps {
  themeConfig: ThemeConfig;
  onSave: (config: ThemeConfig) => void;
  isSaving: boolean;
  onChange?: (config: ThemeConfig) => void;
}

export const ThemePanel = forwardRef<HTMLDivElement, ThemePanelProps>(
  function ThemePanel({ themeConfig, onSave, isSaving, onChange }, ref) {
    const [config, setConfig] = useState<ThemeConfig>(defaultThemeConfig);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
      setConfig(themeConfig);
      setIsDirty(false);
    }, [themeConfig]);

    const updateConfig = (key: keyof ThemeConfig, value: string) => {
      const newConfig = { ...config, [key]: value };
      setConfig(newConfig);
      setIsDirty(true);
      onChange?.(newConfig);
    };

    const handleSave = () => {
      onSave(config);
      setIsDirty(false);
    };

    const handleReset = () => {
      setConfig(defaultThemeConfig);
      setIsDirty(true);
      onChange?.(defaultThemeConfig);
    };

    // Get button preview style
    const getButtonPreviewStyle = () => {
      const radius = config.buttonStyle === 'pill' 
        ? '9999px' 
        : config.buttonStyle === 'square' 
        ? '0' 
        : config.borderRadius;
      return {
        backgroundColor: config.primaryColor,
        borderRadius: radius,
        fontFamily: `'${config.buttonFont}', sans-serif`,
      };
    };

  return (
    <div ref={ref} className="h-full overflow-y-auto space-y-6 pr-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Theme Settings</h3>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleReset}
            title="Reset to defaults"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Colors Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Colors</h4>
        
        <div className="space-y-2">
          <Label htmlFor="primary-color" className="text-xs">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id="primary-color"
              value={config.primaryColor}
              onChange={(e) => updateConfig('primaryColor', e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={config.primaryColor}
              onChange={(e) => updateConfig('primaryColor', e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#3B82F6"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bg-color" className="text-xs">Background Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id="bg-color"
              value={config.backgroundColor}
              onChange={(e) => updateConfig('backgroundColor', e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={config.backgroundColor}
              onChange={(e) => updateConfig('backgroundColor', e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>

      {/* Typography Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography</h4>
        
        <div className="space-y-2">
          <Label className="text-xs">Heading Font (h1-h6)</Label>
          <Select
            value={config.headingFont}
            onValueChange={(val) => updateConfig('headingFont', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {availableFonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: `'${font.value}', sans-serif` }}>
                    {font.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Body Font (paragraphs)</Label>
          <Select
            value={config.bodyFont}
            onValueChange={(val) => updateConfig('bodyFont', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {availableFonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: `'${font.value}', sans-serif` }}>
                    {font.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Button Font</Label>
          <Select
            value={config.buttonFont}
            onValueChange={(val) => updateConfig('buttonFont', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {availableFonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: `'${font.value}', sans-serif` }}>
                    {font.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Digit Font (numbers)</Label>
          <Select
            value={config.digitFont}
            onValueChange={(val) => updateConfig('digitFont', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {availableFonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: `'${font.value}', sans-serif` }}>
                    {font.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Layout Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Layout</h4>

        <div className="space-y-2">
          <Label className="text-xs">Button Style</Label>
          <Select
            value={config.buttonStyle}
            onValueChange={(val) => updateConfig('buttonStyle', val as ThemeConfig['buttonStyle'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {buttonStyles.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Button Preview */}
          <div className="pt-2">
            <button
              style={getButtonPreviewStyle()}
              className="px-4 py-2 text-white text-sm"
            >
              Button Preview
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="border-radius" className="text-xs">Border Radius</Label>
          <Input
            id="border-radius"
            value={config.borderRadius}
            onChange={(e) => updateConfig('borderRadius', e.target.value)}
            placeholder="8px"
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="container-width" className="text-xs">Container Width</Label>
          <Input
            id="container-width"
            value={config.containerWidth}
            onChange={(e) => updateConfig('containerWidth', e.target.value)}
            placeholder="1200px"
            className="font-mono text-sm"
          />
        </div>
      </div>

      {/* Typography Preview */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</h4>
        <div 
          className="p-4 border rounded-lg space-y-3"
          style={{ backgroundColor: config.backgroundColor }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ 
              fontFamily: `'${config.headingFont}', sans-serif`,
              color: config.primaryColor 
            }}
          >
            শিরোনাম টেক্সট
          </h2>
          <p 
            className="text-sm"
            style={{ fontFamily: `'${config.bodyFont}', sans-serif` }}
          >
            এটি একটি প্যারাগ্রাফ টেক্সট যা বডি ফন্ট ব্যবহার করে।
          </p>
          <p 
            className="text-sm"
            style={{ fontFamily: `'${config.digitFont}', sans-serif` }}
          >
            ডিজিট: ১২৩৪৫৬৭৮৯০ | 1234567890
          </p>
          <button
            style={getButtonPreviewStyle()}
            className="px-4 py-2 text-white text-sm"
          >
            অর্ডার করুন
          </button>
        </div>
      </div>
    </div>
  );
});
