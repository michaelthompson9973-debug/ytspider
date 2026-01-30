import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  onSelect: (component: LibraryComponent) => void;
}

export function LibraryPickerModal({ open, onOpenChange, onSelect }: LibraryPickerModalProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<LibraryComponent | null>(null);

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

  const filteredComponents = components.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = () => {
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
      setSelected(null);
      setSearch('');
      setCategory('all');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Choose from Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 pb-4">
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

        <div className="flex-1 overflow-y-auto min-h-[300px]">
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
            <div className="grid grid-cols-2 gap-3">
              {filteredComponents.map((component) => (
                <button
                  key={component.id}
                  onClick={() => setSelected(component)}
                  className={cn(
                    "text-left p-3 rounded-lg border-2 transition-all hover:bg-accent",
                    selected?.id === component.id
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  )}
                >
                  <div className="font-medium text-sm line-clamp-1">{component.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{component.category}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selected}>
            Use Component
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
