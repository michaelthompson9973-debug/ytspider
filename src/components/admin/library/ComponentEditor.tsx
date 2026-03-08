import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LibraryComponent, componentCategories } from './types';

interface ComponentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component?: LibraryComponent | null;
  onSave: (data: { name: string; category: string; html: string; min_plan_tier: string }) => void;
  onUpdate: (data: { id: string; name?: string; category?: string; html?: string; min_plan_tier?: string }) => void;
  isSaving: boolean;
}

export function ComponentEditor({
  open,
  onOpenChange,
  component,
  onSave,
  onUpdate,
  isSaving,
}: ComponentEditorProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [html, setHtml] = useState('');
  const [minPlanTier, setMinPlanTier] = useState('free');

  const isEditing = !!component;

  useEffect(() => {
    if (component) {
      setName(component.name);
      setCategory(component.category);
      setHtml(component.html);
      setMinPlanTier(component.min_plan_tier || 'free');
    } else {
      setName('');
      setCategory('general');
      setHtml(defaultHtml);
      setMinPlanTier('free');
    }
  }, [component, open]);

  const handleSubmit = () => {
    if (!name.trim() || !html.trim()) return;

    if (isEditing) {
      onUpdate({ id: component.id, name, category, html });
    } else {
      onSave({ name, category, html });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Component' : 'Add Component'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Hero Section"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {componentCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="html">HTML Code</Label>
            <Textarea
              id="html"
              placeholder="<section>...</section>"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="font-mono text-sm min-h-[300px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !name.trim() || !html.trim()}>
            {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Add Component'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const defaultHtml = `<section class="py-16 px-4 bg-white">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-3xl font-bold mb-4">Section Title</h2>
    <p class="text-gray-600 mb-8">Your content goes here...</p>
    <button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
      Call to Action
    </button>
  </div>
</section>`;
