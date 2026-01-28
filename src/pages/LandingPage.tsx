import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeConfig, defaultThemeConfig, CheckoutConfig } from '@/components/admin/landing-page-editor/types';
import { generateThemeCSS, getGoogleFontsImports } from '@/components/admin/landing-page-editor/themeUtils';
import { CheckoutSection } from '@/components/landing/CheckoutSection';
import { PreviewToolbar, devicePresets } from '@/components/landing/PreviewToolbar';
import { DomainGuard } from '@/components/landing/DomainGuard';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

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

interface SectionData {
  id: string;
  html: string;
  type: string;
  config: unknown;
  sort_order: number;
}

interface LandingPageProduct {
  id: string;
  product_id: string;
  sort_order: number;
  default_quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    images: string[] | null;
  } | null;
}

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderCustomerInfo, setOrderCustomerInfo] = useState<{ name: string; phone: string } | null>(null);
  const [selectedDevice, setSelectedDevice] = useState('Desktop');

  // Check for preview mode
  const isPreviewMode = searchParams.get('preview') === 'true';

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['landing-page', slug, isPreviewMode],
    queryFn: async () => {
      let query = supabase
        .from('landing_pages')
        .select(`*`)
        .eq('slug', slug);
      
      // Only check published status if NOT in preview mode
      if (!isPreviewMode) {
        query = query.eq('published', true);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch products for the landing page (from junction table)
  const { data: landingPageProducts = [] } = useQuery<LandingPageProduct[]>({
    queryKey: ['landing-page-products-public', page?.id],
    queryFn: async () => {
      if (!page?.id) return [];
      
      const { data, error } = await supabase
        .from('landing_page_products')
        .select(`
          id,
          product_id,
          sort_order,
          default_quantity,
          products (id, name, price, images)
        `)
        .eq('landing_page_id', page.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as LandingPageProduct[];
    },
    enabled: !!page?.id,
  });

  // Fallback: fetch legacy single product if junction table is empty
  const { data: legacyProduct } = useQuery({
    queryKey: ['landing-page-legacy-product', page?.product_id],
    queryFn: async () => {
      if (!page?.product_id) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, images')
        .eq('id', page.product_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!page?.product_id && landingPageProducts.length === 0,
  });

  // Fetch sections for the landing page
  const { data: sections = [] } = useQuery<SectionData[]>({
    queryKey: ['landing-page-sections', page?.id],
    queryFn: async () => {
      if (!page?.id) return [];
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('id, html, type, config, sort_order')
        .eq('landing_page_id', page.id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as SectionData[];
    },
    enabled: !!page?.id,
  });

  // Fetch theme for the landing page
  const { data: themeData } = useQuery({
    queryKey: ['landing-page-theme', page?.id],
    queryFn: async () => {
      if (!page?.id) return null;
      const { data, error } = await supabase
        .from('landing_page_theme')
        .select('*')
        .eq('landing_page_id', page.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!page?.id,
  });

  const themeConfig = (themeData?.config as unknown as ThemeConfig) ?? defaultThemeConfig;

  // Transform landing page products to the format CheckoutSection expects
  // First try junction table, then fallback to legacy product_id
  const products = landingPageProducts.length > 0
    ? landingPageProducts
        .filter(lp => lp.products)
        .map(lp => ({
          id: lp.products!.id,
          name: lp.products!.name,
          price: Number(lp.products!.price),
          images: lp.products!.images,
          defaultQuantity: lp.default_quantity,
        }))
    : legacyProduct
      ? [{
          id: legacyProduct.id,
          name: legacyProduct.name,
          price: Number(legacyProduct.price),
          images: legacyProduct.images,
          defaultQuantity: 1,
        }]
      : [];

  // Inject Google Fonts
  useEffect(() => {
    const fontUrls = getGoogleFontsImports(themeConfig);
    const linkIds: string[] = [];

    fontUrls.forEach((url, index) => {
      const linkId = `theme-font-${index}`;
      let link = document.getElementById(linkId) as HTMLLinkElement | null;
      
      if (!link) {
        // Add preconnect links first
        if (index === 0) {
          const preconnect1 = document.createElement('link');
          preconnect1.rel = 'preconnect';
          preconnect1.href = 'https://fonts.googleapis.com';
          document.head.appendChild(preconnect1);

          const preconnect2 = document.createElement('link');
          preconnect2.rel = 'preconnect';
          preconnect2.href = 'https://fonts.gstatic.com';
          preconnect2.crossOrigin = 'anonymous';
          document.head.appendChild(preconnect2);
        }

        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
      } else {
        link.href = url;
      }
      linkIds.push(linkId);
    });

    return () => {
      // Clean up font links on unmount
      linkIds.forEach(id => {
        document.getElementById(id)?.remove();
      });
    };
  }, [themeConfig]);

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
      page_title: products[0]?.name || slug,
    });

    // Fire view_content event for products
    if (products.length > 0) {
      pushDataLayer('view_content', {
        content_type: 'product',
        content_ids: products.map(p => p.id),
        content_name: products.map(p => p.name).join(', '),
        value: products.reduce((sum, p) => sum + p.price, 0),
        currency: 'BDT',
      });
    }

    return () => {
      script.remove();
      noscript.remove();
    };
  }, [page?.gtm_id, products, slug]);

  // Inject theme styles
  useEffect(() => {
    const styleId = 'landing-theme-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    // Use the new generateThemeCSS from themeUtils
    const themeStyles = generateThemeCSS(themeConfig);
    
    // Add scoping for landing content
    const scopedStyles = `
      ${themeStyles}
      .landing-content {
        background-color: var(--theme-bg);
      }
      .landing-content .container {
        max-width: var(--theme-container);
        margin: 0 auto;
      }
    `;
    
    styleEl.textContent = scopedStyles;

    return () => {
      styleEl?.remove();
    };
  }, [themeConfig]);

  // Handle order success from CheckoutSection
  const handleOrderSuccess = (orderId: string, customerName?: string, customerPhone?: string) => {
    setOrderSubmitted(true);
    if (customerName && customerPhone) {
      setOrderCustomerInfo({ name: customerName, phone: customerPhone });
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

  // Check if there's a checkout section in sections
  const hasCheckoutSection = sections.some(s => s.type === 'checkout');

  if (orderSubmitted && !hasCheckoutSection) {
    // Only show this if order was submitted from legacy form (no checkout section)
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
            {orderCustomerInfo && (
              <>
                <p className="font-medium">{orderCustomerInfo.name}</p>
                <p className="text-sm text-muted-foreground">{orderCustomerInfo.phone}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render sections
  const renderSections = () => {
    if (sections.length === 0) {
      // Legacy: render html_content if no sections
      return (
        <div className="landing-content" dangerouslySetInnerHTML={{ __html: page.html_content }} />
      );
    }

    return sections.map((section) => {
      if (section.type === 'checkout') {
        const checkoutConfig = section.config as CheckoutConfig;
        if (!checkoutConfig?.enabled) return null;
        
        return (
          <CheckoutSection
            key={section.id}
            config={checkoutConfig}
            products={products}
            landingPageId={page.id}
            landingPageSlug={slug || ''}
            onOrderSuccess={handleOrderSuccess}
          />
        );
      }

      // HTML section
      return (
        <div
          key={section.id}
          className="landing-content"
          dangerouslySetInnerHTML={{ __html: section.html }}
        />
      );
    });
  };

  // Get current device dimensions
  const currentDevice = devicePresets.find(d => d.name === selectedDevice) || devicePresets[0];
  const isDeviceSimulation = isPreviewMode && currentDevice.width !== 'full';

  // Content wrapper for device simulation
  const pageContent = (
    <div className="min-h-screen">
      {renderSections()}
    </div>
  );

  return (
    <DomainGuard>
      <div className="min-h-screen">
        {/* Preview Toolbar - only in preview mode */}
        {isPreviewMode && (
          <PreviewToolbar
            selectedDevice={selectedDevice}
            onDeviceChange={setSelectedDevice}
            isUnpublished={!page.published}
          />
        )}

        {/* Device Simulation Container */}
        {isDeviceSimulation ? (
          <div className="pt-14 min-h-screen bg-muted/50 flex flex-col items-center justify-start py-8">
            {/* Device Frame */}
            <div className="flex flex-col items-center">
              {/* Device Info */}
              <div className="mb-3 text-sm text-muted-foreground flex items-center gap-2">
                <span className="font-medium">{currentDevice.name}</span>
                <span>•</span>
                <span>{currentDevice.width}×{currentDevice.height}</span>
              </div>
              
              {/* Device Container */}
              <div
                className="bg-background rounded-[2rem] shadow-2xl border-8 border-foreground/20 overflow-hidden"
                style={{
                  width: typeof currentDevice.width === 'number' ? currentDevice.width : '100%',
                  height: typeof currentDevice.height === 'number' ? currentDevice.height : 'auto',
                  maxHeight: 'calc(100vh - 140px)',
                }}
              >
                <div className="w-full h-full overflow-auto">
                  {pageContent}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={isPreviewMode ? 'pt-12' : ''}>
            {pageContent}
          </div>
        )}
      </div>
    </DomainGuard>
  );
}
