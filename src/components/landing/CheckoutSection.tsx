import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { CheckoutConfig } from '@/components/admin/landing-page-editor/types';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

const orderSchema = z.object({
  customer_name: z.string().min(2, 'নাম দিতে হবে').max(100),
  customer_phone: z.string().min(6, 'ফোন নম্বর দিতে হবে').max(20),
  customer_address: z.string().min(5, 'ঠিকানা দিতে হবে').max(500),
  customer_city: z.string().min(2, 'শহরের নাম দিতে হবে').max(100),
});

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CheckoutSectionProps {
  config: CheckoutConfig;
  product: Product | null;
  landingPageId: string;
  landingPageSlug: string;
  onOrderSuccess?: (orderId: string) => void;
}

const pushDataLayer = (event: string, data?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
  }
};

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
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_city: '',
  });

  if (!config.enabled) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = orderSchema.safeParse(form);
    if (!validation.success) {
      toast({
        title: 'ফর্ম পূরণ করুন',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
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
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_address: form.customer_address,
        customer_city: form.customer_city,
        utm_source: searchParams.get('utm_source'),
        utm_medium: searchParams.get('utm_medium'),
        utm_campaign: searchParams.get('utm_campaign'),
        utm_term: searchParams.get('utm_term'),
        utm_content: searchParams.get('utm_content'),
        event_id: eventId,
      }).select('id').single();

      if (error) throw error;

      // Push purchase event for GTM
      pushDataLayer('purchase', {
        transaction_id: eventId,
        value: product?.price,
        currency: 'BDT',
        items: [{
          item_id: product?.id,
          item_name: product?.name,
          price: product?.price,
          quantity: 1,
        }],
      });

      // Call server-side tracking
      try {
        await supabase.functions.invoke('track-conversion', {
          body: {
            eventId,
            orderId: orderData?.id,
            productName: product?.name,
            productPrice: product?.price,
            customerCity: form.customer_city,
            landingPageSlug,
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
        <div className="container max-w-md mx-auto">
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

  return (
    <section className="py-12 px-4 bg-muted/50" id="checkout">
      <div className="container max-w-md mx-auto">
        <div className="rounded-theme bg-background border shadow-sm p-6">
          <h2 className="font-heading text-2xl text-primary mb-4 text-center">
            {config.title}
          </h2>

          {product && (
            <div className="mb-6 p-4 rounded-theme bg-muted/50 border">
              <p className="font-body text-lg font-medium">{product.name}</p>
              <p className="font-digit text-2xl text-primary font-bold">
                ৳{Number(product.price).toLocaleString('bn-BD')}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="checkout-name" className="font-body text-sm font-medium block">
                আপনার নাম
              </label>
              <input
                id="checkout-name"
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="font-body w-full rounded-theme border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="সম্পূর্ণ নাম লিখুন"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="checkout-phone" className="font-body text-sm font-medium block">
                মোবাইল নম্বর
              </label>
              <input
                id="checkout-phone"
                type="tel"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                className="font-body w-full rounded-theme border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="01XXXXXXXXX"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="checkout-address" className="font-body text-sm font-medium block">
                ডেলিভারি ঠিকানা
              </label>
              <input
                id="checkout-address"
                type="text"
                value={form.customer_address}
                onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                className="font-body w-full rounded-theme border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="বাড়ি নং, রাস্তা, এলাকা"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="checkout-city" className="font-body text-sm font-medium block">
                শহর/জেলা
              </label>
              <input
                id="checkout-city"
                type="text"
                value={form.customer_city}
                onChange={(e) => setForm({ ...form, customer_city: e.target.value })}
                className="font-body w-full rounded-theme border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ঢাকা"
                required
              />
            </div>

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
    </section>
  );
}
