import { useRef, useState, forwardRef } from 'react';
import { Monitor, Smartphone, Copy, Check, Layers, RefreshCw, Maximize2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Section, ThemeConfig, CheckoutConfig, defaultCheckoutConfig, defaultCheckoutFields } from './types';
import { generateFullHTML, generatePreviewHTML, generateCheckoutPreviewHTML } from './themeUtils';
import { FullscreenPreviewModal } from './FullscreenPreviewModal';
import { cn } from '@/lib/utils';

interface FullPagePreviewProps {
  sections: Section[];
  themeConfig: ThemeConfig;
  landingPageId: string;
  gtmId?: string;
  showCodeView?: boolean;
}

export const FullPagePreview = forwardRef<HTMLDivElement, FullPagePreviewProps>(
  function FullPagePreview({ sections, themeConfig, landingPageId, gtmId, showCodeView = false }, ref) {
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'preview' | 'code'>(showCodeView ? 'code' : 'preview');
    const [refreshKey, setRefreshKey] = useState(0);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

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
    const fullHtml = generateFullHTML(sectionsHtml, themeConfig, gtmId);
    const previewHtml = generatePreviewHTML(sectionsHtml, themeConfig);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(fullHtml);
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
      
      if (!landingPage.published) {
        toast({
          title: 'Page Not Published',
          description: 'Please publish the page first to see real preview.',
          variant: 'destructive',
        });
        return;
      }
      
      window.open(`/p/${landingPage.slug}`, '_blank');
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
                  title="Expand to fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleOpenRealPreview}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            )}
            {viewMode === 'code' && (
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {viewMode === 'preview' ? (
            <div className="h-full border rounded-md bg-background overflow-hidden">
              <div
                className={cn(
                  'h-full mx-auto transition-all duration-300',
                  device === 'mobile' ? 'max-w-[375px] border-x' : 'w-full'
                )}
              >
                <iframe
                  key={refreshKey}
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                  title="Landing Page Preview"
                />
              </div>
            </div>
          ) : (
            <pre className="h-full p-4 text-xs font-mono bg-muted rounded-md overflow-auto whitespace-pre-wrap break-all">
              {fullHtml}
            </pre>
          )}
        </div>

        {/* Fullscreen Preview Modal */}
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
