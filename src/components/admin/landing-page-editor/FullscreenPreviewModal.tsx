import { useState } from 'react';
import { Monitor, Smartphone, RefreshCw, X, ChevronDown, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  FullscreenDialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Section, ThemeConfig, CheckoutConfig, defaultCheckoutConfig, defaultCheckoutFields } from './types';
import { generatePreviewHTML, generateCheckoutPreviewHTML } from './themeUtils';
import { cn } from '@/lib/utils';

// Device presets with realistic dimensions
const devicePresets = [
  { name: 'Desktop', width: 'full' as const, height: 'full' as const, userAgent: null },
  { name: 'iPhone 14 Pro', width: 393, height: 852, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' },
  { name: 'iPhone SE', width: 375, height: 667, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36' },
  { name: 'iPad', width: 768, height: 1024, userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
  { name: 'iPad Pro', width: 1024, height: 1366, userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
];

interface FullscreenPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  themeConfig: ThemeConfig;
  landingPageId: string;
  gtmId?: string;
}

export function FullscreenPreviewModal({
  open,
  onOpenChange,
  sections,
  themeConfig,
  landingPageId,
  gtmId,
}: FullscreenPreviewModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>('Desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const currentDevice = devicePresets.find(d => d.name === selectedDevice) || devicePresets[0];
  const isMobileDevice = currentDevice.width !== 'full';

  // Fetch landing page details for slug
  const { data: landingPage } = useQuery({
    queryKey: ['landing-page-details-fullscreen', landingPageId],
    queryFn: async () => {
      const { data } = await supabase
        .from('landing_pages')
        .select('slug, published')
        .eq('id', landingPageId)
        .maybeSingle();
      return data;
    },
    enabled: !!landingPageId && open,
  });

  // Fetch linked product for checkout preview
  const { data: linkedProduct } = useQuery({
    queryKey: ['linked-product-preview-fullscreen', landingPageId],
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
    enabled: !!landingPageId && open,
  });

  // Fetch checkout settings
  const { data: checkoutSettings } = useQuery({
    queryKey: ['checkout-settings-preview-fullscreen', landingPageId],
    queryFn: async () => {
      const { data } = await supabase
        .from('landing_page_checkout_settings')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .maybeSingle();
      return data;
    },
    enabled: !!landingPageId && open,
  });

  // Sort sections by order and generate HTML for each
  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  
  // Generate HTML for each section, handling checkout type specially
  const sectionsHtml = sortedSections.map((s) => {
    if (s.type === 'checkout') {
      const checkoutConfig = (s.config as CheckoutConfig) ?? defaultCheckoutConfig;
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

  const previewHtml = generatePreviewHTML(sectionsHtml, themeConfig);

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

  // Calculate container dimensions
  const getContainerStyle = () => {
    if (currentDevice.width === 'full') {
      return { width: '100%', height: '100%' };
    }
    return {
      width: `${currentDevice.width}px`,
      height: `${currentDevice.height}px`,
      maxWidth: '100%',
      maxHeight: '100%',
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FullscreenDialogContent aria-describedby={undefined}>
        {/* Header with controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
          <DialogTitle className="text-base font-semibold">Landing Page Preview</DialogTitle>
          <div className="flex items-center gap-2">
            {/* Device Preset Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 min-w-[140px] justify-between">
                  <span className="truncate">{selectedDevice}</span>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                {devicePresets.map((device) => (
                  <DropdownMenuItem
                    key={device.name}
                    onClick={() => setSelectedDevice(device.name)}
                    className={cn(
                      'flex justify-between',
                      selectedDevice === device.name && 'bg-accent'
                    )}
                  >
                    <span>{device.name}</span>
                    {device.width !== 'full' && (
                      <span className="text-xs text-muted-foreground">
                        {device.width}×{device.height}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Quick desktop/mobile toggle */}
            <Button
              variant={!isMobileDevice ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedDevice('Desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={isMobileDevice ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedDevice('iPhone 14 Pro')}
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
              onClick={handleOpenRealPreview}
              title={landingPage?.slug ? `/p/${landingPage.slug}?preview=true` : 'Preview link'}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Preview area - conditional layout based on device */}
        <div className={cn(
          'flex-1 min-h-0 overflow-auto',
          isMobileDevice 
            ? 'bg-muted/30 flex items-start justify-center p-4' 
            : '' // Desktop: no extra styles, iframe fills space
        )}>
          {isMobileDevice ? (
            // Mobile/tablet with device frame
            <div
              className="transition-all duration-300 bg-white overflow-hidden shadow-2xl rounded-[2rem] border-[8px] border-border"
              style={getContainerStyle()}
            >
              <iframe
                key={refreshKey}
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="Landing Page Preview"
                style={{ borderRadius: '1.5rem' }}
              />
            </div>
          ) : (
            // Desktop: full width/height iframe without frame
            <iframe
              key={refreshKey}
              srcDoc={previewHtml}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts"
              title="Landing Page Preview"
            />
          )}
        </div>
        
        {/* Footer with device info */}
        {isMobileDevice && (
          <div className="shrink-0 px-4 py-2 border-t bg-muted/50 text-center text-xs text-muted-foreground">
            {currentDevice.name} — {currentDevice.width}×{currentDevice.height}px
          </div>
        )}
      </FullscreenDialogContent>
    </Dialog>
  );
}
