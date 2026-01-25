import { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, FileCode } from 'lucide-react';
import { Section } from './types';

interface SectionEditorProps {
  section: Section | null;
  onSave: (data: { id: string; name: string; html: string }) => void;
  isSaving: boolean;
}

export const SectionEditor = forwardRef<HTMLDivElement, SectionEditorProps>(
  function SectionEditor({ section, onSave, isSaving }, ref) {
    const [name, setName] = useState('');
    const [html, setHtml] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
      if (section) {
        setName(section.name);
        setHtml(section.html);
        setIsDirty(false);
      }
    }, [section]);

    const handleSave = () => {
      if (!section) return;
      onSave({ id: section.id, name, html });
      setIsDirty(false);
    };

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

        {/* Editor */}
        <div className="flex-1 flex flex-col min-h-0">
          <Label className="text-xs text-muted-foreground mb-2">HTML Content</Label>
          <textarea
            className="flex-1 w-full font-mono text-sm p-4 border rounded-md bg-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            value={html}
            onChange={(e) => {
              setHtml(e.target.value);
              setIsDirty(true);
            }}
            placeholder="<section>Your HTML content here...</section>"
            spellCheck={false}
          />
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
      </div>
    );
  }
);
