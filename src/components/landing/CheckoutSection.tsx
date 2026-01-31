import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { CheckoutConfig, DeliveryMode, currencyOptions, defaultCheckoutFields, CheckoutField, defaultCheckoutSettings } from '@/components/admin/landing-page-editor/types';
import { ProductList, CartItem } from './ProductList';

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[] | null;
  defaultQuantity?: number;
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
  products: Product[];
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

// GA4/Google Ads Enhanced dataLayer helper
const pushDataLayer = (event: string, data?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    
    // Clear previous ecommerce data for clean state (GA4 best practice)
    if (data?.ecommerce) {
      window.dataLayer.push({ ecommerce: null });
    }
    
    window.dataLayer.push({ event, ...data });
  }
};

function calculateTotals(
  cart: CartItem[],
  settings: CheckoutSettings,
  selectedZone?: 'inside' | 'outside'
): { subtotal: number; delivery: number; total: number } {
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  let delivery = 0;

  // Only charge delivery if there are items in cart
  if (subtotal > 0) {
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
  }

  return { subtotal, delivery, total: subtotal + delivery };
}

export function CheckoutSection({
  config,
  products,
  landingPageId,
  landingPageSlug,
  onOrderSuccess,
}: CheckoutSectionProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [selectedZone, setSelectedZone] = useState<'inside' | 'outside'>('inside');
  
  // Initialize cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Sync cart when products load/change
  useEffect(() => {
    if (products.length > 0 && cart.length === 0) {
      setCart(
        products.map(p => ({
          productId: p.id,
          productName: p.name,
          unitPrice: p.price,
          quantity: p.defaultQuantity ?? 1,
          images: p.images,
        }))
      );
    }
  }, [products, cart.length]);

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

  // Calculate totals from cart
  const { subtotal, delivery, total } = useMemo(
    () => calculateTotals(cart, settings, selectedZone),
    [cart, settings, selectedZone]
  );

  // Check if cart has any items
  const hasItems = cart.some(item => item.quantity > 0);

  if (!config.enabled) {
    return null;
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const item = cart.find(i => i.productId === productId);
    const oldQuantity = item?.quantity || 0;
    const clampedNewQuantity = Math.max(0, newQuantity);
    
    // Fire add_to_cart when quantity increases
    if (item && clampedNewQuantity > oldQuantity) {
      const quantityAdded = clampedNewQuantity - oldQuantity;
      pushDataLayer('add_to_cart', {
        ecommerce: {
          currency: settings.currency,
          value: item.unitPrice * quantityAdded,
          items: [{
            item_id: item.productId,
            item_name: item.productName,
            price: item.unitPrice,
            quantity: quantityAdded,
          }],
        },
      });
    }
    
    // Fire remove_from_cart when quantity decreases
    if (item && clampedNewQuantity < oldQuantity && clampedNewQuantity >= 0) {
      const quantityRemoved = oldQuantity - clampedNewQuantity;
      pushDataLayer('remove_from_cart', {
        ecommerce: {
          currency: settings.currency,
          value: item.unitPrice * quantityRemoved,
          items: [{
            item_id: item.productId,
            item_name: item.productName,
            price: item.unitPrice,
            quantity: quantityRemoved,
          }],
        },
      });
    }

    setCart(prev =>
      prev.map(cartItem =>
        cartItem.productId === productId
          ? { ...cartItem, quantity: clampedNewQuantity }
          : cartItem
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate cart has items
    if (!hasItems) {
      toast({
        title: 'কার্ট খালি',
        description: 'অন্তত একটি প্রোডাক্ট নির্বাচন করুন',
        variant: 'destructive',
      });
      return;
    }

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

      // Prepare cart items for GA4 ecommerce format
      const activeItems = cart.filter(item => item.quantity > 0);
      const ga4Items = activeItems.map((item, index) => ({
        item_id: item.productId,
        item_name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
        index: index,
      }));

      // Fire begin_checkout event (GA4 standard)
      pushDataLayer('begin_checkout', {
        ecommerce: {
          currency: settings.currency,
          value: total,
          items: ga4Items,
        },
        event_id: eventId,
      });

      // Insert main order
      const { data: orderData, error } = await supabase.from('orders').insert({
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
        quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        delivery_charge: delivery,
        total,
        currency: settings.currency,
      }).select('id').single();

      if (error) throw error;

      // Insert order items for each product with quantity > 0
      const orderItems = activeItems.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      }));

      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error inserting order items:', itemsError);
        }
      }

      // Push purchase event (GA4 ecommerce standard for Google Ads)
      pushDataLayer('purchase', {
        ecommerce: {
          transaction_id: orderData.id,
          value: total,
          tax: 0,
          shipping: delivery,
          currency: settings.currency,
          items: ga4Items,
        },
        // Enhanced Conversions user data (hashed by GTM if configured)
        user_data: {
          phone_number: form.customer_phone || undefined,
          address: {
            city: form.customer_city || undefined,
            country: 'BD',
          },
        },
        // Legacy format for backward compatibility  
        transaction_id: orderData.id,
        event_id: eventId,
        value: total,
        subtotal,
        shipping: delivery,
        currency: settings.currency,
        items: ga4Items,
      });

      // Call server-side tracking
      try {
        await supabase.functions.invoke('track-conversion', {
          body: {
            eventId,
            orderId: orderData?.id,
            productName: cart.filter(i => i.quantity > 0).map(i => i.productName).join(', '),
            customerCity: form.customer_city,
            landingPageSlug,
            quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
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

      // Redirect to thank you page
      navigate(`/thank-you?orderId=${orderData?.id}`);
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
          <h2 
            className="font-heading text-2xl text-primary mb-6 text-center"
            dangerouslySetInnerHTML={{ __html: config.title || 'অর্ডার করুন' }}
          />

          {/* 2-Column Grid: Product List (Left) + Form (Right) on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Product List and Price Summary */}
            <div className="p-4 rounded-theme bg-muted/50 border space-y-4">
              {/* Product List */}
              <ProductList
                items={cart}
                currencySymbol={currencySymbol}
                onQuantityChange={handleQuantityChange}
              />

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
                {settings.delivery_mode === 'conditional' && subtotal < (settings.free_over_amount || 0) && subtotal > 0 && (
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
                disabled={submitting || !hasItems}
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
