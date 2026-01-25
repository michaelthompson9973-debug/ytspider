import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeConfig, fontFamilies, buttonStyles, defaultThemeConfig } from './types';

interface ThemePanelProps {
  themeConfig: ThemeConfig;
  onSave: (config: ThemeConfig) => void;
  isSaving: boolean;
}

export function ThemePanel({ themeConfig, onSave, isSaving }: ThemePanelProps) {
  const [config, setConfig] = useState<ThemeConfig>(defaultThemeConfig);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setConfig(themeConfig);
    setIsDirty(false);
  }, [themeConfig]);

  const updateConfig = (key: keyof ThemeConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(config);
    setIsDirty(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Theme Settings</h3>
        <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="space-y-4">
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
              className="flex-1"
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
              className="flex-1"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Font Family</Label>
          <Select
            value={config.fontFamily}
            onValueChange={(val) => updateConfig('fontFamily', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Button Style</Label>
          <Select
            value={config.buttonStyle}
            onValueChange={(val) => updateConfig('buttonStyle', val as ThemeConfig['buttonStyle'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {buttonStyles.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="border-radius" className="text-xs">Border Radius</Label>
          <Input
            id="border-radius"
            value={config.borderRadius}
            onChange={(e) => updateConfig('borderRadius', e.target.value)}
            placeholder="8px"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="container-width" className="text-xs">Container Width</Label>
          <Input
            id="container-width"
            value={config.containerWidth}
            onChange={(e) => updateConfig('containerWidth', e.target.value)}
            placeholder="1200px"
          />
        </div>
      </div>
    </div>
  );
}
