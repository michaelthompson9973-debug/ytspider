import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layers, MoreHorizontal, ExternalLink, Pencil, Copy, Trash2, ShoppingCart, Wallet, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import type { LandingPage, EnhancedStats } from './types';

interface Props {
  pages: LandingPage[];
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  enhancedStats: EnhancedStats | null | undefined;
  onBuilder: (page: LandingPage) => void;
  onEdit: (page: LandingPage) => void;
  onDuplicate: (page: LandingPage) => void;
  onDelete: (id: string) => void;
}

export function LandingPageGrid({ pages, selectedIds, toggleSelection, enhancedStats, onBuilder, onEdit, onDuplicate, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pages.map((page, index) => (
        <Card
          key={page.id}
          className={cn(
            "group hover:shadow-lg transition-all duration-200",
            selectedIds.includes(page.id) && "ring-2 ring-primary border-primary",
            "animate-in fade-in-50 slide-in-from-bottom-2"
          )}
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <Checkbox checked={selectedIds.includes(page.id)} onCheckedChange={() => toggleSelection(page.id)} className="mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold truncate font-heading">/{page.slug}</CardTitle>
                  <Badge
                    variant={page.published ? 'default' : 'secondary'}
                    className={cn("shrink-0 text-[10px] px-1.5", page.published && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20")}
                  >
                    {page.published ? 'পাবলিশড' : 'ড্রাফট'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{page.products?.name ?? 'কোনো প্রোডাক্ট নেই'}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 text-xs text-muted-foreground py-2.5 my-2 border-t border-b">
              <div className="flex items-center gap-1"><ShoppingCart className="h-3 w-3" /><span>{enhancedStats?.pageStats?.[page.id]?.orders ?? 0} অর্ডার</span></div>
              <div className="flex items-center gap-1"><Wallet className="h-3 w-3" /><span>৳{(enhancedStats?.pageStats?.[page.id]?.revenue ?? 0).toLocaleString('bn-BD')}</span></div>
              <div className="flex items-center gap-1 ml-auto"><Clock className="h-3 w-3" /><span className="truncate max-w-[80px]">{formatDistanceToNow(new Date(page.updated_at), { addSuffix: true, locale: bn })}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={() => onBuilder(page)} className="flex-1 font-medium h-8">
                <Layers className="h-3.5 w-3.5 mr-1.5" />এডিট
              </Button>
              <PageDropdown page={page} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PageDropdown({ page, onEdit, onDuplicate, onDelete }: { page: LandingPage; onEdit: (p: LandingPage) => void; onDuplicate: (p: LandingPage) => void; onDelete: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {page.published && (
          <DropdownMenuItem asChild>
            <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" />লাইভ দেখুন</a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onEdit(page)}><Pencil className="h-4 w-4 mr-2" />সেটিংস</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(page)}><Copy className="h-4 w-4 mr-2" />ডুপ্লিকেট</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(page.id)} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />ডিলিট
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
