import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Check, Download, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '/month',
    features: ['1 Shop', '100 Orders/month', '2 Team Members', 'Basic Support'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    period: '/month',
    features: ['5 Shops', 'Unlimited Orders', '10 Team Members', 'Priority Support', 'Analytics Dashboard'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    period: 'Contact Sales',
    features: ['Unlimited Shops', 'Unlimited Orders', 'Unlimited Team', '24/7 Support', 'Custom SLA', 'Dedicated Account Manager'],
    popular: false,
  },
];

const mockInvoices = [
  { id: '1', date: '15 Jan 2026', amount: 999, status: 'Paid', invoiceId: 'INV-2026-001' },
  { id: '2', date: '15 Dec 2025', amount: 999, status: 'Paid', invoiceId: 'INV-2025-012' },
  { id: '3', date: '15 Nov 2025', amount: 999, status: 'Paid', invoiceId: 'INV-2025-011' },
];

export default function ShopBilling() {
  const { t } = useLanguage();
  const { currentShop } = useShop();

  if (!currentShop) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No shop selected</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('sidebar.shopBilling')}</h1>
            <p className="text-muted-foreground">Manage your subscription and billing</p>
          </div>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are currently on the {currentShop.plan} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-lg capitalize">{currentShop.plan} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    Renews on February 15, 2026
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose the plan that fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative p-6 border rounded-lg",
                    plan.popular && "border-primary ring-2 ring-primary/20",
                    currentShop.plan === plan.id && "bg-accent/50"
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-xl">{plan.name}</h3>
                    <div className="mt-2">
                      {plan.price !== null ? (
                        <>
                          <span className="text-3xl font-bold">৳{plan.price}</span>
                          <span className="text-muted-foreground">{plan.period}</span>
                        </>
                      ) : (
                        <span className="text-lg font-semibold text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={currentShop.plan === plan.id ? "outline" : "default"}
                    disabled={currentShop.plan === plan.id}
                  >
                    {currentShop.plan === plan.id ? 'Current Plan' : plan.price !== null ? 'Upgrade' : 'Contact Sales'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View and download your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="font-mono">{invoice.invoiceId}</TableCell>
                    <TableCell>৳{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
