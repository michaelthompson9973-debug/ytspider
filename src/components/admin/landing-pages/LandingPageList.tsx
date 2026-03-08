import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layers, MoreHorizontal, ExternalLink, Pencil, Copy, Trash2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function LandingPageList({ pages, selectedIds, toggleSelection, enhancedStats, onBuilder, onEdit, onDuplicate, onDelete }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {pages.map((page) => (
            <div
              key={page.id}
              className={cn("flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors", selectedIds.includes(page.id) && "bg-primary/5")}
            >
              <Checkbox checked={selectedIds.includes(page.id)} onCheckedChange={() => toggleSelection(page.id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold truncate font-heading">/{page.slug}</h3>
                  <Badge
                    variant={page.published ? 'default' : 'secondary'}
                    className={cn("shrink-0 font-medium text-xs", page.published && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20")}
                  >
                    {page.published ? 'পাবলিশড' : 'ড্রাফট'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{page.products?.name ?? 'প্রোডাক্ট নেই'}</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs flex items-center gap-1"><ShoppingCart className="h-3 w-3" />{enhancedStats?.pageStats?.[page.id]?.orders ?? 0}</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">৳{(enhancedStats?.pageStats?.[page.id]?.revenue ?? 0).toLocaleString('bn-BD')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {page.published && (
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onBuilder(page)} className="font-medium h-8">
                  <Layers className="h-3.5 w-3.5 mr-1.5" />এডিট
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(page)}><Pencil className="h-4 w-4 mr-2" />সেটিংস</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(page)}><Copy className="h-4 w-4 mr-2" />ডুপ্লিকেট</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(page.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />ডিলিট
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
