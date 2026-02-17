import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Toggle } from '@/components/ui/toggle';
import { LibraryComponent } from './types';
import { cn } from '@/lib/utils';

interface ComponentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: LibraryComponent | null;
}

export function ComponentPreviewModal({ open, onOpenChange, component }: ComponentPreviewModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  if (!component) return null;

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = { theme: { extend: { fontFamily: { 'heading': ['"Hind Siliguri"', 'sans-serif'], 'body': ['"Anek Bangla"', 'sans-serif'] } } } }
</script>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { font-family: "Anek Bangla", sans-serif !important; }
h1, h2, h3, h4, h5, h6 { font-family: "Hind Siliguri", sans-serif !important; }
</style>
</head>
<body>${component.html}</body>
</html>`;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <ResponsiveModalHeader className="px-6 py-4 border-b flex-row items-center justify-between">
          <ResponsiveModalTitle>{component.name}</ResponsiveModalTitle>
          <div className="flex items-center gap-2">
            <Toggle pressed={!isMobile} onPressedChange={() => setIsMobile(false)} aria-label="Desktop" className="h-8 w-8 p-0"><Monitor className="h-4 w-4" /></Toggle>
            <Toggle pressed={isMobile} onPressedChange={() => setIsMobile(true)} aria-label="Mobile" className="h-8 w-8 p-0"><Smartphone className="h-4 w-4" /></Toggle>
          </div>
        </ResponsiveModalHeader>
        <div className="flex-1 overflow-auto bg-muted p-4">
          <div className={cn("mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all", isMobile ? "max-w-[375px]" : "max-w-full")}>
            <iframe srcDoc={fullHtml} className="w-full border-0" style={{ height: '500px' }} title={`Preview: ${component.name}`} sandbox="allow-scripts allow-same-origin" />
          </div>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
