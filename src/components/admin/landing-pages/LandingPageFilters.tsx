import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, LayoutGrid, List } from 'lucide-react';
import type { StatusFilter, EnhancedStats } from './types';

interface Props {
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (m: 'grid' | 'list') => void;
  stats: EnhancedStats | null | undefined;
  setSelectedIds: (ids: string[]) => void;
  // Select all
  filteredCount: number;
  selectedCount: number;
  onSelectAll: () => void;
}

export function LandingPageFilters({
  statusFilter, setStatusFilter, searchQuery, setSearchQuery,
  viewMode, setViewMode, stats, setSelectedIds,
  filteredCount, selectedCount, onSelectAll,
}: Props) {
  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'সব', count: stats?.total ?? 0 },
    { key: 'published', label: 'পাবলিশড', count: stats?.published ?? 0 },
    { key: 'draft', label: 'ড্রাফট', count: stats?.draft ?? 0 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setStatusFilter(tab.key); setSelectedIds([]); }}
              className="text-xs sm:text-sm"
            >
              {tab.label}
              <Badge variant={statusFilter === tab.key ? 'secondary' : 'outline'} className="ml-1.5 text-[10px] px-1.5 py-0">
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="পেজ খুঁজুন..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="flex items-center border rounded-lg p-0.5">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredCount > 0 && (
        <div className="flex items-center gap-3 px-1">
          <Checkbox checked={selectedCount === filteredCount && filteredCount > 0} onCheckedChange={onSelectAll} />
          <span className="text-sm text-muted-foreground">
            {selectedCount > 0 ? `${selectedCount}টি সিলেক্টেড` : 'সব সিলেক্ট করুন'}
          </span>
        </div>
      )}
    </div>
  );
}
