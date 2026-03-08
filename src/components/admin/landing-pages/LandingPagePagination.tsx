import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPagesCount: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function LandingPagePagination({ page, totalPagesCount, totalItems, onPageChange }: Props) {
  if (totalPagesCount <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-muted-foreground">মোট {totalItems}টি পেজ</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />আগের
        </Button>
        <span className="text-sm text-muted-foreground">{page + 1} / {totalPagesCount}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPagesCount - 1} onClick={() => onPageChange(page + 1)}>
          পরের<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
