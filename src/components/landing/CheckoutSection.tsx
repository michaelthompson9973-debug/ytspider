import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { CheckoutConfig, DeliveryMode, currencyOptions, defaultCheckoutFields, CheckoutField, defaultCheckoutSettings } from '@/components/admin/landing-page-editor/types';
import { Minus, Plus } from 'lucide-react';
import { ProductImageGallery } from './ProductImageGallery';

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[];
}

interface CheckoutSettings {
  currency: string;
  delivery_mode: DeliveryMode;
  delivery_amount: number;
  free_over_amount: number | null;
  inside_city_label: string;
  inside_city_amount: number;
  outside_city_label: string;
  outside_city_amount: number;
}

interface CheckoutSectionProps {
  config: CheckoutConfig;
  product: Product | null;
  landingPageId: string;
  landingPageSlug: string;
  onOrderSuccess?: (orderId: string) => void;
}

const defaultSettings: CheckoutSettings = {
  currency: 'BDT',
  delivery_mode: 'flat',
  delivery_amount: 60,
  free_over_amount: null,
  inside_city_label: defaultCheckoutSettings.inside_city_label,
  inside_city_amount: defaultCheckoutSettings.inside_city_amount,
  outside_city_label: defaultCheckoutSettings.outside_city_label,
  outside_city_amount: defaultCheckoutSettings.outside_city_amount,
};

const pushDataLayer = (event: string, data?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
  }
};

function calculateTotals(
  quantity: number,
  unitPrice: number,
  settings: CheckoutSettings,
  selectedZone?: 'inside' | 'outside'
): { subtotal: number; delivery: number; total: number } {
  const subtotal = quantity * unitPrice;
  let delivery = 0;

  switch (settings.delivery_mode) {
    case 'free':
      delivery = 0;
      break;
    case 'flat':
      delivery = settings.delivery_amount;
      break;
    case 'conditional':
      delivery = subtotal >= (settings.free_over_amount || 0)
        ? 0
        : settings.delivery_amount;
      break;
    case 'zoned':
      delivery = selectedZone === 'outside'
        ? settings.outside_city_amount
        : settings.inside_city_amount;
      break;
  }

  return { subtotal, delivery, total: subtotal + delivery };
}

