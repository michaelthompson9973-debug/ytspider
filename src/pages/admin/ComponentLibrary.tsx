import { useState } from 'react';
import { Plus, BookOpen, Filter } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ComponentCard,
  ComponentEditor,
  ComponentPreviewModal,
  componentCategories,
  useComponentLibrary,
  LibraryComponent,
} from '@/components/admin/library';

export default function ComponentLibrary() {
  const {
    components,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    createComponent,
    updateComponent,
    deleteComponent,
    isCreating,
    isUpdating,
  } = useComponentLibrary();

  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<LibraryComponent | null>(null);
  const [previewComponent, setPreviewComponent] = useState<LibraryComponent | null>(null);

  const handleAdd = () => {
    setEditingComponent(null);
    setEditorOpen(true);
  };

  const handleEdit = (component: LibraryComponent) => {
    setEditingComponent(component);
    setEditorOpen(true);
  };

  const handlePreview = (component: LibraryComponent) => {
    setPreviewComponent(component);
    setPreviewOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Component Library</h1>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Component
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {componentCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {components.length} component{components.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading components...
          </div>
        ) : components.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No components yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first reusable HTML component to the library
            </p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onPreview={handlePreview}
                onEdit={handleEdit}
                onDelete={deleteComponent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <ComponentEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        component={editingComponent}
        onSave={createComponent}
        onUpdate={updateComponent}
        isSaving={isCreating || isUpdating}
      />

      {/* Preview Modal */}
      <ComponentPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        component={previewComponent}
      />
    </AdminLayout>
  );
}
