/**
 * Shop Area Page Wrappers
 * These components wrap the shared content components with ShopLayout
 * for the shop owner experience (separate from Admin area)
 */

import { useEffect } from 'react';
import { RotateCcw, Palette, Save, Undo2 } from 'lucide-react';
import { ShopLayout } from '@/components/shop';
import { ProductsContent } from '@/components/admin/products';
import { useShop } from '@/contexts/ShopContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShopGuard } from '@/components/admin/ShopGuard';
import { useAdminTheme, ThemePreset } from '@/contexts/AdminThemeContext';
import { useAdminThemePreference } from '@/hooks/useAdminThemePreference';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemePresetCard, ColorPicker, AppearanceToggle, LanguageToggle } from '@/components/admin/settings';
import { toast } from 'sonner';

// Products Page for Shop Owners - Uses shared content
export function ShopProductsPage() {
  return (
    <ShopLayout>
      <ProductsContent />
    </ShopLayout>
  );
}

// Orders Page for Shop Owners
export function ShopOrdersPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="অর্ডার" description="অর্ডার ম্যানেজমেন্ট শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Landing Pages for Shop Owners
export function ShopLandingPagesPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="ল্যান্ডিং পেজ" description="ল্যান্ডিং পেজ বিল্ডার শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Component Library for Shop Owners
export function ShopComponentLibraryPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="কম্পোনেন্ট লাইব্রেরী" description="কম্পোনেন্ট লাইব্রেরী শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Media for Shop Owners
export function ShopMediaPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="মিডিয়া" description="মিডিয়া লাইব্রেরী শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Inbox Messenger for Shop Owners
export function ShopInboxMessengerPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="মেসেঞ্জার ইনবক্স" description="মেসেঞ্জার ইন্টিগ্রেশন শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Tracking for Shop Owners
export function ShopTrackingPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="ট্র্যাকিং" description="ট্র্যাকিং সেটআপ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Courier for Shop Owners
export function ShopCourierPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="কুরিয়ার" description="কুরিয়ার ইন্টিগ্রেশন শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// AI Settings for Shop Owners
export function ShopAiPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="AI সেটিংস" description="AI অটো-রিপ্লাই সেটআপ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Team for Shop Owners
export function ShopTeamPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="টিম মেম্বার" description="টিম ম্যানেজমেন্ট শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Subscription for Shop Owners
export function ShopSubscriptionPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="সাবস্ক্রিপশন" description="বিলিং ও প্ল্যান ম্যানেজমেন্ট শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Analytics for Shop Owners
export function ShopAnalyticsPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="অ্যানালিটিক্স" description="শপ অ্যানালিটিক্স শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Security for Shop Owners
export function ShopSecurityPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="সিকিউরিটি" description="API Keys ও সিকিউরিটি সেটিংস শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Settings for Shop Owners - Full Appearance settings
export function ShopSettingsPage() {
  return (
    <ShopLayout>
      <ShopSettingsContent />
    </ShopLayout>
  );
}

// Shop Settings Content - Appearance settings reused from Admin
type PresetKey = Exclude<ThemePreset, 'custom'>;

function ShopSettingsContent() {
  const { 
    draftTheme, hasUnsavedChanges, setPreset, setMode, 
    setCustomColor, resetToDefaults, applyTheme, discardChanges 
  } = useAdminTheme();
  const { savedTheme, isLoading, saveThemeAsync, isSaving } = useAdminThemePreference();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && savedTheme) applyTheme(savedTheme);
  }, [isLoading, savedTheme, applyTheme]);

  const presetInfo: { preset: PresetKey; nameKey: string; descKey: string }[] = [
    { preset: 'default', nameKey: 'themes.default', descKey: 'themes.defaultDesc' },
    { preset: 'ocean', nameKey: 'themes.ocean', descKey: 'themes.oceanDesc' },
    { preset: 'forest', nameKey: 'themes.forest', descKey: 'themes.forestDesc' },
    { preset: 'sunset', nameKey: 'themes.sunset', descKey: 'themes.sunsetDesc' },
    { preset: 'slate', nameKey: 'themes.slate', descKey: 'themes.slateDesc' },
  ];

  const handleSave = async () => {
    try {
      await saveThemeAsync(draftTheme);
      applyTheme(draftTheme);
      toast.success(t('settings.themeSaved'));
    } catch { toast.error(t('settings.themeSaveError')); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />{t('settings.appearance')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('settings.appearanceDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button variant="outline" onClick={() => { discardChanges(); toast.info(t('settings.changesDiscarded')); }} className="gap-2">
              <Undo2 className="h-4 w-4" />{t('settings.discard')}
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasUnsavedChanges || isSaving} className="gap-2">
            <Save className="h-4 w-4" />{isSaving ? t('settings.saving') : t('settings.saveTheme')}
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm text-warning-foreground">
          {t('settings.unsavedChanges')}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.language')}</CardTitle>
          <CardDescription>{t('settings.languageDescription')}</CardDescription>
        </CardHeader>
        <CardContent><LanguageToggle /></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.chooseTheme')}</CardTitle>
          <CardDescription>{t('settings.chooseThemeDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {presetInfo.map((info) => (
              <ThemePresetCard key={info.preset} preset={info.preset} name={t(info.nameKey)} description={t(info.descKey)} isSelected={draftTheme.preset === info.preset} onSelect={() => setPreset(info.preset)} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.customColors')}</CardTitle>
          <CardDescription>
            {t('settings.customColorsDescription')}
            {draftTheme.preset === 'custom' && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t('settings.customModeActive')}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorPicker label={t('settings.primaryColor')} value={draftTheme.colors.primary} onChange={(v) => setCustomColor('primary', v)} />
          <ColorPicker label={t('settings.sidebarBackground')} value={draftTheme.colors.sidebarBg} onChange={(v) => setCustomColor('sidebarBg', v)} />
          <ColorPicker label={t('settings.accentColor')} value={draftTheme.colors.accent} onChange={(v) => setCustomColor('accent', v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.appearanceMode')}</CardTitle>
          <CardDescription>{t('settings.appearanceModeDescription')}</CardDescription>
        </CardHeader>
        <CardContent><AppearanceToggle value={draftTheme.mode} onChange={setMode} /></CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col sm:flex-row gap-3 pb-6">
        <Button variant="outline" onClick={() => { resetToDefaults(); toast.info(t('settings.themeReset')); }} className="gap-2">
          <RotateCcw className="h-4 w-4" />{t('settings.resetDefaults')}
        </Button>
      </div>
    </div>
  );
}

// Placeholder component for pages not yet implemented
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  const { currentShop } = useShop();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{currentShop?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