export function CheckoutSection({
  config,
  product,
  landingPageId,
  landingPageSlug,
  onOrderSuccess,
}: CheckoutSectionProps) {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedZone, setSelectedZone] = useState<'inside' | 'outside'>('inside');
  
  // Get fields from config or use defaults
  const fields = config.fields?.length > 0 ? config.fields : defaultCheckoutFields;
  const enabledFields = fields.filter(f => f.enabled);
  
  // Initialize form state from enabled fields
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    enabledFields.forEach(field => {
      initial[field.name] = '';
    });
    return initial;
  });

  // Fetch checkout settings for this landing page
  const { data: checkoutSettingsData } = useQuery({
    queryKey: ['checkout-settings-public', landingPageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_checkout_settings')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      return {
        currency: data.currency,
        delivery_mode: data.delivery_mode as DeliveryMode,
        delivery_amount: Number(data.delivery_amount),
        free_over_amount: data.free_over_amount ? Number(data.free_over_amount) : null,
        inside_city_label: data.inside_city_label ?? defaultSettings.inside_city_label,
        inside_city_amount: Number(data.inside_city_amount ?? defaultSettings.inside_city_amount),
        outside_city_label: data.outside_city_label ?? defaultSettings.outside_city_label,
        outside_city_amount: Number(data.outside_city_amount ?? defaultSettings.outside_city_amount),
      } as CheckoutSettings;
    },
    enabled: !!landingPageId,
  });

  const settings = checkoutSettingsData ?? defaultSettings;
  const currencySymbol = currencyOptions.find(c => c.value === settings.currency)?.symbol || '৳';

  // Calculate totals
  const unitPrice = product?.price || 0;
  const { subtotal, delivery, total } = useMemo(
    () => calculateTotals(quantity, unitPrice, settings, selectedZone),
    [quantity, unitPrice, settings, selectedZone]
  );

  if (!config.enabled) {
    return null;
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity((q) => Math.max(1, q + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Dynamic validation based on enabled required fields
    const requiredFields = enabledFields.filter(f => f.required);
    for (const field of requiredFields) {
      const value = form[field.name]?.trim();
      if (!value || value.length < 2) {
        toast({
          title: 'ফর্ম পূরণ করুন',
          description: `${field.label} দিতে হবে`,
          variant: 'destructive',
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Fire lead event
      pushDataLayer('lead', {
        event_id: eventId,
        customer_city: form.customer_city,
      });

      const { data: orderData, error } = await supabase.from('orders').insert({
        product_id: product?.id,
        landing_page_id: landingPageId,
        customer_name: form.customer_name || '',
        customer_phone: form.customer_phone || '',
        customer_address: form.customer_address || '',
        customer_city: form.customer_city || '',
        utm_source: searchParams.get('utm_source'),
        utm_medium: searchParams.get('utm_medium'),
        utm_campaign: searchParams.get('utm_campaign'),
        utm_term: searchParams.get('utm_term'),
        utm_content: searchParams.get('utm_content'),
        event_id: eventId,
        quantity,
        unit_price: unitPrice,
        subtotal,
        delivery_charge: delivery,
        total,
        currency: settings.currency,
      }).select('id').single();

      if (error) throw error;

      // Push purchase event for GTM with new fields
      pushDataLayer('purchase', {
        transaction_id: eventId,
        value: total,
        subtotal,
        shipping: delivery,
        currency: settings.currency,
        items: [{
          item_id: product?.id,
          item_name: product?.name,
          price: unitPrice,
          quantity,
        }],
      });

      // Call server-side tracking
      try {
        await supabase.functions.invoke('track-conversion', {
          body: {
            eventId,
            orderId: orderData?.id,
            productName: product?.name,
            productPrice: unitPrice,
            customerCity: form.customer_city,
            landingPageSlug,
            quantity,
            subtotal,
            shipping: delivery,
            total,
            currency: settings.currency,
          },
        });
      } catch (trackError) {
        console.error('Tracking error:', trackError);
      }

      // Trigger webhooks for new order
      try {
        await supabase.functions.invoke('trigger-order-webhooks', {
          body: { orderId: orderData?.id },
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }

      setOrderSuccess(true);
      onOrderSuccess?.(orderData?.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({
        title: 'অর্ডার সফল হয়নি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <section className="py-12 px-4" id="checkout">
        <div className="container max-w-2xl mx-auto">
          <div className="rounded-theme bg-primary/5 border border-primary/20 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl text-primary mb-2">ধন্যবাদ!</h3>
            <p className="font-body text-muted-foreground mb-4">
              আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব।
            </p>
            <div className="font-body text-sm">
              <p className="font-medium">{form.customer_name}</p>
              <p className="text-muted-foreground">{form.customer_phone}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Helper to render appropriate input based on field type
  const renderField = (field: CheckoutField) => {
    const commonProps = {
      id: `checkout-${field.id}`,
      value: form[field.name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        setForm({ ...form, [field.name]: e.target.value }),
      className: "font-body w-full rounded-theme border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary",
      placeholder: field.placeholder,
      required: field.required,
    };

    if (field.type === 'textarea') {
      return <textarea {...commonProps} rows={3} />;
    }

    return <input {...commonProps} type={field.type} />;
  };

  return (
    <section className="py-12 px-4 bg-muted/50" id="checkout">
      <div className="container max-w-4xl mx-auto">
        <div className="rounded-theme bg-background border shadow-sm p-6">
          <h2 className="font-heading text-2xl text-primary mb-6 text-center">
            {config.title}
          </h2>

          {/* 2-Column Grid: Product Info (Left) + Form (Right) on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Product Info, Gallery, Quantity, Price Summary */}
            {product && (
              <div className="p-4 rounded-theme bg-muted/50 border space-y-4">
                {/* Product Image Gallery */}
                {product.images && product.images.length > 0 && (
                  <ProductImageGallery 
                    images={product.images} 
                    productName={product.name} 
                  />
                )}

                <div className="flex justify-between items-start">
                  <p className="font-body text-lg font-medium">{product.name}</p>
                  <p className="font-digit text-lg text-primary font-bold">
                    {currencySymbol}{Number(unitPrice).toLocaleString('bn-BD')}
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-muted-foreground">পরিমাণ:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-theme border flex items-center justify-center hover:bg-muted disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-digit text-lg w-8 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      className="w-8 h-8 rounded-theme border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Zone Selection for Zoned Delivery */}
                {settings.delivery_mode === 'zoned' && (
                  <div className="space-y-2">
                    <span className="font-body text-sm text-muted-foreground block">ডেলিভারি এলাকা:</span>
                    <div className="flex flex-col gap-2">
                      <label 
                        className={`flex items-center justify-between p-3 rounded-theme border cursor-pointer transition-colors ${
                          selectedZone === 'inside' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="delivery-zone"
                            value="inside"
                            checked={selectedZone === 'inside'}
                            onChange={() => setSelectedZone('inside')}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="font-body">{settings.inside_city_label}</span>
                        </div>
                        <span className="font-digit text-primary font-medium">
                          {currencySymbol}{settings.inside_city_amount.toLocaleString('bn-BD')}
                        </span>
                      </label>
                      <label 
                        className={`flex items-center justify-between p-3 rounded-theme border cursor-pointer transition-colors ${
                          selectedZone === 'outside' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="delivery-zone"
                            value="outside"
                            checked={selectedZone === 'outside'}
                            onChange={() => setSelectedZone('outside')}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="font-body">{settings.outside_city_label}</span>
                        </div>
                        <span className="font-digit text-primary font-medium">
                          {currencySymbol}{settings.outside_city_amount.toLocaleString('bn-BD')}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between font-body">
                    <span className="text-muted-foreground">সাবটোটাল:</span>
                    <span className="font-digit">{currencySymbol}{subtotal.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between font-body">
                    <span className="text-muted-foreground">ডেলিভারি চার্জ:</span>
                    <span className={`font-digit ${delivery === 0 ? 'text-green-600' : ''}`}>
                      {delivery === 0 ? 'ফ্রি!' : `${currencySymbol}${delivery.toLocaleString('bn-BD')}`}
                    </span>
                  </div>
                  {settings.delivery_mode === 'conditional' && subtotal < (settings.free_over_amount || 0) && (
                    <p className="text-xs text-muted-foreground">
                      {currencySymbol}{((settings.free_over_amount || 0) - subtotal).toLocaleString('bn-BD')} আরো অর্ডার করলে ডেলিভারি ফ্রি!
                    </p>
                  )}
                  <div className="flex justify-between font-body font-semibold text-base border-t pt-2">
                    <span>সর্বমোট:</span>
                    <span className="font-digit text-primary">{currencySymbol}{total.toLocaleString('bn-BD')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Right Column: Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dynamic Form Fields */}
              {enabledFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label htmlFor={`checkout-${field.id}`} className="font-body text-sm font-medium block">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="font-button w-full rounded-theme bg-primary text-primary-foreground py-3 text-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'প্রসেসিং...' : config.ctaText}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
