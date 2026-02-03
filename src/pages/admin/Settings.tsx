import { RotateCcw, Palette } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAdminTheme, ThemePreset } from '@/contexts/AdminThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemePresetCard, ColorPicker, AppearanceToggle, LanguageToggle } from '@/components/admin/settings';
import { toast } from 'sonner';

type PresetKey = Exclude<ThemePreset, 'custom'>;

export default function Settings() {
  const { theme, setPreset, setMode, setCustomColor, resetToDefaults } = useAdminTheme();
  const { t } = useLanguage();

  const presetInfo: { preset: PresetKey; nameKey: string; descKey: string }[] = [
    { preset: 'default', nameKey: 'themes.default', descKey: 'themes.defaultDesc' },
    { preset: 'ocean', nameKey: 'themes.ocean', descKey: 'themes.oceanDesc' },
    { preset: 'forest', nameKey: 'themes.forest', descKey: 'themes.forestDesc' },
    { preset: 'sunset', nameKey: 'themes.sunset', descKey: 'themes.sunsetDesc' },
    { preset: 'slate', nameKey: 'themes.slate', descKey: 'themes.slateDesc' },
  ];

  const handleReset = () => {
    resetToDefaults();
    toast.success(t('settings.themeResetSuccess'));
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            {t('settings.appearance')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('settings.appearanceDescription')}
          </p>
        </div>

        {/* Language Toggle */}
        <Card className="admin-transition">
          <CardHeader>
            <CardTitle className="text-lg">{t('settings.language')}</CardTitle>
            <CardDescription>
              {t('settings.languageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageToggle />
          </CardContent>
        </Card>

        {/* Theme Presets */}
        <Card className="admin-transition">
          <CardHeader>
            <CardTitle className="text-lg">{t('settings.chooseTheme')}</CardTitle>
            <CardDescription>
              {t('settings.chooseThemeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {presetInfo.map((info) => (
                <ThemePresetCard
                  key={info.preset}
                  preset={info.preset}
                  name={t(info.nameKey)}
                  description={t(info.descKey)}
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
            <CardTitle className="text-lg">{t('settings.customColors')}</CardTitle>
            <CardDescription>
              {t('settings.customColorsDescription')}
              {theme.preset === 'custom' && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {t('settings.customModeActive')}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorPicker
              label={t('settings.primaryColor')}
              value={theme.colors.primary}
              onChange={(v) => setCustomColor('primary', v)}
            />
            <ColorPicker
              label={t('settings.sidebarBackground')}
              value={theme.colors.sidebarBg}
              onChange={(v) => setCustomColor('sidebarBg', v)}
            />
            <ColorPicker
              label={t('settings.accentColor')}
              value={theme.colors.accent}
              onChange={(v) => setCustomColor('accent', v)}
            />
          </CardContent>
        </Card>

        {/* Appearance Mode */}
        <Card className="admin-transition">
          <CardHeader>
            <CardTitle className="text-lg">{t('settings.appearanceMode')}</CardTitle>
            <CardDescription>
              {t('settings.appearanceModeDescription')}
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
            {t('settings.resetDefaults')}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
