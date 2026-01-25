import { forwardRef } from 'react';
import { Section, ThemeConfig } from './types';
import { Layers } from 'lucide-react';

interface SectionPreviewProps {
  sections: Section[];
  previewingSections: Set<string>;
  themeConfig: ThemeConfig;
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
      margin: 0;
      padding: 0;
    }
  `;
}

export const SectionPreview = forwardRef<HTMLDivElement, SectionPreviewProps>(
  function SectionPreview({ sections, previewingSections, themeConfig }, ref) {
    const sectionsToPreview = sections
      .filter((s) => previewingSections.has(s.id))
      .sort((a, b) => a.sort_order - b.sort_order);

    if (sectionsToPreview.length === 0) {
      return (
        <div ref={ref} className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
          <Layers className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm text-center">
            Toggle preview on sections to see them here
          </p>
        </div>
      );
    }

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
        ${sectionsToPreview.map((s) => s.html).join('\n')}
      </body>
      </html>
    `;

    return (
      <div ref={ref} className="h-full">
        <iframe
          srcDoc={previewHtml}
          className="w-full h-full border-0 rounded-md"
          sandbox="allow-scripts"
          title="Section Preview"
        />
      </div>
    );
  }
);
