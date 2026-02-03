import { useState, useEffect, useCallback } from 'react';
import { Code, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  FullscreenDialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { AiEnhanceButton } from './AiEnhanceButton';
import { SmartCodeEditor } from './SmartCodeEditor';
import { parseHtmlParts, mergeHtmlParts } from './htmlParseUtils';

interface FullscreenCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  html: string;
  onHtmlChange: (html: string) => void;
  sectionName: string;
}

type CodeTab = 'full' | 'head' | 'body';

export function FullscreenCodeModal({
  open,
  onOpenChange,
  html,
  onHtmlChange,
  sectionName,
}: FullscreenCodeModalProps) {
  const [localHtml, setLocalHtml] = useState(html);
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<CodeTab>('full');
  const [headCode, setHeadCode] = useState('');
  const [bodyCode, setBodyCode] = useState('');

  // Sync local state when modal opens or html prop changes
  useEffect(() => {
    if (open) {
      setLocalHtml(html);
      setCodeTab('full');
      const parts = parseHtmlParts(html);
      setHeadCode(parts.head);
      setBodyCode(parts.body);
    }
  }, [open, html]);

  // Get current content based on active tab
  const getCurrentContent = useCallback(() => {
    switch (codeTab) {
      case 'head': return headCode;
      case 'body': return bodyCode;
      default: return localHtml;
    }
  }, [codeTab, localHtml, headCode, bodyCode]);

  // Handle tab switching with parse/merge
  const handleCodeTabChange = useCallback((newTab: CodeTab) => {
    if (newTab === codeTab) return;
    
    if (codeTab === 'full') {
      // Switching from full → head/body: parse
      const parts = parseHtmlParts(localHtml);
      setHeadCode(parts.head);
      setBodyCode(parts.body);
    } else if (newTab === 'full') {
      // Switching from head/body → full: merge
      const merged = mergeHtmlParts(headCode, bodyCode);
      setLocalHtml(merged);
    }
    
    setCodeTab(newTab);
  }, [codeTab, localHtml, headCode, bodyCode]);

  // Handle content change based on current tab
  const handleContentChange = useCallback((value: string) => {
    switch (codeTab) {
      case 'head':
        setHeadCode(value);
        setLocalHtml(mergeHtmlParts(value, bodyCode));
        break;
      case 'body':
        setBodyCode(value);
        setLocalHtml(mergeHtmlParts(headCode, value));
        break;
      default:
        setLocalHtml(value);
    }
  }, [codeTab, headCode, bodyCode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onHtmlChange(localHtml);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FullscreenDialogContent className="bg-zinc-900" aria-describedby={undefined}>
        {/* Header - VS Code style dark theme */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-900 text-white shrink-0">
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
              onEnhanced={(enhanced) => {
                setLocalHtml(enhanced);
                const parts = parseHtmlParts(enhanced);
                setHeadCode(parts.head);
                setBodyCode(parts.body);
              }}
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

        {/* Code Sub-tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-700 bg-zinc-800 shrink-0">
          <Button
            variant={codeTab === 'full' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleCodeTabChange('full')}
            className={`h-7 px-3 text-xs ${codeTab !== 'full' ? 'text-zinc-300 hover:text-white hover:bg-zinc-700' : ''}`}
          >
            Full Code
          </Button>
          <Button
            variant={codeTab === 'head' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleCodeTabChange('head')}
            className={`h-7 px-3 text-xs ${codeTab !== 'head' ? 'text-zinc-300 hover:text-white hover:bg-zinc-700' : ''}`}
          >
            Head
          </Button>
          <Button
            variant={codeTab === 'body' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleCodeTabChange('body')}
            className={`h-7 px-3 text-xs ${codeTab !== 'body' ? 'text-zinc-300 hover:text-white hover:bg-zinc-700' : ''}`}
          >
            Body
          </Button>
        </div>
        
        {/* Monaco Editor - Full screen */}
        <div className="flex-1 min-h-0 overflow-hidden bg-zinc-900">
          <SmartCodeEditor
            value={getCurrentContent()}
            onChange={handleContentChange}
            language="html"
            theme="vs-dark"
            height="100%"
          />
        </div>
        
        {/* Footer with Apply button */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-zinc-700 bg-zinc-800 shrink-0">
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
      </FullscreenDialogContent>
    </Dialog>
  );
}
