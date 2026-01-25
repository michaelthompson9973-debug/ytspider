import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Section } from './types';

interface SectionEditorProps {
  section: Section | null;
  onSave: (data: { id: string; name: string; html: string }) => void;
  isSaving: boolean;
}

export function SectionEditor({ section, onSave, isSaving }: SectionEditorProps) {
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
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select a section to edit
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="section-name" className="text-xs">Section Name</Label>
          <Input
            id="section-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Section name"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="mt-5"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <Label className="text-xs mb-1">HTML Content</Label>
        <textarea
          className="flex-1 w-full font-mono text-sm p-4 border rounded-md bg-muted resize-none"
          value={html}
          onChange={(e) => {
            setHtml(e.target.value);
            setIsDirty(true);
          }}
          placeholder="<section>Your HTML content here...</section>"
        />
      </div>
    </div>
  );
}
