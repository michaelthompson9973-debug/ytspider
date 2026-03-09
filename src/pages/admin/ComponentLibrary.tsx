import { useState } from 'react';
import { Plus, BookOpen, FolderOpen, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { DynamicLayout } from '@/components/DynamicLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const isMobile = useIsMobile();

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

  // Get counts per category
  const allComponents = useComponentLibrary().components;
  const getCategoryCount = (category: string) => {
    if (category === 'all') return allComponents?.length || 0;
    return allComponents?.filter(c => c.category === category).length || 0;
  };

  const CategorySidebar = () => (
    <Collapsible open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors px-2 py-1.5">
            <span className="flex-1">Categories</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isCategoriesOpen && 'rotate-180'
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* All Category */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={selectedCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                  className="cursor-pointer"
                >
                  {selectedCategory === 'all' ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                  <span className="flex-1">All</span>
                  <span className="text-xs text-muted-foreground">{getCategoryCount('all')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Category Items */}
              {componentCategories.map((cat) => (
                <SidebarMenuItem key={cat.value}>
                  <SidebarMenuButton
                    isActive={selectedCategory === cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className="cursor-pointer"
                  >
                    {selectedCategory === cat.value ? (
                      <FolderOpen className="h-4 w-4" />
                    ) : (
                      <Folder className="h-4 w-4" />
                    )}
                    <span className="flex-1">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">{getCategoryCount(cat.value)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );

  return (
    <DynamicLayout>
      <div className="flex h-full">
        {/* Desktop Sidebar - Sticky Category Filter */}
        {!isMobile && (
          <div className="w-56 shrink-0 border-r bg-card overflow-y-auto p-2 sticky top-0 self-start h-[calc(100vh-3.5rem)]">
            <CategorySidebar />
          </div>
        )}

        {/* Main Content - Scrollable */}
        <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
              <div>
                <h1 className="text-lg md:text-2xl font-bold">Component Library</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {components.length} component{components.length !== 1 ? 's' : ''} 
                  {selectedCategory !== 'all' && ` in ${componentCategories.find(c => c.value === selectedCategory)?.label || selectedCategory}`}
                </p>
              </div>
            </div>
            <Button onClick={handleAdd} size={isMobile ? "sm" : "default"}>
              <Plus className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Add Component</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          {/* Mobile Category Filter */}
          {isMobile && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <Folder className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All ({getCategoryCount('all')})
                </SelectItem>
                {componentCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label} ({getCategoryCount(cat.value)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
                {selectedCategory === 'all' 
                  ? 'Add your first reusable HTML component to the library'
                  : `No components in ${componentCategories.find(c => c.value === selectedCategory)?.label || selectedCategory} category`
                }
              </p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
    </DynamicLayout>
  );
}
