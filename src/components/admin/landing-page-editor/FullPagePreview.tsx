import { useRef, useState, useEffect, forwardRef, useCallback } from 'react';
import { Monitor, Smartphone, Copy, Check, Layers, RefreshCw, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Section, ThemeConfig, CheckoutConfig, defaultCheckoutConfig, defaultCheckoutFields } from './types';
import { generateFullHTML, generatePreviewHTML, generateCheckoutPreviewHTML } from './themeUtils';
import { parseHtmlParts } from './htmlParseUtils';
import { cn } from '@/lib/utils';
import { FullscreenPreviewModal } from './FullscreenPreviewModal';

interface FullPagePreviewProps {
  sections: Section[];
  themeConfig: ThemeConfig;
  landingPageId: string;
  gtmId?: string;
  showCodeView?: boolean;
}

type CodeTab = 'full' | 'head' | 'body';

// Mobile device dimensions
const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 667;

export const FullPagePreview = forwardRef<HTMLDivElement, FullPagePreviewProps>(
  function FullPagePreview({ sections, themeConfig, landingPageId, gtmId, showCodeView = false }, ref) {
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'preview' | 'code'>(showCodeView ? 'code' : 'preview');
    const [refreshKey, setRefreshKey] = useState(0);
    const [scale, setScale] = useState(1);
    const [codeTab, setCodeTab] = useState<CodeTab>('full');
    const [headCode, setHeadCode] = useState('');
    const [bodyCode, setBodyCode] = useState('');
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate scale for mobile view to fit container
    useEffect(() => {
      if (device !== 'mobile') {
        setScale(1);
        return;
      }

      const updateScale = () => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const newScale = Math.min(1, (containerWidth - 48) / MOBILE_WIDTH);
          setScale(newScale);
        }
      };

      updateScale();

      const resizeObserver = new ResizeObserver(updateScale);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [device]);

    const { toast } = useToast();

    // Fetch landing page details for slug
    const { data: landingPage } = useQuery({
      queryKey: ['landing-page-details', landingPageId],
      queryFn: async () => {
        const { data } = await supabase
          .from('landing_pages')
          .select('slug, published')
          .eq('id', landingPageId)
          .maybeSingle();
        return data;
      },
      enabled: !!landingPageId,
    });

    // Fetch linked product for checkout preview
    const { data: linkedProduct } = useQuery({
      queryKey: ['linked-product-preview', landingPageId],
      queryFn: async () => {
        const { data: lp } = await supabase
          .from('landing_pages')
          .select('product_id')
          .eq('id', landingPageId)
          .maybeSingle();
        
        if (!lp?.product_id) return null;
        
        const { data: product } = await supabase
          .from('products')
          .select('id, name, price, images')
          .eq('id', lp.product_id)
          .maybeSingle();
        
        return product;
      },
      enabled: !!landingPageId,
    });

    // Fetch checkout settings
    const { data: checkoutSettings } = useQuery({
      queryKey: ['checkout-settings-preview', landingPageId],
      queryFn: async () => {
        const { data } = await supabase
          .from('landing_page_checkout_settings')
          .select('*')
          .eq('landing_page_id', landingPageId)
          .maybeSingle();
        return data;
      },
      enabled: !!landingPageId,
    });

    // Sort sections by order and generate HTML for each
    const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);
    
    // Generate HTML for each section, handling checkout type specially
    const sectionsHtml = sortedSections.map((s) => {
      if (s.type === 'checkout') {
        const checkoutConfig = (s.config as CheckoutConfig) ?? defaultCheckoutConfig;
        // Ensure fields exist
        const configWithFields = {
          ...checkoutConfig,
          fields: checkoutConfig.fields?.length > 0 ? checkoutConfig.fields : defaultCheckoutFields,
        };
        return generateCheckoutPreviewHTML(
          configWithFields, 
          themeConfig,
          linkedProduct ? {
            name: linkedProduct.name,
            price: linkedProduct.price,
            images: linkedProduct.images,
          } : null,
          checkoutSettings ? {
            currency: checkoutSettings.currency,
            delivery_mode: checkoutSettings.delivery_mode,
            delivery_amount: Number(checkoutSettings.delivery_amount),
            free_over_amount: checkoutSettings.free_over_amount ? Number(checkoutSettings.free_over_amount) : null,
          } : null
        );
      }
      return s.html;
    }).join('\n');

    // Generate HTML
    const baseUrl = window.location.origin;
    const fullHtml = generateFullHTML(sectionsHtml, themeConfig, gtmId, baseUrl);
    const previewHtml = generatePreviewHTML(sectionsHtml, themeConfig, baseUrl);

    // Parse HTML parts for sub-tabs
    const getCurrentContent = useCallback(() => {
      switch (codeTab) {
        case 'head': return headCode;
        case 'body': return bodyCode;
        default: return fullHtml;
      }
    }, [codeTab, fullHtml, headCode, bodyCode]);

    // Update head/body when switching to code view or when fullHtml changes
    useEffect(() => {
      if (viewMode === 'code') {
        const parts = parseHtmlParts(fullHtml);
        setHeadCode(parts.head);
        setBodyCode(parts.body);
      }
    }, [viewMode, fullHtml]);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(getCurrentContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };

    const handleOpenRealPreview = () => {
      if (!landingPage?.slug) {
        toast({ 
          title: 'Slug not found', 
          variant: 'destructive' 
        });
        return;
      }
      
      // Always open with preview=true (works for both published & unpublished)
      window.open(`/p/${landingPage.slug}?preview=true`, '_blank');
    };

    if (sections.length === 0) {
      return (
        <div ref={ref} className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
          <Layers className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm text-center">
            Add sections to see the preview
          </p>
        </div>
      );
    }

    return (
      <div ref={ref} className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('preview')}
            >
              Preview
            </Button>
            <Button
              variant={viewMode === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('code')}
            >
              HTML
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {viewMode === 'preview' && (
              <>
                <Button
                  variant={device === 'desktop' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDevice('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={device === 'mobile' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDevice('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRefresh}
                  title="Refresh preview"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFullscreenOpen(true)}
                  title="Fullscreen Preview"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Code Sub-tabs with individual copy buttons */}
        {viewMode === 'code' && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <Button
                variant={codeTab === 'full' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCodeTab('full')}
                className="h-7 px-3 text-xs"
              >
                Full Code
              </Button>
              <Button
                variant={codeTab === 'head' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCodeTab('head')}
                className="h-7 px-3 text-xs"
              >
                Head
              </Button>
              <Button
                variant={codeTab === 'body' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCodeTab('body')}
                className="h-7 px-3 text-xs"
              >
                Body
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs">
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy {codeTab === 'full' ? 'Full' : codeTab === 'head' ? 'Head' : 'Body'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0">
          {viewMode === 'preview' ? (
            <div 
              ref={containerRef} 
              className="h-full border rounded-md bg-background overflow-hidden"
            >
              {device === 'mobile' ? (
                // Mobile: Fixed dimensions with scaling
                <div className="h-full flex items-start justify-center overflow-auto py-4 bg-muted/30">
                  <div
                    style={{
                      width: MOBILE_WIDTH,
                      height: MOBILE_HEIGHT,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                    }}
                    className="bg-background overflow-hidden shadow-xl rounded-[2rem] border-4 border-border shrink-0"
                  >
                    <iframe
                      key={refreshKey}
                      ref={iframeRef}
                      srcDoc={previewHtml}
                      style={{ width: MOBILE_WIDTH, height: MOBILE_HEIGHT }}
                      className="border-0"
                      sandbox="allow-scripts"
                      title="Landing Page Preview"
                    />
                  </div>
                </div>
              ) : (
                // Desktop: Full width
                <iframe
                  key={refreshKey}
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                  title="Landing Page Preview"
                />
              )}
            </div>
          ) : (
            <pre className="h-full p-4 text-xs font-mono bg-muted rounded-md overflow-auto whitespace-pre-wrap break-all">
              {getCurrentContent()}
            </pre>
          )}
        </div>

        <FullscreenPreviewModal
          open={fullscreenOpen}
          onOpenChange={setFullscreenOpen}
          sections={sections}
          themeConfig={themeConfig}
          landingPageId={landingPageId}
          gtmId={gtmId}
        />
      </div>
    );
  }
);
