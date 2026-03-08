import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CreditCard } from 'lucide-react';
import { useState } from 'react';

interface Gateway { id: string; name: string; description: string; logo: string; supported: boolean; comingSoon?: boolean; }

const gateways: Gateway[] = [
  { id: 'stripe', name: 'Stripe', description: 'Credit cards, debit cards, and international payments', logo: '💳', supported: true },
  { id: 'sslcommerz', name: 'SSLCommerz', description: 'Bangladesh payment gateway — bKash, Nagad, cards', logo: '🏦', supported: false, comingSoon: true },
  { id: 'bkash', name: 'bKash', description: 'Most popular mobile wallet in Bangladesh', logo: '📱', supported: false, comingSoon: true },
  { id: 'nagad', name: 'Nagad', description: 'Digital financial service', logo: '📲', supported: false, comingSoon: true },
  { id: 'paypal', name: 'PayPal', description: 'Global payment platform', logo: '🌐', supported: false, comingSoon: true },
];

export default function ApiPaymentGateway() {
  const [activeGateway, setActiveGateway] = useState<string | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6" />Payment Gateway</h1>
          <p className="text-muted-foreground mt-1">Set up a gateway to collect platform subscription payments</p>
        </div>
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base">Active Gateway</CardTitle></CardHeader>
          <CardContent>
            {activeGateway ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{gateways.find(g => g.id === activeGateway)?.logo}</span>
                <div><p className="font-medium">{gateways.find(g => g.id === activeGateway)?.name}</p><p className="text-sm text-muted-foreground">Connected & active</p></div>
                <Badge className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
              </div>
            ) : (<p className="text-sm text-muted-foreground">No gateway active. Select one below.</p>)}
          </CardContent>
        </Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Select Gateway</h2>
          {gateways.map((gw) => (
            <Card key={gw.id} className={`transition-all ${activeGateway === gw.id ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'} ${gw.comingSoon ? 'opacity-60' : ''}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="text-3xl">{gw.logo}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{gw.name}</p>
                    {gw.comingSoon && <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>}
                    {activeGateway === gw.id && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">Active</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{gw.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {gw.supported ? (<Switch checked={activeGateway === gw.id} onCheckedChange={(checked) => setActiveGateway(checked ? gw.id : null)} />) : (<Button variant="outline" size="sm" disabled>Setup</Button>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">💡 <strong>Note:</strong> Only one gateway can be active at a time. Changing gateways will not affect existing subscriptions.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}