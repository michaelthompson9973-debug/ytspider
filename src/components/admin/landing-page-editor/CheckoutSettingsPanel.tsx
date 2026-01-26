import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, ShoppingCart } from 'lucide-react';
import { useCheckoutSettings } from './useCheckoutSettings';
import { DeliveryMode, currencyOptions, deliveryModeOptions } from './types';

interface CheckoutSettingsPanelProps {
  landingPageId: string;
}

export function CheckoutSettingsPanel({ landingPageId }: CheckoutSettingsPanelProps) {
  const { checkoutSettings, isLoading, saveSettings, isSaving } = useCheckoutSettings(landingPageId);
  
  const [currency, setCurrency] = useState(checkoutSettings.currency);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(checkoutSettings.delivery_mode);
  const [deliveryAmount, setDeliveryAmount] = useState(checkoutSettings.delivery_amount.toString());
  const [freeOverAmount, setFreeOverAmount] = useState(
    checkoutSettings.free_over_amount?.toString() ?? ''
  );

  // Sync local state when settings load
  useEffect(() => {
    setCurrency(checkoutSettings.currency);
    setDeliveryMode(checkoutSettings.delivery_mode);
    setDeliveryAmount(checkoutSettings.delivery_amount.toString());
    setFreeOverAmount(checkoutSettings.free_over_amount?.toString() ?? '');
  }, [checkoutSettings]);

  const handleSave = () => {
    saveSettings({
      currency,
      delivery_mode: deliveryMode,
      delivery_amount: parseFloat(deliveryAmount) || 0,
      free_over_amount: deliveryMode === 'conditional' ? (parseFloat(freeOverAmount) || null) : null,
    });
  };

  const currencySymbol = currencyOptions.find(c => c.value === currency)?.symbol || '৳';

  // Preview calculation
  const previewSubtotal = 500;
  const previewDelivery = deliveryMode === 'free' 
    ? 0 
    : deliveryMode === 'conditional' && previewSubtotal >= (parseFloat(freeOverAmount) || 0)
      ? 0
      : parseFloat(deliveryAmount) || 0;
  const previewTotal = previewSubtotal + previewDelivery;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Checkout Settings
        </h3>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Currency */}
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Delivery Mode */}
        <div className="space-y-2">
          <Label>Delivery Mode</Label>
          <Select value={deliveryMode} onValueChange={(v) => setDeliveryMode(v as DeliveryMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {deliveryModeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Delivery Amount */}
        {deliveryMode !== 'free' && (
          <div className="space-y-2">
            <Label>Delivery Amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-6">{currencySymbol}</span>
              <Input
                type="number"
                min="0"
                step="1"
                value={deliveryAmount}
                onChange={(e) => setDeliveryAmount(e.target.value)}
                placeholder="60"
              />
            </div>
          </div>
        )}

        {/* Free Over Amount */}
        {deliveryMode === 'conditional' && (
          <div className="space-y-2">
            <Label>Free Shipping Above</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-6">{currencySymbol}</span>
              <Input
                type="number"
                min="0"
                step="1"
                value={freeOverAmount}
                onChange={(e) => setFreeOverAmount(e.target.value)}
                placeholder="500"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Orders above this amount get free delivery
            </p>
          </div>
        )}

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview (Sample: {currencySymbol}500)</Label>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{currencySymbol}{previewSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery:</span>
              <span className={previewDelivery === 0 ? 'text-green-600' : ''}>
                {previewDelivery === 0 ? 'Free!' : `${currencySymbol}${previewDelivery.toLocaleString()}`}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-primary">{currencySymbol}{previewTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
