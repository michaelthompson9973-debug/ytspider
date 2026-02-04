import { useEffect } from 'react';
import { RotateCcw, Palette, Save, Undo2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAdminTheme, ThemePreset } from '@/contexts/AdminThemeContext';
import { useAdminThemePreference } from '@/hooks/useAdminThemePreference';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemePresetCard, ColorPicker, AppearanceToggle, LanguageToggle } from '@/components/admin/settings';
import { toast } from 'sonner';

type PresetKey = Exclude<ThemePreset, 'custom'>;

export default function Settings() {
  const { 
    draftTheme, 
    hasUnsavedChanges, 
    setPreset, 
    setMode, 
    setCustomColor, 
    resetToDefaults, 
    applyTheme,
    discardChanges 
  } = useAdminTheme();
  const { savedTheme, isLoading, saveThemeAsync, isSaving } = useAdminThemePreference();
  const { t } = useLanguage();

  // Load saved theme from database on mount
  useEffect(() => {
    if (!isLoading && savedTheme) {
      applyTheme(savedTheme);
    }
  }, [isLoading, savedTheme, applyTheme]);

  const presetInfo: { preset: PresetKey; nameKey: string; descKey: string }[] = [
    { preset: 'default', nameKey: 'themes.default', descKey: 'themes.defaultDesc' },
    { preset: 'ocean', nameKey: 'themes.ocean', descKey: 'themes.oceanDesc' },
    { preset: 'forest', nameKey: 'themes.forest', descKey: 'themes.forestDesc' },
    { preset: 'sunset', nameKey: 'themes.sunset', descKey: 'themes.sunsetDesc' },
    { preset: 'slate', nameKey: 'themes.slate', descKey: 'themes.slateDesc' },
  ];

  const handleReset = () => {
    resetToDefaults();
    toast.info(t('settings.themeReset'));
  };

  const handleDiscard = () => {
    discardChanges();
    toast.info(t('settings.changesDiscarded'));
  };

  const handleSave = async () => {
    try {
      await saveThemeAsync(draftTheme);
      applyTheme(draftTheme);
      toast.success(t('settings.themeSaved'));
    } catch (error) {
      toast.error(t('settings.themeSaveError'));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6" />
              {t('settings.appearance')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('settings.appearanceDescription')}
            </p>
          </div>
          
          {/* Save/Discard Buttons */}
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Button 
                variant="outline" 
                onClick={handleDiscard}
                className="gap-2"
              >
                <Undo2 className="h-4 w-4" />
                {t('settings.discard')}
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={!hasUnsavedChanges || isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? t('settings.saving') : t('settings.saveTheme')}
            </Button>
          </div>
        </div>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm text-warning-foreground">
            {t('settings.unsavedChanges')}
          </div>
        )}

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
                  isSelected={draftTheme.preset === info.preset}
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
              {draftTheme.preset === 'custom' && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {t('settings.customModeActive')}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorPicker
              label={t('settings.primaryColor')}
              value={draftTheme.colors.primary}
              onChange={(v) => setCustomColor('primary', v)}
            />
            <ColorPicker
              label={t('settings.sidebarBackground')}
              value={draftTheme.colors.sidebarBg}
              onChange={(v) => setCustomColor('sidebarBg', v)}
            />
            <ColorPicker
              label={t('settings.accentColor')}
              value={draftTheme.colors.accent}
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
            <AppearanceToggle value={draftTheme.mode} onChange={setMode} />
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
