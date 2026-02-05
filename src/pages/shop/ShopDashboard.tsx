import { ShopLayout } from '@/components/shop';
import { useShop } from '@/contexts/ShopContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, FileText, TrendingUp } from 'lucide-react';

export default function ShopDashboard() {
  const { currentShop } = useShop();

  return (
    <ShopLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">স্বাগতম, {currentShop?.name}!</h1>
          <p className="text-muted-foreground">আপনার শপের সংক্ষিপ্ত বিবরণ</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">মোট অর্ডার</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">এই মাসে</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">প্রোডাক্ট</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">সক্রিয় প্রোডাক্ট</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ল্যান্ডিং পেজ</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">পাবলিশড</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">রেভিনিউ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳0</div>
              <p className="text-xs text-muted-foreground">এই মাসে</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>সাম্প্রতিক কার্যক্রম</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              এখনো কোনো কার্যক্রম নেই
            </p>
          </CardContent>
        </Card>
      </div>
    </ShopLayout>
  );
}
