import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Section } from './types';
import { SectionItem } from './SectionItem';

interface SectionListProps {
  sections: Section[];
  activeSection: Section | null;
  previewingSections: Set<string>;
  onSelectSection: (section: Section) => void;
  onTogglePreview: (sectionId: string) => void;
  onAddSection: (name: string, html: string) => void;
  onDuplicateSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onReorderSections: (newOrder: { id: string; sort_order: number }[]) => void;
  isAdding: boolean;
}

const defaultSectionHtml = `<section class="py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">Section Title</h2>
    <p>Your content here...</p>
  </div>
</section>`;

export function SectionList({
  sections,
  activeSection,
  previewingSections,
  onSelectSection,
  onTogglePreview,
  onAddSection,
  onDuplicateSection,
  onDeleteSection,
  onReorderSections,
  isAdding,
}: SectionListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    const newSections = [...sections];
    const [movedSection] = newSections.splice(oldIndex, 1);
    newSections.splice(newIndex, 0, movedSection);

    const newOrder = newSections.map((section, index) => ({
      id: section.id,
      sort_order: index,
    }));

    onReorderSections(newOrder);
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    onAddSection(newSectionName.trim(), defaultSectionHtml);
    setNewSectionName('');
    setDialogOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Sections</h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No sections yet
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SectionItem
                  key={section.id}
                  section={section}
                  isActive={activeSection?.id === section.id}
                  showPreview={previewingSections.has(section.id)}
                  onSelect={() => onSelectSection(section)}
                  onTogglePreview={() => onTogglePreview(section.id)}
                  onDuplicate={() => onDuplicateSection(section)}
                  onDelete={() => onDeleteSection(section.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Section Name</Label>
              <Input
                id="section-name"
                placeholder="e.g. Hero, Features, Pricing"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSection} disabled={isAdding || !newSectionName.trim()}>
              {isAdding ? 'Adding...' : 'Add Section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
