import { RotateCcw, Palette } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAdminTheme, ThemePreset } from '@/contexts/AdminThemeContext';
import { ThemePresetCard, ColorPicker, AppearanceToggle } from '@/components/admin/settings';
import { toast } from 'sonner';

const presetInfo: { preset: Exclude<ThemePreset, 'custom'>; name: string; description: string }[] = [
  { preset: 'default', name: 'Default', description: 'Professional blue-gray' },
  { preset: 'ocean', name: 'Ocean', description: 'Calming teal tones' },
  { preset: 'forest', name: 'Forest', description: 'Fresh green nature' },
  { preset: 'sunset', name: 'Sunset', description: 'Warm orange energy' },
  { preset: 'slate', name: 'Slate', description: 'Neutral minimal' },
];

export default function Settings() {
  const { theme, setPreset, setMode, setCustomColor, resetToDefaults } = useAdminTheme();

  const handleReset = () => {
    resetToDefaults();
    toast.success('Theme reset to defaults');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Appearance Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize the look and feel of your admin panel
          </p>
        </div>

        {/* Theme Presets */}
        <Card className="admin-transition">
          <CardHeader>
            <CardTitle className="text-lg">Choose a Theme</CardTitle>
            <CardDescription>
              Select a pre-built color scheme or customize your own
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {presetInfo.map((info) => (
                <ThemePresetCard
                  key={info.preset}
                  preset={info.preset}
                  name={info.name}
                  description={info.description}
                  isSelected={theme.preset === info.preset}
                  onSelect={() => setPreset(info.preset)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Colors */}
        <Card className="admin-transition">
          <CardHeader>
            <CardTitle className="text-lg">Custom Colors</CardTitle>
            <CardDescription>
              Fine-tune individual colors to match your brand
              {theme.preset === 'custom' && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Custom mode active
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorPicker
              label="Primary Color"
              value={theme.colors.primary}
              onChange={(v) => setCustomColor('primary', v)}
            />
            <ColorPicker
              label="Sidebar Background"
              value={theme.colors.sidebarBg}
              onChange={(v) => setCustomColor('sidebarBg', v)}
            />
            <ColorPicker
              label="Accent Color"
              value={theme.colors.accent}
              onChange={(v) => setCustomColor('accent', v)}
            />
          </CardContent>
        </Card>

        {/* Appearance Mode */}
        <Card className="admin-transition">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>
              Choose between light, dark, or system-based appearance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppearanceToggle value={theme.mode} onChange={setMode} />
          </CardContent>
        </Card>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-6">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
