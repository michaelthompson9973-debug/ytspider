import { useLanguage } from '@/contexts/LanguageContext';
import { useShop, Shop } from '@/contexts/ShopContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ShopStats {
  shop: Shop;
  ordersCount: number;
  revenue: number;
  productsCount: number;
  pagesCount: number;
}

interface ShopPerformanceTableProps {
  shopStats: ShopStats[];
  isLoading: boolean;
}

export function ShopPerformanceTable({ shopStats, isLoading }: ShopPerformanceTableProps) {
  const { t } = useLanguage();
  const { switchShop } = useShop();

  const getShopInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewShop = async (shopId: string) => {
    await switchShop(shopId);
  };

  if (isLoading) {
    return <ShopPerformanceTableSkeleton />;
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <h3 className="text-base font-semibold">{t('platform.shopPerformance')}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-accent/50">
            <TableHead className="font-medium">{t('platform.shopName')}</TableHead>
            <TableHead className="text-right font-medium">{t('platform.orders')}</TableHead>
            <TableHead className="text-right font-medium">{t('platform.revenue')}</TableHead>
            <TableHead className="text-right font-medium">{t('platform.products')}</TableHead>
            <TableHead className="text-right font-medium">{t('platform.pages')}</TableHead>
            <TableHead className="text-center font-medium">{t('platform.status')}</TableHead>
            <TableHead className="text-right font-medium">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shopStats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {t('common.noData')}
              </TableCell>
            </TableRow>
          ) : (
            shopStats.map((stat) => (
              <TableRow key={stat.shop.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={stat.shop.logo_url || undefined} alt={stat.shop.name} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getShopInitials(stat.shop.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium">{stat.shop.name}</span>
                      <p className="text-xs text-muted-foreground">{stat.shop.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {stat.ordersCount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  ৳{stat.revenue.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {stat.productsCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {stat.pagesCount}
                </TableCell>
                <TableCell className="text-center">
                  {stat.shop.is_active ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {t('common.active')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {t('common.inactive')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleViewShop(stat.shop.id)}
                  >
                    {t('platform.viewShop')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function ShopPerformanceTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
