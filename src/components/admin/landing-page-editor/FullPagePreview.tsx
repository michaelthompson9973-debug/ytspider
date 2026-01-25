import { useRef, useState, forwardRef } from 'react';
import { Monitor, Smartphone, Copy, Check, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, ThemeConfig } from './types';
import { generateFullHTML, generatePreviewHTML } from './themeUtils';
import { cn } from '@/lib/utils';

interface FullPagePreviewProps {
  sections: Section[];
  themeConfig: ThemeConfig;
  gtmId?: string;
  showCodeView?: boolean;
}

export const FullPagePreview = forwardRef<HTMLDivElement, FullPagePreviewProps>(
  function FullPagePreview({ sections, themeConfig, gtmId, showCodeView = false }, ref) {
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'preview' | 'code'>(showCodeView ? 'code' : 'preview');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Sort sections by order
    const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);
    const sectionsHtml = sortedSections.map((s) => s.html).join('\n');

    // Generate HTML
    const fullHtml = generateFullHTML(sectionsHtml, themeConfig, gtmId);
    const previewHtml = generatePreviewHTML(sectionsHtml, themeConfig);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(fullHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      </div>
    );
  }
);
