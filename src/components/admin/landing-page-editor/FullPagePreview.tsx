import { useRef, useState } from 'react';
import { Monitor, Smartphone, Code, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Section, ThemeConfig } from './types';
import { cn } from '@/lib/utils';

interface FullPagePreviewProps {
  sections: Section[];
  themeConfig: ThemeConfig;
  gtmId?: string;
}

function generateThemeCSS(config: ThemeConfig): string {
  const buttonRadius = config.buttonStyle === 'pill' 
    ? '9999px' 
    : config.buttonStyle === 'square' 
    ? '0' 
    : config.borderRadius;

  return `
    :root {
      --theme-primary: ${config.primaryColor};
      --theme-bg: ${config.backgroundColor};
      --theme-font: ${config.fontFamily};
      --theme-radius: ${config.borderRadius};
      --theme-btn-radius: ${buttonRadius};
      --theme-container: ${config.containerWidth};
    }
    body {
      font-family: var(--theme-font);
      background-color: var(--theme-bg);
    }
    .container {
      max-width: var(--theme-container);
      margin: 0 auto;
    }
    a, .text-primary { color: var(--theme-primary); }
    .bg-primary { background-color: var(--theme-primary); }
    .border-primary { border-color: var(--theme-primary); }
    button, .btn, [class*="button"] {
      border-radius: var(--theme-btn-radius);
    }
  `;
}

function generateFullHTML(sections: Section[], themeConfig: ThemeConfig, gtmId?: string): string {
  const themeCSS = generateThemeCSS(themeConfig);
  const sectionsHtml = sections
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => s.html)
    .join('\n');

  const gtmHead = gtmId ? `
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');</script>
    <!-- End Google Tag Manager -->
  ` : '';

  const gtmBody = gtmId ? `
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${themeCSS}</style>
  ${gtmHead}
</head>
<body>
  ${gtmBody}
  ${sectionsHtml}
</body>
</html>`;
}

export function FullPagePreview({ sections, themeConfig, gtmId }: FullPagePreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fullHtml = generateFullHTML(sections, themeConfig, gtmId);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>${generateThemeCSS(themeConfig)}</style>
    </head>
    <body>
      ${sections.sort((a, b) => a.sort_order - b.sort_order).map((s) => s.html).join('\n')}
    </body>
    </html>
  `;

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="preview" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">HTML Code</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant={device === 'desktop' ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setDevice('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={device === 'mobile' ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setDevice('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="preview" className="flex-1 mt-0">
          <div className="h-full border rounded-md bg-background overflow-hidden">
            <div
              className={cn(
                'h-full mx-auto transition-all duration-300',
                device === 'mobile' ? 'max-w-[375px]' : 'w-full'
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
        </TabsContent>

        <TabsContent value="code" className="flex-1 mt-0 flex flex-col">
          <div className="flex justify-end mb-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy HTML
                </>
              )}
            </Button>
          </div>
          <pre className="flex-1 p-4 text-xs font-mono bg-muted rounded-md overflow-auto whitespace-pre-wrap break-all">
            {fullHtml}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
