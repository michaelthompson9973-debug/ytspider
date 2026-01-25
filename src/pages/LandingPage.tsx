import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

const orderSchema = z.object({
  customer_name: z.string().min(2, 'Name is required').max(100),
  customer_phone: z.string().min(6, 'Phone is required').max(20),
  customer_address: z.string().min(5, 'Address is required').max(500),
  customer_city: z.string().min(2, 'City is required').max(100),
});

// GTM Event helper
const pushDataLayer = (event: string, data?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      ...data,
    });
  }
};

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_city: '',
  });

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['landing-page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select(`
          *,
          products (id, name, price, description, images)
        `)
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Inject GTM and fire page_view
  useEffect(() => {
    if (!page?.gtm_id) return;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${page.gtm_id}');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${page.gtm_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);

    // Fire page_view event
    pushDataLayer('page_view', {
      page_path: `/p/${slug}`,
      page_title: page.products?.name || slug,
    });

    // Fire view_content event for product
    if (page.products) {
      pushDataLayer('view_content', {
        content_type: 'product',
        content_ids: [page.products.id],
        content_name: page.products.name,
        value: page.products.price,
        currency: 'USD',
      });
    }

    return () => {
      script.remove();
      noscript.remove();
    };
  }, [page?.gtm_id, page?.products, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = orderSchema.safeParse(form);
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Fire lead event before submitting
      pushDataLayer('lead', {
        event_id: eventId,
        customer_city: form.customer_city,
      });

      const { data: orderData, error } = await supabase.from('orders').insert({
        product_id: page?.product_id,
        landing_page_id: page?.id,
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
        value: page?.products?.price,
        currency: 'USD',
        items: [{
          item_id: page?.products?.id,
          item_name: page?.products?.name,
          price: page?.products?.price,
          quantity: 1,
        }],
      });

      // Call server-side tracking
      try {
        await supabase.functions.invoke('track-conversion', {
          body: {
            eventId,
            orderId: orderData?.id,
            productName: page?.products?.name,
            productPrice: page?.products?.price,
            customerCity: form.customer_city,
            landingPageSlug: slug,
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

      setOrderSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({
        title: 'Order Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">This page doesn't exist or isn't published.</p>
        </div>
      </div>
    );
  }

  if (orderSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Thank You!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your order has been received. We'll contact you shortly.
            </p>
            <p className="font-medium">{form.customer_name}</p>
            <p className="text-sm text-muted-foreground">{form.customer_phone}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Render HTML content */}
      <div dangerouslySetInnerHTML={{ __html: page.html_content }} />

      {/* Order Form */}
      <section className="py-12 px-4 bg-muted" id="order">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Order Now</CardTitle>
              {page.products && (
                <p className="text-lg font-bold text-primary">
                  {page.products.name} - ${Number(page.products.price).toFixed(2)}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input
                    id="address"
                    value={form.customer_address}
                    onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.customer_city}
                    onChange={(e) => setForm({ ...form, customer_city: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Complete Order'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
