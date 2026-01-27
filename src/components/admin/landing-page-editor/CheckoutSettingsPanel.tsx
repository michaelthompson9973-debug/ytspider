import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Loader2, Save, ShoppingCart, Package, AlertCircle, MapPin, Check } from 'lucide-react';
import { useCheckoutSettings } from './useCheckoutSettings';
import { DeliveryMode, currencyOptions, deliveryModeOptions, defaultCheckoutSettings } from './types';

interface CheckoutSettingsPanelProps {
  landingPageId: string;
}

interface LinkedProduct {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
}

export const CheckoutSettingsPanel = React.forwardRef<HTMLDivElement, CheckoutSettingsPanelProps>(
  ({ landingPageId }, ref) => {
  const { checkoutSettings, isLoading, saveSettings, isSaving } = useCheckoutSettings(landingPageId);
  
  // Fetch linked product for this landing page
  const { data: linkedProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['linked-product', landingPageId],
    queryFn: async () => {
      // First get the landing page to find product_id
      const { data: landingPage, error: lpError } = await supabase
        .from('landing_pages')
        .select('product_id')
        .eq('id', landingPageId)
        .maybeSingle();
      
      if (lpError) throw lpError;
      if (!landingPage?.product_id) return null;

      // Then fetch the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, images')
        .eq('id', landingPage.product_id)
        .maybeSingle();
      
      if (productError) throw productError;
      return product as LinkedProduct | null;
    },
    enabled: !!landingPageId,
  });

  const [currency, setCurrency] = useState(checkoutSettings.currency);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(checkoutSettings.delivery_mode);
  const [deliveryAmount, setDeliveryAmount] = useState(checkoutSettings.delivery_amount.toString());
  const [freeOverAmount, setFreeOverAmount] = useState(
    checkoutSettings.free_over_amount?.toString() ?? ''
  );
  
  // Zone-based delivery state
  const [insideCityLabel, setInsideCityLabel] = useState(checkoutSettings.inside_city_label);
  const [insideCityAmount, setInsideCityAmount] = useState(checkoutSettings.inside_city_amount.toString());
  const [outsideCityLabel, setOutsideCityLabel] = useState(checkoutSettings.outside_city_label);
  const [outsideCityAmount, setOutsideCityAmount] = useState(checkoutSettings.outside_city_amount.toString());
  
  const [previewQty, setPreviewQty] = useState(1);
  const [previewZone, setPreviewZone] = useState<'inside' | 'outside'>('inside');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sync local state when settings load
  useEffect(() => {
    setCurrency(checkoutSettings.currency);
    setDeliveryMode(checkoutSettings.delivery_mode);
    setDeliveryAmount(checkoutSettings.delivery_amount.toString());
    setFreeOverAmount(checkoutSettings.free_over_amount?.toString() ?? '');
    setInsideCityLabel(checkoutSettings.inside_city_label);
    setInsideCityAmount(checkoutSettings.inside_city_amount.toString());
    setOutsideCityLabel(checkoutSettings.outside_city_label);
    setOutsideCityAmount(checkoutSettings.outside_city_amount.toString());
  }, [checkoutSettings]);

  const handleSave = () => {
    saveSettings({
      currency,
      delivery_mode: deliveryMode,
      delivery_amount: parseFloat(deliveryAmount) || 0,
      free_over_amount: deliveryMode === 'conditional' ? (parseFloat(freeOverAmount) || null) : null,
      inside_city_label: insideCityLabel,
      inside_city_amount: parseFloat(insideCityAmount) || 0,
      outside_city_label: outsideCityLabel,
      outside_city_amount: parseFloat(outsideCityAmount) || 0,
    });
    setLastSaved(new Date());
  };

  // Clear saved indicator after 3 seconds
  useEffect(() => {
    if (lastSaved) {
      const timer = setTimeout(() => setLastSaved(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  const currencySymbol = currencyOptions.find(c => c.value === currency)?.symbol || '৳';

  // Preview calculation based on linked product price
  const productPrice = linkedProduct?.price ? Number(linkedProduct.price) : 0;
  const previewSubtotal = productPrice * previewQty;
  
  // Calculate delivery based on mode
  const calculatePreviewDelivery = () => {
    if (deliveryMode === 'free') return 0;
    if (deliveryMode === 'flat') return parseFloat(deliveryAmount) || 0;
    if (deliveryMode === 'conditional') {
      return previewSubtotal >= (parseFloat(freeOverAmount) || 0) ? 0 : (parseFloat(deliveryAmount) || 0);
    }
    if (deliveryMode === 'zoned') {
      return previewZone === 'outside' 
        ? (parseFloat(outsideCityAmount) || 0) 
        : (parseFloat(insideCityAmount) || 0);
    }
    return 0;
  };
  
  const previewDelivery = calculatePreviewDelivery();
  const previewTotal = previewSubtotal + previewDelivery;

  if (isLoading || isLoadingProduct) {
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
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
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

        {/* Flat/Conditional Delivery Amount */}
        {(deliveryMode === 'flat' || deliveryMode === 'conditional') && (
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

        {/* Zone-Based Delivery Settings - Improved UI */}
        {deliveryMode === 'zoned' && (
          <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Zone Settings
            </div>
            
            {/* Zone 1: Inside City - Combined Label + Amount */}
            <div className="p-3 rounded-lg border bg-background space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold">1</span>
                Inside City Zone
              </div>
              <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
                <Input
                  value={insideCityLabel}
                  onChange={(e) => setInsideCityLabel(e.target.value)}
                  placeholder="ঢাকার মধ্যে"
                  className="text-sm"
                />
                <div className="flex items-center gap-1 bg-muted rounded-md px-2 py-1.5 border">
                  <span className="text-xs text-muted-foreground">{currencySymbol}</span>
                  <Input
                    type="number"
                    min="0"
                    value={insideCityAmount}
                    onChange={(e) => setInsideCityAmount(e.target.value)}
                    className="w-16 text-sm h-7 border-0 bg-transparent p-0 text-right font-digit focus-visible:ring-0"
                    placeholder="60"
                  />
                </div>
              </div>
            </div>
            
            {/* Zone 2: Outside City - Combined Label + Amount */}
            <div className="p-3 rounded-lg border bg-background space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold">2</span>
                Outside City Zone
              </div>
              <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
                <Input
                  value={outsideCityLabel}
                  onChange={(e) => setOutsideCityLabel(e.target.value)}
                  placeholder="ঢাকার বাহিরে"
                  className="text-sm"
                />
                <div className="flex items-center gap-1 bg-muted rounded-md px-2 py-1.5 border">
                  <span className="text-xs text-muted-foreground">{currencySymbol}</span>
                  <Input
                    type="number"
                    min="0"
                    value={outsideCityAmount}
                    onChange={(e) => setOutsideCityAmount(e.target.value)}
                    className="w-16 text-sm h-7 border-0 bg-transparent p-0 text-right font-digit focus-visible:ring-0"
                    placeholder="120"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Linked Product Info */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Linked Product
          </Label>
          {linkedProduct ? (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              {linkedProduct.images && linkedProduct.images.length > 0 && (
                <img 
                  src={linkedProduct.images[0]} 
                  alt={linkedProduct.name}
                  className="w-full h-24 object-cover rounded"
                />
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm truncate">{linkedProduct.name}</span>
                <span className="font-digit text-primary">
                  {currencySymbol}{Number(linkedProduct.price).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                No product linked. Link a product from the landing page settings to see pricing preview.
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Price Preview</Label>
          {linkedProduct ? (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPreviewQty(Math.max(1, previewQty - 1))}
                    disabled={previewQty <= 1}
                  >
                    -
                  </Button>
                  <span className="font-digit w-6 text-center">{previewQty}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPreviewQty(previewQty + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Zone Selection for Preview (only for zoned mode) */}
              {deliveryMode === 'zoned' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Zone:</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={previewZone === 'inside' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPreviewZone('inside')}
                    >
                      {insideCityLabel}
                    </Button>
                    <Button
                      type="button"
                      variant={previewZone === 'outside' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPreviewZone('outside')}
                    >
                      {outsideCityLabel}
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Price:</span>
                  <span>{currencySymbol}{productPrice.toLocaleString()}</span>
                </div>
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
                {deliveryMode === 'conditional' && previewSubtotal < (parseFloat(freeOverAmount) || 0) && (
                  <p className="text-xs text-muted-foreground">
                    Add {currencySymbol}{((parseFloat(freeOverAmount) || 0) - previewSubtotal).toLocaleString()} more for free delivery
                  </p>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-primary">{currencySymbol}{previewTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
              Link a product to see live price preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CheckoutSettingsPanel.displayName = 'CheckoutSettingsPanel';
