import { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, ShoppingCart } from 'lucide-react';
import { Section, CheckoutConfig, defaultCheckoutConfig } from './types';

interface CheckoutEditorProps {
  section: Section | null;
  onSave: (data: { id: string; name: string; config: CheckoutConfig }) => void;
  isSaving: boolean;
}

export const CheckoutEditor = forwardRef<HTMLDivElement, CheckoutEditorProps>(
  function CheckoutEditor({ section, onSave, isSaving }, ref) {
    const [name, setName] = useState('');
    const [config, setConfig] = useState<CheckoutConfig>(defaultCheckoutConfig);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
      if (section) {
        setName(section.name);
        setConfig((section.config as CheckoutConfig) ?? defaultCheckoutConfig);
        setIsDirty(false);
      }
    }, [section]);

    const handleSave = () => {
      if (!section) return;
      onSave({ id: section.id, name, config });
      setIsDirty(false);
    };

    if (!section) {
      return (
        <div ref={ref} className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
          <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm text-center">
            Select a checkout section to configure
          </p>
        </div>
      );
    }

    return (
      <div ref={ref} className="h-full flex flex-col">
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
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            size="sm"
            className="mt-5"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Checkout Config Form */}
        <div className="flex-1 space-y-6 overflow-y-auto">
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
            <p className="text-xs text-muted-foreground">
              This title appears above the order form
            </p>
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
            <p className="text-xs text-muted-foreground">
              Text displayed on the order submit button
            </p>
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

          {/* Preview Info */}
          <div className="p-4 rounded-lg border border-dashed bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Checkout Preview</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The checkout form will display product info, quantity selector, and order fields 
              (name, phone, address, city) with theme-integrated styling.
            </p>
          </div>
        </div>

        {/* Mobile Sticky Save Button */}
        {isDirty && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full shadow-lg"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    );
  }
);
