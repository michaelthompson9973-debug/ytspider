import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { CheckoutConfig, DeliveryMode, currencyOptions, defaultCheckoutFields, CheckoutField, defaultCheckoutSettings } from '@/components/admin/landing-page-editor/types';
import { Minus, Plus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Format amount in Bengali
const formatAmount = (value: number): string => {
  try { 
    return new Intl.NumberFormat('bn-BD').format(Math.round(value)); 
  } catch {
    return Math.round(value).toString();
  }
};

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
  
  // Package selection state
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // Initialize selection when products load
  useEffect(() => {
    if (products.length > 0 && !selectedPackage) {
      const firstProduct = products[0];
      setSelectedPackage(firstProduct.id);
      
      // Initialize quantities for all products
      const initialQuantities: Record<string, number> = {};
      products.forEach(p => {
        initialQuantities[p.id] = p.defaultQuantity ?? 1;
      });
      setQuantities(initialQuantities);
    }
  }, [products, selectedPackage]);

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

  // Get selected product
  const selectedProduct = useMemo(() => 
    products.find(p => p.id === selectedPackage),
    [products, selectedPackage]
  );

  // Calculate totals
  const { subtotal, delivery, total, isFreeDelivery } = useMemo(() => {
    if (!selectedProduct) {
      return { subtotal: 0, delivery: 0, total: 0, isFreeDelivery: false };
    }
    
    const quantity = quantities[selectedPackage!] || 1;
    const sub = selectedProduct.price * quantity;
    let del = 0;
    let isFree = false;

    if (sub > 0) {
      switch (settings.delivery_mode) {
        case 'free':
          del = 0;
          isFree = true;
          break;
        case 'flat':
          del = settings.delivery_amount;
          break;
        case 'conditional':
          if (sub >= (settings.free_over_amount || 0)) {
            del = 0;
            isFree = true;
          } else {
            del = settings.delivery_amount;
          }
          break;
        case 'zoned':
          del = selectedZone === 'outside'
            ? settings.outside_city_amount
            : settings.inside_city_amount;
          break;
      }
    }

    return { subtotal: sub, delivery: del, total: sub + del, isFreeDelivery: isFree };
  }, [selectedProduct, selectedPackage, quantities, settings, selectedZone]);

  if (!config.enabled) {
    return null;
  }

  const handlePackageSelect = (productId: string) => {
    setSelectedPackage(productId);
    
    // Fire view_item event
    const product = products.find(p => p.id === productId);
    if (product) {
      pushDataLayer('view_item', {
        ecommerce: {
          currency: settings.currency,
          value: product.price,
          items: [{
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            quantity: quantities[productId] || 1,
          }],
        },
      });
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    const currentQty = quantities[productId] || 1;
    const newQty = Math.max(1, currentQty + delta);
    
    // Fire add_to_cart/remove_from_cart events
    const product = products.find(p => p.id === productId);
    if (product) {
      if (delta > 0) {
        pushDataLayer('add_to_cart', {
          ecommerce: {
            currency: settings.currency,
            value: product.price * delta,
            items: [{
              item_id: product.id,
              item_name: product.name,
              price: product.price,
              quantity: delta,
            }],
          },
        });
      } else if (delta < 0 && currentQty > 1) {
        pushDataLayer('remove_from_cart', {
          ecommerce: {
            currency: settings.currency,
            value: product.price * Math.abs(delta),
            items: [{
              item_id: product.id,
              item_name: product.name,
              price: product.price,
              quantity: Math.abs(delta),
            }],
          },
        });
      }
    }

    setQuantities(prev => ({
      ...prev,
      [productId]: newQty
    }));
    
    // Auto-select if not already selected
    if (selectedPackage !== productId) {
      setSelectedPackage(productId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast({
        title: 'প্রোডাক্ট নির্বাচন করুন',
        description: 'অন্তত একটি প্রোডাক্ট সিলেক্ট করুন',
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
      const quantity = quantities[selectedPackage!] || 1;

      // Prepare cart item for GA4 ecommerce format
      const ga4Items = [{
        item_id: selectedProduct.id,
        item_name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: quantity,
        index: 0,
      }];

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
        product_id: selectedProduct.id,
        utm_source: searchParams.get('utm_source'),
        utm_medium: searchParams.get('utm_medium'),
        utm_campaign: searchParams.get('utm_campaign'),
        utm_term: searchParams.get('utm_term'),
        utm_content: searchParams.get('utm_content'),
        event_id: eventId,
        quantity,
        unit_price: selectedProduct.price,
        subtotal,
        delivery_charge: delivery,
        total,
        currency: settings.currency,
      }).select('id').single();

      if (error) throw error;

      // Insert order item
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: quantity,
          unit_price: selectedProduct.price,
          subtotal: selectedProduct.price * quantity,
        });

      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
      }

      // Normalize phone number for Enhanced Conversions (E.164 format)
      const normalizedPhone = form.customer_phone 
        ? '+880' + form.customer_phone.replace(/^0+/, '').replace(/\D/g, '')
        : undefined;

      // Push purchase event (GA4 ecommerce standard for Google Ads)
      pushDataLayer('purchase', {
        ecommerce: {
          transaction_id: orderData.id,
          affiliation: landingPageSlug,
          value: total,
          tax: 0,
          shipping: delivery,
          currency: settings.currency,
          items: ga4Items,
        },
        user_data: {
          phone_number: normalizedPhone,
          address: {
            city: form.customer_city?.trim() || undefined,
            region: form.customer_city?.trim() || undefined,
            country: 'BD',
          },
        },
        transaction_id: orderData.id,
        event_id: eventId,
        value: total,
        currency: settings.currency,
        conversion_value: total,
      });

      // Call server-side tracking for deduplication and backup
      try {
        await supabase.functions.invoke('track-conversion', {
          body: {
            eventId,
            orderId: orderData.id,
            transactionId: orderData.id,
            productName: selectedProduct.name,
            productIds: [selectedProduct.id],
            customerPhone: normalizedPhone,
            customerCity: form.customer_city,
            landingPageSlug,
            quantity,
            subtotal,
            shipping: delivery,
            total,
            currency: settings.currency,
            items: ga4Items,
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
    const baseClasses = "block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-[15px] text-gray-700 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all duration-200 font-body";

    if (field.type === 'textarea') {
      return (
        <textarea
          id={`checkout-${field.id}`}
          value={form[field.name] || ''}
          onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
          className={baseClasses}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
        />
      );
    }

    return (
      <input
        id={`checkout-${field.id}`}
        type={field.type}
        value={form[field.name] || ''}
        onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
        className={baseClasses}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };

  return (
    <section className="bg-background" id="checkout">
      <form onSubmit={handleSubmit}>
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Header Title */}
          <div className="text-center mb-8">
            <h1 
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground font-heading"
              dangerouslySetInnerHTML={{ __html: config.title || 'অর্ডার করতে নিচের ফর্মে আপনার নাম, পূর্ণ ঠিকানা এবং মোবাইল নাম্বার লিখুন।' }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Product Selection & Form (2 cols on desktop) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Package Selection Cards */}
              <div className="flex flex-col gap-4">
                {products.map((product) => {
                  const isSelected = selectedPackage === product.id;
                  const qty = quantities[product.id] || 1;
                  const imageUrl = product.images?.[0] || '/placeholder.svg';

                  return (
                    <label
                      key={product.id}
                      className={cn(
                        "relative p-3 bg-white border rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-150",
                        isSelected 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-gray-200 hover:border-primary/60"
                      )}
                    >
                      {/* Hidden Radio */}
                      <input
                        type="radio"
                        name="package"
                        value={product.id}
                        checked={isSelected}
                        onChange={() => handlePackageSelect(product.id)}
                        className="absolute inset-0 opacity-0 pointer-events-none"
                      />

                      {/* Radio Indicator */}
                      <div className={cn(
                        "absolute left-2 top-2 w-5 h-5 bg-white border-2 rounded-full flex items-center justify-center z-10",
                        isSelected ? "border-primary" : "border-gray-300"
                      )}>
                        <div className={cn(
                          "w-3 h-3 rounded-full transition-colors",
                          isSelected ? "bg-primary" : "bg-transparent"
                        )} />
                      </div>

                      {/* Product Image */}
                      <div className="w-20 h-20 border-2 border-primary rounded-xl overflow-hidden bg-white flex-shrink-0">
                        <img 
                          src={imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-gray-700 text-base leading-tight line-clamp-2 font-body">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                          {/* Price Badge */}
                          <div className="flex items-baseline gap-2">
                            <span className="bg-red-500 text-white font-bold text-xl py-0.5 px-2 rounded-md font-digit">
                              {currencySymbol}{formatAmount(product.price)}
                            </span>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center">
                            <span className="text-gray-600 font-semibold mr-1 text-xs font-body">Qty:</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleQuantityChange(product.id, -1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-10 h-7 flex items-center justify-center text-sm text-gray-700 font-digit">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleQuantityChange(product.id, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full border text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Delivery Information Card */}
              <div className="bg-white border border-border rounded-2xl p-7 shadow-md">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-6 bg-primary rounded" />
                  <h3 className="text-2xl font-semibold text-foreground font-heading">ডেলিভারি তথ্য</h3>
                </div>
                <div className="space-y-5">
                  {enabledFields.map((field) => (
                    <div key={field.id}>
                      <label 
                        htmlFor={`checkout-${field.id}`} 
                        className="block font-semibold text-gray-700 mb-1.5 font-body"
                      >
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Sticky Summary) */}
            <div className="lg:sticky lg:top-6 h-fit">
              <div className="bg-white border border-border rounded-2xl p-7 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-primary rounded" />
                  <h3 className="text-2xl font-semibold text-foreground font-heading">Order Summary</h3>
                </div>

                {selectedProduct && (
                  <div className="mt-3 space-y-3">
                    {/* Selected Product */}
                    <div className="flex justify-between items-center py-4 border-b border-dashed border-gray-200">
                      <div className="flex items-center gap-4">
                        <img 
                          src={selectedProduct.images?.[0] || '/placeholder.svg'} 
                          alt={selectedProduct.name}
                          className="w-16 h-16 rounded-lg object-cover shadow-sm border border-gray-200"
                        />
                        <div>
                          <span className="font-semibold text-gray-800 block leading-tight font-body">
                            {selectedProduct.name}
                          </span>
                          <small className="text-gray-500 font-body">× {quantities[selectedPackage!] || 1}</small>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-800 text-lg font-digit">
                        {currencySymbol}{formatAmount(subtotal)}
                      </span>
                    </div>

                    {/* Subtotal */}
                    <div className="flex justify-between items-center py-2 text-gray-700">
                      <span className="font-body">Subtotal</span>
                      <span className="font-medium font-digit">{currencySymbol}{formatAmount(subtotal)}</span>
                    </div>

                    {/* Delivery Charge */}
                    {!isFreeDelivery && (
                      <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                        <span className="font-body">ডেলিভারি চার্জ</span>
                        <span className="font-medium font-digit">{currencySymbol}{formatAmount(delivery)}</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-4 text-xl font-bold text-primary">
                      <span className="font-heading">সর্বমোট</span>
                      <span className="font-digit">{currencySymbol}{formatAmount(total)}</span>
                    </div>
                  </div>
                )}

                {/* Zone Selection for Zoned Delivery */}
                {settings.delivery_mode === 'zoned' && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2 text-gray-700 text-[15px] font-body">ডেলিভারি এলাকা</h4>
                    <div className="space-y-3">
                      <label className={cn(
                        "flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200",
                        selectedZone === 'inside' 
                          ? "bg-primary/5 border-primary ring-2 ring-primary/20" 
                          : "hover:bg-primary/5 hover:border-primary"
                      )}>
                        <input
                          type="radio"
                          name="delivery_area"
                          value="inside"
                          checked={selectedZone === 'inside'}
                          onChange={() => setSelectedZone('inside')}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <div className="flex justify-between w-full font-medium text-[15px] text-gray-700">
                          <span className="font-body">{settings.inside_city_label}</span>
                          <span className="font-semibold text-gray-800 font-digit">
                            {currencySymbol}{formatAmount(settings.inside_city_amount)}
                          </span>
                        </div>
                      </label>
                      <label className={cn(
                        "flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200",
                        selectedZone === 'outside' 
                          ? "bg-primary/5 border-primary ring-2 ring-primary/20" 
                          : "hover:bg-primary/5 hover:border-primary"
                      )}>
                        <input
                          type="radio"
                          name="delivery_area"
                          value="outside"
                          checked={selectedZone === 'outside'}
                          onChange={() => setSelectedZone('outside')}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <div className="flex justify-between w-full font-medium text-[15px] text-gray-700">
                          <span className="font-body">{settings.outside_city_label}</span>
                          <span className="font-semibold text-gray-800 font-digit">
                            {currencySymbol}{formatAmount(settings.outside_city_amount)}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Free Delivery Banner */}
                {isFreeDelivery && (
                  <div className="mt-6 text-center text-lg font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 shadow-sm">
                    <strong>সারা বাংলাদেশে ফ্রি ডেলিভারি! 🎉</strong>
                  </div>
                )}

                {/* Submit Button */}
                <div className="mt-7">
                  <button
                    type="submit"
                    disabled={submitting || !selectedProduct}
                    className="w-full flex justify-between items-center bg-primary text-primary-foreground text-lg font-bold py-4 px-6 rounded-xl shadow-lg hover:opacity-90 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-button"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {submitting ? 'প্রসেসিং...' : config.ctaText || 'অর্ডার কনফার্ম করুন'}
                    </span>
                    <span className="font-digit">{currencySymbol}{formatAmount(total)}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
