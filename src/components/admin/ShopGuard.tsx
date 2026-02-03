import { useShop } from '@/contexts/ShopContext';
import { Store, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ShopGuardProps {
  children: React.ReactNode;
}

export function ShopGuard({ children }: ShopGuardProps) {
  const { currentShop, isLoading, availableShops } = useShop();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Store className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">কোনো শপ নির্বাচন করা হয়নি</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          {availableShops.length > 0
            ? 'উপরের মেনু থেকে একটি শপ নির্বাচন করুন'
            : 'প্রথমে একটি শপ তৈরি করুন'
          }
        </p>
        {availableShops.length === 0 && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            নতুন শপ তৈরি করুন
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
