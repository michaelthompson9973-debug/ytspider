import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Package, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { currencyOptions, ThemeConfig, defaultThemeConfig } from '@/components/admin/landing-page-editor/types';
import { getGoogleFontsImports, generateThemeCSS, migrateThemeConfig } from '@/components/admin/landing-page-editor/themeUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderDetails {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  subtotal: number | null;
  delivery_charge: number | null;
  total: number | null;
  currency: string | null;
  created_at: string;
  landing_page_id: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// Skeleton loader for Thank You page
function ThankYouSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="container max-w-2xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="w-20 h-20 mx-auto mb-4 rounded-full" />
          <Skeleton className="h-10 w-48 mx-auto mb-2" />
          <Skeleton className="h-5 w-64 mx-auto mb-1" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>

        {/* Card Skeleton */}
        <div className="bg-background rounded-xl shadow-lg border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          <div className="p-6 border-b space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
          </div>

          <div className="p-6 border-b space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>

          <div className="p-6 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>

        <div className="text-center mt-8">
          <Skeleton className="h-5 w-28 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [showContent, setShowContent] = useState(false);

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['thank-you-order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, customer_phone, customer_address, customer_city, subtotal, delivery_charge, total, currency, created_at, landing_page_id')
        .eq('id', orderId)
        .maybeSingle();
      if (error) throw error;
      return data as OrderDetails | null;
    },
    enabled: !!orderId,
  });

  // Fetch order items
  const { data: orderItems } = useQuery({
    queryKey: ['thank-you-order-items', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select('id, product_name, quantity, unit_price, subtotal')
        .eq('order_id', orderId);
      if (error) throw error;
      return (data || []) as OrderItem[];
    },
    enabled: !!orderId,
  });

  // Fetch theme for the landing page
  const { data: themeData, isLoading: themeLoading } = useQuery({
    queryKey: ['thank-you-theme', order?.landing_page_id],
    queryFn: async () => {
      if (!order?.landing_page_id) return null;
      const { data, error } = await supabase
        .from('landing_page_theme')
        .select('*')
        .eq('landing_page_id', order.landing_page_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!order?.landing_page_id,
  });

  // Parse theme config with migration support
  const themeConfig: ThemeConfig = themeData?.config 
    ? migrateThemeConfig(themeData.config as Partial<ThemeConfig>)
    : defaultThemeConfig;

  // Inject Google Fonts for non-local fonts
  useEffect(() => {
    const fontUrls = getGoogleFontsImports(themeConfig);
    
    fontUrls.forEach((url, index) => {
      const linkId = `thank-you-font-${index}`;
      let link = document.getElementById(linkId) as HTMLLinkElement | null;
      
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
      } else {
        link.href = url;
      }
    });

    return () => {
      // Clean up fonts on unmount
      fontUrls.forEach((_, index) => {
        const link = document.getElementById(`thank-you-font-${index}`);
        link?.remove();
      });
    };
  }, [themeConfig]);

  // Inject theme CSS styles
  useEffect(() => {
    const styleId = 'thank-you-theme-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    const themeStyles = generateThemeCSS(themeConfig, window.location.origin);
    styleEl.textContent = themeStyles;

    return () => {
      styleEl?.remove();
    };
  }, [themeConfig]);

  // Show content with smooth transition after loading
  useEffect(() => {
    if (!orderLoading && !themeLoading && order) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    }
  }, [orderLoading, themeLoading, order]);

  const currencySymbol = currencyOptions.find(c => c.value === (order?.currency || 'BDT'))?.symbol || '৳';

  // Calculate button radius based on theme
  const buttonRadius = themeConfig.buttonStyle === 'pill' 
    ? '9999px' 
    : themeConfig.buttonStyle === 'square' 
    ? '0' 
    : themeConfig.borderRadius;

  if (!orderId) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: `'${themeConfig.headingFont}', sans-serif` }}>
            অর্ডার খুঁজে পাওয়া যায়নি
          </h1>
          <p className="text-muted-foreground mb-4" style={{ fontFamily: `'${themeConfig.bodyFont}', sans-serif` }}>
            একটি বৈধ অর্ডার আইডি প্রয়োজন।
          </p>
          <Link to="/" className="hover:underline" style={{ color: themeConfig.primaryColor }}>হোমে ফিরুন</Link>
        </div>
      </div>
    );
  }

  if (orderLoading || themeLoading || !showContent) {
    return <ThankYouSkeleton />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: `'${themeConfig.headingFont}', sans-serif` }}>
            অর্ডার খুঁজে পাওয়া যায়নি
          </h1>
          <p className="text-muted-foreground mb-4" style={{ fontFamily: `'${themeConfig.bodyFont}', sans-serif` }}>
            এই অর্ডার আইডিটি সঠিক নয়।
          </p>
          <Link to="/" className="hover:underline" style={{ color: themeConfig.primaryColor }}>হোমে ফিরুন</Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8 px-4 fade-in-up"
      style={{ 
        background: `linear-gradient(to bottom, ${themeConfig.primaryColor}10, ${themeConfig.backgroundColor})`,
        fontFamily: `'${themeConfig.bodyFont}', sans-serif`
      }}
    >
      <div className="container max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${themeConfig.primaryColor}20` }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: themeConfig.primaryColor }} />
          </div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              color: themeConfig.primaryColor,
              fontFamily: `'${themeConfig.headingFont}', sans-serif`
            }}
          >
            ধন্যবাদ!
          </h1>
          <p className="text-muted-foreground text-lg">
            আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।
          </p>
          <p className="text-muted-foreground">
            শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব।
          </p>
        </div>

        {/* Order Card */}
        <div 
          className="rounded-xl shadow-lg border overflow-hidden"
          style={{ 
            backgroundColor: themeConfig.backgroundColor,
            borderRadius: themeConfig.borderRadius
          }}
        >
          {/* Order ID Banner */}
          <div 
            className="px-6 py-4 border-b"
            style={{ backgroundColor: `${themeConfig.primaryColor}10` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">অর্ডার আইডি</span>
              <span 
                className="font-mono text-sm font-medium"
                style={{ fontFamily: `'${themeConfig.digitFont}', monospace` }}
              >
                {order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-6 border-b">
            <h2 
              className="font-semibold text-lg mb-4 flex items-center gap-2"
              style={{ fontFamily: `'${themeConfig.headingFont}', sans-serif` }}
            >
              <Package className="w-5 h-5" style={{ color: themeConfig.primaryColor }} />
              গ্রাহক তথ্য
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${themeConfig.primaryColor}15` }}
                >
                  <span className="text-sm font-medium" style={{ color: themeConfig.primaryColor }}>
                    {order.customer_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span style={{ fontFamily: `'${themeConfig.digitFont}', sans-serif` }}>
                      {order.customer_phone}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{order.customer_address}, {order.customer_city}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          {orderItems && orderItems.length > 0 && (
            <div className="p-6 border-b">
              <h2 
                className="font-semibold text-lg mb-4"
                style={{ fontFamily: `'${themeConfig.headingFont}', sans-serif` }}
              >
                অর্ডার সামারি
              </h2>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p 
                        className="text-sm text-muted-foreground"
                        style={{ fontFamily: `'${themeConfig.digitFont}', sans-serif` }}
                      >
                        {currencySymbol}{item.unit_price.toLocaleString('bn-BD')} × {item.quantity}
                      </p>
                    </div>
                    <span 
                      className="font-medium"
                      style={{ fontFamily: `'${themeConfig.digitFont}', sans-serif` }}
                    >
                      {currencySymbol}{item.subtotal.toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div 
            className="p-6"
            style={{ backgroundColor: `${themeConfig.primaryColor}05` }}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span style={{ fontFamily: `'${themeConfig.digitFont}', sans-serif` }}>
                  {currencySymbol}{(order.subtotal || 0).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                <span 
                  style={{ 
                    color: order.delivery_charge === 0 ? '#16a34a' : 'inherit',
                    fontFamily: `'${themeConfig.digitFont}', sans-serif`
                  }}
                >
                  {order.delivery_charge === 0 ? 'ফ্রি!' : `${currencySymbol}${(order.delivery_charge || 0).toLocaleString('bn-BD')}`}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>সর্বমোট</span>
                <span 
                  style={{ 
                    color: themeConfig.primaryColor,
                    fontFamily: `'${themeConfig.digitFont}', sans-serif`
                  }}
                >
                  {currencySymbol}{(order.total || 0).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link as styled button */}
        <div className="text-center mt-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium transition-opacity hover:opacity-90"
            style={{ 
              backgroundColor: themeConfig.primaryColor,
              borderRadius: buttonRadius,
              fontFamily: `'${themeConfig.buttonFont}', sans-serif`
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            হোমে ফিরুন
          </Link>
        </div>
      </div>
    </div>
  );
}
