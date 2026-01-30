import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; }
        </style>
      </head>
      <body>${component.html}</body>
    </html>
  `;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-row items-center justify-between">
          <DialogTitle>{component.name}</DialogTitle>
          <div className="flex items-center gap-2">
            <Toggle
              pressed={!isMobile}
              onPressedChange={() => setIsMobile(false)}
              aria-label="Desktop view"
              className="h-8 w-8 p-0"
            >
              <Monitor className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={isMobile}
              onPressedChange={() => setIsMobile(true)}
              aria-label="Mobile view"
              className="h-8 w-8 p-0"
            >
              <Smartphone className="h-4 w-4" />
            </Toggle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted p-4">
          <div
            className={cn(
              "mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all",
              isMobile ? "max-w-[375px]" : "max-w-full"
            )}
          >
            <iframe
              srcDoc={fullHtml}
              className="w-full border-0"
              style={{ height: '500px' }}
              title={`Preview: ${component.name}`}
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
