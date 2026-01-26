import { useState } from 'react';
import { Monitor, Smartphone, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Section, ThemeConfig, CheckoutConfig, defaultCheckoutConfig, defaultCheckoutFields } from './types';
import { generatePreviewHTML, generateCheckoutPreviewHTML } from './themeUtils';
import { cn } from '@/lib/utils';

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
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen p-0 gap-0 rounded-none border-0">
        {/* Header with controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <DialogTitle className="text-base font-semibold">Landing Page Preview</DialogTitle>
          <div className="flex items-center gap-2">
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
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Full height iframe */}
        <div className="flex-1 overflow-hidden bg-muted/30">
          <div
            className={cn(
              'h-full mx-auto transition-all duration-300',
              device === 'mobile' ? 'max-w-[375px] border-x shadow-lg' : 'w-full'
            )}
          >
            <iframe
              key={refreshKey}
              srcDoc={previewHtml}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts"
              title="Fullscreen Landing Page Preview"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
