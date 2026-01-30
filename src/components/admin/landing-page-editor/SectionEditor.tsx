import { useState, useEffect, forwardRef, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Save, FileCode, Eye, Code, Maximize2, Type } from 'lucide-react';
import { Section, ThemeConfig, defaultThemeConfig } from './types';
import { AiEnhanceButton } from './AiEnhanceButton';
import { FullscreenCodeModal } from './FullscreenCodeModal';
import { generatePreviewHTML } from './themeUtils';
import { parseHtmlParts, mergeHtmlParts } from './htmlParseUtils';

interface SectionEditorProps {
  section: Section | null;
  themeConfig?: ThemeConfig;
  onSave: (data: { id: string; name: string; html: string }) => void;
  isSaving: boolean;
}

export const SectionEditor = forwardRef<HTMLDivElement, SectionEditorProps>(
  function SectionEditor({ section, themeConfig = defaultThemeConfig, onSave, isSaving }, ref) {
    const [name, setName] = useState('');
    const [html, setHtml] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [viewMode, setViewMode] = useState<'preview' | 'richtext' | 'code'>('richtext');
    const [codeFullscreenOpen, setCodeFullscreenOpen] = useState(false);
    const [codeTab, setCodeTab] = useState<'full' | 'head' | 'body'>('full');
    const [headCode, setHeadCode] = useState('');
    const [bodyCode, setBodyCode] = useState('');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Handle code tab switching with parse/merge
    const handleCodeTabChange = useCallback((newTab: 'full' | 'head' | 'body') => {
      if (newTab === codeTab) return;
      
      if (codeTab === 'full') {
        // Switching from full → head/body: parse
        const parts = parseHtmlParts(html);
        setHeadCode(parts.head);
        setBodyCode(parts.body);
      } else if (newTab === 'full') {
        // Switching from head/body → full: merge
        const merged = mergeHtmlParts(headCode, bodyCode);
        setHtml(merged);
        setIsDirty(true);
      }
      
      setCodeTab(newTab);
    }, [codeTab, html, headCode, bodyCode]);

    // Sync head/body changes back to full html when editing in split mode
    const handleHeadChange = useCallback((newHead: string) => {
      setHeadCode(newHead);
      setHtml(mergeHtmlParts(newHead, bodyCode));
      setIsDirty(true);
    }, [bodyCode]);

    const handleBodyChange = useCallback((newBody: string) => {
      setBodyCode(newBody);
      setHtml(mergeHtmlParts(headCode, newBody));
      setIsDirty(true);
    }, [headCode]);

    useEffect(() => {
      if (section) {
        setName(section.name);
        setHtml(section.html);
        setIsDirty(false);
        setCodeTab('full');
        // Parse for head/body views
        const parts = parseHtmlParts(section.html);
        setHeadCode(parts.head);
        setBodyCode(parts.body);
      }
    }, [section]);

    const handleSave = () => {
      if (!section) return;
      onSave({ id: section.id, name, html });
      setIsDirty(false);
    };

    // Generate preview HTML for this single section
    const previewHtml = generatePreviewHTML(html, themeConfig, window.location.origin);

    if (!section) {
      return (
        <div ref={ref} className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
          <FileCode className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm text-center">
            Select a section from the list to edit its HTML content
          </p>
        </div>
      );
    }

    return (
      <div ref={ref} className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b">
          <div className="flex-1 space-y-1">
            <Label htmlFor="section-name" className="text-xs text-muted-foreground">
              Section Name
            </Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Section name"
              className="h-9"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            size="sm"
            className="mt-5"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* View Mode Toggle & AI Button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'richtext' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('richtext')}
              className="h-7 px-2 text-xs"
            >
              <Type className="h-3.5 w-3.5 mr-1" />
              এডিটর
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('preview')}
              className="h-7 px-2 text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              প্রিভিউ
            </Button>
            <Button
              variant={viewMode === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('code')}
              className="h-7 px-2 text-xs"
            >
              <Code className="h-3.5 w-3.5 mr-1" />
              HTML
            </Button>
          </div>
          {viewMode === 'code' && (
            <div className="flex items-center gap-1">
              <AiEnhanceButton
                html={html}
                onEnhanced={(enhancedHtml) => {
                  setHtml(enhancedHtml);
                  const parts = parseHtmlParts(enhancedHtml);
                  setHeadCode(parts.head);
                  setBodyCode(parts.body);
                  setIsDirty(true);
                }}
                disabled={isSaving}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCodeFullscreenOpen(true)}
                className="h-7 px-2"
                title="Expand to fullscreen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Code Sub-tabs */}
        {viewMode === 'code' && (
          <div className="flex items-center gap-1 mb-2">
            <Button
              variant={codeTab === 'full' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleCodeTabChange('full')}
              className="h-7 px-3 text-xs"
            >
              Full Code
            </Button>
            <Button
              variant={codeTab === 'head' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleCodeTabChange('head')}
              className="h-7 px-3 text-xs"
            >
              Head
            </Button>
            <Button
              variant={codeTab === 'body' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleCodeTabChange('body')}
              className="h-7 px-3 text-xs"
            >
              Body
            </Button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-auto">
          {viewMode === 'richtext' ? (
            <RichTextEditor
              value={html}
              onChange={(newHtml) => {
                setHtml(newHtml);
                setIsDirty(true);
              }}
              className="h-full"
            />
          ) : viewMode === 'preview' ? (
            <div className="h-full border rounded-md bg-background overflow-hidden">
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="Section Preview"
              />
            </div>
          ) : codeTab === 'full' ? (
            <textarea
              className="flex-1 w-full h-full font-mono text-sm p-4 border rounded-md bg-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={html}
              onChange={(e) => {
                setHtml(e.target.value);
                setIsDirty(true);
              }}
              placeholder="<section>Your HTML content here...</section>"
              spellCheck={false}
            />
          ) : codeTab === 'head' ? (
            <textarea
              className="flex-1 w-full h-full font-mono text-sm p-4 border rounded-md bg-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={headCode}
              onChange={(e) => handleHeadChange(e.target.value)}
              placeholder="<style>&#10;  /* CSS styles here */&#10;</style>&#10;&#10;<script>&#10;  // JavaScript here&#10;</script>"
              spellCheck={false}
            />
          ) : (
            <textarea
              className="flex-1 w-full h-full font-mono text-sm p-4 border rounded-md bg-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={bodyCode}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="<section>&#10;  Your HTML content here...&#10;</section>"
              spellCheck={false}
            />
          )}
        </div>

        {/* Mobile Sticky Save Button */}
        {isDirty && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full shadow-lg"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}

        {/* Fullscreen Code Modal */}
        <FullscreenCodeModal
          open={codeFullscreenOpen}
          onOpenChange={setCodeFullscreenOpen}
          html={html}
          onHtmlChange={(newHtml) => {
            setHtml(newHtml);
            setIsDirty(true);
          }}
          sectionName={name}
        />
      </div>
    );
  }
);
