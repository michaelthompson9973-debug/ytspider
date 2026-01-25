import { forwardRef } from 'react';
import { Section, ThemeConfig } from './types';
import { generatePreviewHTML } from './themeUtils';
import { Layers } from 'lucide-react';

interface SectionPreviewProps {
  sections: Section[];
  previewingSections: Set<string>;
  themeConfig: ThemeConfig;
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

    const sectionsHtml = sectionsToPreview.map((s) => s.html).join('\n');
    const previewHtml = generatePreviewHTML(sectionsHtml, themeConfig);

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
