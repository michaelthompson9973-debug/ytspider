import { useState, useEffect, forwardRef, useRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, ShoppingCart, Eye, Settings, Plus, Maximize2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Section, CheckoutConfig, defaultCheckoutConfig, defaultCheckoutFields, ThemeConfig, defaultThemeConfig, CheckoutField } from './types';
import { generateCheckoutPreviewHTML, generatePreviewHTML } from './themeUtils';
import { FieldEditor } from './FieldEditor';
import { FullscreenPreviewModal } from './FullscreenPreviewModal';
import { useCheckoutSettings } from './useCheckoutSettings';

interface CheckoutEditorProps {
  section: Section | null;
  themeConfig?: ThemeConfig;
  landingPageId: string;
  onSave: (data: { id: string; name: string; config: CheckoutConfig }) => Promise<void>;
  isSaving: boolean;
}

export interface CheckoutEditorHandle {
  /** Saves if dirty. Returns true if a save was performed. */
  save: () => Promise<boolean>;
  isDirty: () => boolean;
}

export const CheckoutEditor = forwardRef<CheckoutEditorHandle, CheckoutEditorProps>(
  function CheckoutEditor({ section, themeConfig = defaultThemeConfig, landingPageId, onSave, isSaving }, ref) {
    const [name, setName] = useState('');
    const [config, setConfig] = useState<CheckoutConfig>(defaultCheckoutConfig);
    const [isDirty, setIsDirty] = useState(false);
    const [viewMode, setViewMode] = useState<'preview' | 'settings'>('preview');
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const [fullscreenSections, setFullscreenSections] = useState<Section[]>([]);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Fetch linked product
    const { data: linkedProduct } = useQuery({
      queryKey: ['linked-product', landingPageId],
      queryFn: async () => {
        const { data: lp } = await supabase
          .from('landing_pages')
          .select('product_id')
          .eq('id', landingPageId)
          .maybeSingle();
        
        if (!lp?.product_id) return null;
        
        const { data: product } = await supabase
          .from('products')
          .select('id, name, price, images')
          .eq('id', lp.product_id)
          .maybeSingle();
        
        return product;
      },
      enabled: !!landingPageId,
    });

    // Get checkout settings
    const { checkoutSettings } = useCheckoutSettings(landingPageId);

    useEffect(() => {
      if (section) {
        setName(section.name);
        const sectionConfig = section.config as CheckoutConfig;
        setConfig({
          ...defaultCheckoutConfig,
          ...sectionConfig,
          // Ensure fields array exists
          fields: sectionConfig?.fields?.length > 0 ? sectionConfig.fields : defaultCheckoutFields,
        });
        setIsDirty(false);
      }
    }, [section]);

    const handleSave = async (): Promise<boolean> => {
      if (!section) return false;
      if (!isDirty) return false;
      await onSave({ id: section.id, name, config });
      setIsDirty(false);
      return true;
    };

    useImperativeHandle(ref, () => ({
      save: handleSave,
      isDirty: () => isDirty,
    }), [handleSave, isDirty]);

    const handleFieldChange = (index: number, updatedField: CheckoutField) => {
      const newFields = [...config.fields];
      newFields[index] = updatedField;
      setConfig({ ...config, fields: newFields });
      setIsDirty(true);
    };

    const handleAddField = () => {
      const newField: CheckoutField = {
        id: `custom_${Date.now()}`,
        name: `custom_field_${config.fields.length + 1}`,
        type: 'text',
        label: 'নতুন ফিল্ড',
        placeholder: 'এখানে লিখুন',
        required: false,
        enabled: true,
      };
      setConfig({ ...config, fields: [...config.fields, newField] });
      setIsDirty(true);
    };

    const handleRemoveField = (index: number) => {
      const newFields = config.fields.filter((_, i) => i !== index);
      setConfig({ ...config, fields: newFields });
      setIsDirty(true);
    };

    // Default field IDs that can't be removed
    const defaultFieldIds = ['name', 'phone', 'address', 'city'];

    // Generate preview HTML for checkout section with actual product data
    const checkoutHtml = generateCheckoutPreviewHTML(
      config, 
      themeConfig,
      linkedProduct ? {
        name: linkedProduct.name,
        price: linkedProduct.price,
        images: linkedProduct.images,
      } : null,
      checkoutSettings ? {
        currency: checkoutSettings.currency,
        delivery_mode: checkoutSettings.delivery_mode,
        delivery_amount: checkoutSettings.delivery_amount,
        free_over_amount: checkoutSettings.free_over_amount,
      } : null
    );
    const previewHtml = generatePreviewHTML(checkoutHtml, themeConfig, window.location.origin);

    if (!section) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
          <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm text-center">
            Select a checkout section to configure
          </p>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b">
          <div className="flex-1 space-y-1">
            <Label htmlFor="section-name" className="text-xs text-muted-foreground">
              Section Name
            </Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Section name"
              className="h-9"
            />
          </div>
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving || !isDirty}
            size="sm"
            className="mt-5"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('preview')}
              className="h-7 px-2 text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview
            </Button>
            <Button
              variant={viewMode === 'settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('settings')}
              className="h-7 px-2 text-xs"
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              Settings
            </Button>
          </div>
          {viewMode === 'preview' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Create a fake section array with checkout section for fullscreen preview
                const checkoutSection: Section = {
                  id: section.id,
                  landing_page_id: landingPageId,
                  name: name,
                  type: 'checkout',
                  html: '',
                  sort_order: 0,
                  created_at: '',
                  config: config,
                };
                setFullscreenSections([checkoutSection]);
                setFullscreenOpen(true);
              }}
              className="h-7 px-2"
              title="Expand to fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {viewMode === 'preview' ? (
            <div className="h-full border rounded-md bg-background overflow-hidden">
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="Checkout Preview"
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto space-y-4 pr-1">
              {/* Basic Settings */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="checkout-title" className="text-sm font-medium">
                    Form Title
                  </Label>
                  <Input
                    id="checkout-title"
                    value={config.title}
                    onChange={(e) => {
                      setConfig({ ...config, title: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="অর্ডার করুন"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkout-cta" className="text-sm font-medium">
                    Submit Button Text
                  </Label>
                  <Input
                    id="checkout-cta"
                    value={config.ctaText}
                    onChange={(e) => {
                      setConfig({ ...config, ctaText: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="অর্ডার সম্পন্ন করুন"
                  />
                </div>

                <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label htmlFor="checkout-enabled" className="text-sm font-medium">
                      Enable Checkout
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When disabled, the checkout form won't appear
                    </p>
                  </div>
                  <Switch
                    id="checkout-enabled"
                    checked={config.enabled}
                    onCheckedChange={(checked) => {
                      setConfig({ ...config, enabled: checked });
                      setIsDirty(true);
                    }}
                  />
                </div>
              </div>

              {/* Form Fields Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Form Fields</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddField}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Field
                  </Button>
                </div>

                <div className="space-y-2">
                  {config.fields.map((field, index) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      onChange={(updatedField) => handleFieldChange(index, updatedField)}
                      onRemove={!defaultFieldIds.includes(field.id) ? () => handleRemoveField(index) : undefined}
                      isDefault={defaultFieldIds.includes(field.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Linked Product Info */}
              {linkedProduct && (
                <div className="p-4 rounded-lg border border-dashed bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Linked Product</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {linkedProduct.images?.[0] && (
                      <img 
                        src={linkedProduct.images[0]} 
                        alt={linkedProduct.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium">{linkedProduct.name}</p>
                      <p className="text-sm text-primary font-digit">
                        ৳{linkedProduct.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Sticky Save Button */}
        {isDirty && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
            <Button
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="w-full shadow-lg"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}

        {/* Fullscreen Preview Modal */}
        <FullscreenPreviewModal
          open={fullscreenOpen}
          onOpenChange={setFullscreenOpen}
          sections={fullscreenSections}
          themeConfig={themeConfig}
          landingPageId={landingPageId}
        />
      </div>
    );
  }
);
