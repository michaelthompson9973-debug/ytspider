import { useLanguage } from '@/contexts/LanguageContext';
import { useInvoiceHistory, type Invoice } from '@/hooks/useInvoiceHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileText } from 'lucide-react';

interface BillingHistoryProps {
  limit?: number;
}

export function BillingHistory({ limit }: BillingHistoryProps) {
  const { t, language } = useLanguage();
  const { invoices, isLoading } = useInvoiceHistory(limit);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400">
            ✅ {t('billing.paid')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600 dark:text-amber-400 dark:border-amber-400">
            ⏳ {t('billing.pending')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            ❌ {t('billing.failed')}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📜 {t('billing.billingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📜 {t('billing.billingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('billing.noInvoices')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📜 {t('billing.billingHistory')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('billing.date')}</TableHead>
              <TableHead>{t('billing.invoiceId')}</TableHead>
              <TableHead>{t('billing.amount')}</TableHead>
              <TableHead>{t('billing.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{formatDate(invoice.date)}</TableCell>
                <TableCell className="font-mono text-sm">{invoice.invoiceId}</TableCell>
                <TableCell className="font-digit">{invoice.currency === 'BDT' ? '৳' : invoice.currency}{invoice.amount}</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" disabled>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {limit && invoices.length >= limit && (
          <div className="mt-4 text-center">
            <Button variant="outline">
              {t('billing.viewAllInvoices')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
