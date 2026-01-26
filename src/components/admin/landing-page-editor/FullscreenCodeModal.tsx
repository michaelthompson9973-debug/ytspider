import { useState, useEffect, useRef, useCallback } from 'react';
import { Code, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { AiEnhanceButton } from './AiEnhanceButton';

interface FullscreenCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  html: string;
  onHtmlChange: (html: string) => void;
  sectionName: string;
}

export function FullscreenCodeModal({
  open,
  onOpenChange,
  html,
  onHtmlChange,
  sectionName,
}: FullscreenCodeModalProps) {
  const [localHtml, setLocalHtml] = useState(html);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync local state when modal opens or html prop changes
  useEffect(() => {
    if (open) {
      setLocalHtml(html);
    }
  }, [open, html]);

  const lines = localHtml.split('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(localHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onHtmlChange(localHtml);
    onOpenChange(false);
  };

  // Sync scroll between textarea and line numbers
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen p-0 gap-0 rounded-none border-0 flex flex-col">
        {/* Header - VS Code style dark theme */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-900 text-white">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-zinc-400" />
            <DialogTitle className="text-sm font-medium text-zinc-100">
              {sectionName || 'Code Editor'}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-zinc-300 hover:text-white hover:bg-zinc-700"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
            <AiEnhanceButton
              html={localHtml}
              onEnhanced={setLocalHtml}
              disabled={false}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-700"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* VS Code style editor */}
        <div className="flex-1 overflow-hidden bg-zinc-900 flex">
          {/* Line numbers */}
          <div
            ref={lineNumbersRef}
            className="w-12 py-4 text-right text-zinc-500 select-none font-mono text-sm border-r border-zinc-700 overflow-hidden shrink-0"
          >
            {lines.map((_, i) => (
              <div key={i} className="px-2 leading-6">
                {i + 1}
              </div>
            ))}
          </div>
          
          {/* Code area */}
          <textarea
            ref={textareaRef}
            className="flex-1 p-4 bg-transparent text-zinc-100 font-mono text-sm resize-none focus:outline-none leading-6"
            value={localHtml}
            onChange={(e) => setLocalHtml(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            placeholder="<section>Your HTML content here...</section>"
          />
        </div>
        
        {/* Footer with Apply button */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-zinc-700 bg-zinc-800">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-300 hover:text-white hover:bg-zinc-700"
          >
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
