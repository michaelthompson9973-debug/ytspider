import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import { ShopGuard } from '@/components/admin/ShopGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CreditCard, ChevronRight, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface Gateway {
  id: string;
  name: string;
  description: string;
  logo: string;
  supported: boolean;
  comingSoon?: boolean;
}

const gateways: Gateway[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'ক্রেডিট কার্ড, ডেবিট কার্ড, এবং আন্তর্জাতিক পেমেন্ট',
    logo: '💳',
    supported: true,
  },
  {
    id: 'sslcommerz',
    name: 'SSLCommerz',
    description: 'বাংলাদেশী পেমেন্ট গেটওয়ে — bKash, Nagad, কার্ড',
    logo: '🏦',
    supported: false,
    comingSoon: true,
  },
  {
    id: 'bkash',
    name: 'bKash',
    description: 'বাংলাদেশের সবচেয়ে জনপ্রিয় মোবাইল ওয়ালেট',
    logo: '📱',
    supported: false,
    comingSoon: true,
  },
  {
    id: 'nagad',
    name: 'Nagad',
    description: 'ডিজিটাল ফাইন্যান্সিয়াল সার্ভিস',
    logo: '📲',
    supported: false,
    comingSoon: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'গ্লোবাল পেমেন্ট প্লাটফর্ম',
    logo: '🌐',
    supported: false,
    comingSoon: true,
  },
];

export default function ApiPaymentGateway() {
  const { t } = useLanguage();
  const [activeGateway, setActiveGateway] = useState<string | null>(null);

  return (
    <AdminLayout>
      <ShopGuard>
        <div className="space-y-6 p-4 md:p-6 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              পেমেন্ট গেটওয়ে
            </h1>
            <p className="text-muted-foreground mt-1">
              সাবস্ক্রিপশন পেমেন্ট কালেক্ট করতে গেটওয়ে সেটআপ করুন
            </p>
          </div>

          {/* Active Gateway Status */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">সক্রিয় গেটওয়ে</CardTitle>
            </CardHeader>
            <CardContent>
              {activeGateway ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{gateways.find(g => g.id === activeGateway)?.logo}</span>
                  <div>
                    <p className="font-medium">{gateways.find(g => g.id === activeGateway)?.name}</p>
                    <p className="text-sm text-muted-foreground">কানেক্টেড ও সক্রিয়</p>
                  </div>
                  <Badge className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    সক্রিয়
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  কোনো গেটওয়ে সক্রিয় নেই। নিচে থেকে একটি গেটওয়ে সিলেক্ট করুন।
                </p>
              )}
            </CardContent>
          </Card>

          {/* Gateway List */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">গেটওয়ে নির্বাচন করুন</h2>
            
            {gateways.map((gw) => (
              <Card 
                key={gw.id}
                className={`transition-all ${
                  activeGateway === gw.id 
                    ? 'ring-2 ring-primary shadow-md' 
                    : 'hover:shadow-sm'
                } ${gw.comingSoon ? 'opacity-60' : ''}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Logo */}
                  <span className="text-3xl">{gw.logo}</span>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{gw.name}</p>
                      {gw.comingSoon && (
                        <Badge variant="secondary" className="text-[10px]">
                          শীঘ্রই আসছে
                        </Badge>
                      )}
                      {activeGateway === gw.id && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                          সক্রিয়
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{gw.description}</p>
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-3">
                    {gw.supported ? (
                      <Switch
                        checked={activeGateway === gw.id}
                        onCheckedChange={(checked) => setActiveGateway(checked ? gw.id : null)}
                      />
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        সেটআপ
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>দ্রষ্টব্য:</strong> একসাথে শুধু একটি গেটওয়ে সক্রিয় রাখা যায়। 
                গেটওয়ে পরিবর্তন করলে বিদ্যমান সাবস্ক্রিপশনে কোনো প্রভাব পড়বে না।
              </p>
            </CardContent>
          </Card>
        </div>
      </ShopGuard>
    </AdminLayout>
  );
}