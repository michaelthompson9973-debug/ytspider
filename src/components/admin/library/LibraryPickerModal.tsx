import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, CheckSquare, XSquare, Expand, X, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { supabase } from '@/integrations/supabase/client';
import { LibraryComponent, componentCategories } from './types';
import { cn } from '@/lib/utils';

interface LibraryPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (components: LibraryComponent[]) => void;
}

// Generate preview HTML with proper fonts (scaled for thumbnail)
function generateThumbnailHtml(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            heading: ['Hind Siliguri', 'sans-serif'],
            body: ['Anek Bangla', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      font-family: 'Anek Bangla', sans-serif !important;
      overflow: hidden;
    }
    body {
      transform: scale(0.25);
      transform-origin: top left;
      width: 400%;
      height: 400%;
    }
    h1, h2, h3, h4, h5, h6,
    .text-xl, .text-2xl, .text-3xl, .text-4xl, .text-5xl, .text-6xl,
    [class*="font-bold"], [class*="font-semibold"],
    .font-heading {
      font-family: 'Hind Siliguri', sans-serif !important;
    }
    p, span, div, li, a, label, input, textarea, button, td, th,
    .font-body {
      font-family: 'Anek Bangla', sans-serif !important;
    }
  </style>
</head>
<body>${html}</body>
</html>`;
}

// Generate fullscreen preview HTML (no scaling)
function generateFullPreviewHtml(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            heading: ['Hind Siliguri', 'sans-serif'],
            body: ['Anek Bangla', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      font-family: 'Anek Bangla', sans-serif !important;
    }
    h1, h2, h3, h4, h5, h6,
    .text-xl, .text-2xl, .text-3xl, .text-4xl, .text-5xl, .text-6xl,
    [class*="font-bold"], [class*="font-semibold"],
    .font-heading {
      font-family: 'Hind Siliguri', sans-serif !important;
    }
    p, span, div, li, a, label, input, textarea, button, td, th,
    .font-body {
      font-family: 'Anek Bangla', sans-serif !important;
    }
  </style>
</head>
<body>${html}</body>
</html>`;
}

export function LibraryPickerModal({ open, onOpenChange, onSelect }: LibraryPickerModalProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedComponent, setExpandedComponent] = useState<LibraryComponent | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const { data: components = [], isLoading } = useQuery({
    queryKey: ['component-library-picker', category],
    queryFn: async () => {
      let query = supabase
        .from('component_library')
        .select('*')
        .order('name');

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LibraryComponent[];
    },
    enabled: open,
  });

  const filteredComponents = useMemo(() => 
    components.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    ),
    [components, search]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredComponents.map(c => c.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    const selectedComponents = components.filter(c => selectedIds.has(c.id));
    if (selectedComponents.length > 0) {
      onSelect(selectedComponents);
      onOpenChange(false);
      setSelectedIds(new Set());
      setSearch('');
      setCategory('all');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedIds(new Set());
    setSearch('');
    setCategory('all');
    setExpandedComponent(null);
  };

  const handleExpandPreview = (e: React.MouseEvent, component: LibraryComponent) => {
    e.stopPropagation();
    setExpandedComponent(component);
    setPreviewMode('desktop');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Choose from Library
            </DialogTitle>
          </DialogHeader>

          {/* Search and Filter */}
          <div className="flex items-center gap-3 pb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {componentCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select All / Clear All */}
          {filteredComponents.length > 0 && (
            <div className="flex items-center justify-between pb-3 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedIds.size === 0}
                className="text-xs"
              >
                <XSquare className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          )}

          {/* Component Grid */}
          <div className="flex-1 overflow-y-auto min-h-[350px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading...
              </div>
            ) : filteredComponents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <BookOpen className="h-10 w-10 opacity-50" />
                <p>No components found</p>
                <p className="text-sm">Add components in Library page first</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredComponents.map((component) => {
                  const isSelected = selectedIds.has(component.id);
                  const thumbnailHtml = generateThumbnailHtml(component.html);
                  
                  return (
                    <div
                      key={component.id}
                      onClick={() => toggleSelect(component.id)}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:shadow-md group",
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-muted hover:border-muted-foreground/30"
                      )}
                    >
                      {/* Preview iframe */}
                      <div className="aspect-video bg-muted overflow-hidden relative">
                        <iframe
                          srcDoc={thumbnailHtml}
                          className="w-full h-full pointer-events-none"
                          sandbox="allow-scripts allow-same-origin"
                          title={component.name}
                        />
                        {/* Selection overlay */}
                        <div className={cn(
                          "absolute inset-0 transition-colors",
                          isSelected ? "bg-primary/10" : "bg-transparent"
                        )} />
                        {/* Expand button */}
                        <button
                          onClick={(e) => handleExpandPreview(e, component)}
                          className="absolute top-2 right-2 p-1.5 bg-background/90 hover:bg-background rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Expand preview"
                        >
                          <Expand className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Component info */}
                      <div className="p-2 flex items-start gap-2 bg-background">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(component.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm line-clamp-1">{component.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{component.category}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="pt-4 border-t flex-row justify-between sm:justify-between">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              {selectedIds.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size}টি সিলেক্টেড
                </span>
              )}
              <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
                Add Sections
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Preview Modal */}
      {expandedComponent && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{expandedComponent.name}</h3>
              <span className="text-sm text-muted-foreground capitalize">({expandedComponent.category})</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Device Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={cn(
                    "p-2 rounded transition-colors",
                    previewMode === 'desktop' 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  title="Desktop view"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={cn(
                    "p-2 rounded transition-colors",
                    previewMode === 'mobile' 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  title="Mobile view"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpandedComponent(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Preview Area */}
          <div className="flex-1 overflow-auto p-4 flex justify-center">
            <div 
              className={cn(
                "bg-white rounded-lg shadow-lg overflow-hidden transition-all",
                previewMode === 'mobile' ? "w-[390px]" : "w-full max-w-6xl"
              )}
              style={{ height: 'fit-content', minHeight: '400px' }}
            >
              <iframe
                srcDoc={generateFullPreviewHtml(expandedComponent.html)}
                className="w-full min-h-[600px]"
                style={{ height: previewMode === 'mobile' ? '844px' : '100%' }}
                sandbox="allow-scripts allow-same-origin"
                title={`${expandedComponent.name} - Full Preview`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
