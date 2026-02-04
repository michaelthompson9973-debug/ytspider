import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Trash2, Edit2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

// Mock data - in real implementation, this would come from Stripe
const mockPaymentMethods: PaymentMethod[] = [];

export function PaymentMethodCard() {
  const { t } = useLanguage();
  const [paymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);

  const getCardIcon = (type: PaymentMethod['type']) => {
    // In a real implementation, you'd use actual card brand icons
    return <CreditCard className="h-6 w-6" />;
  };

  if (paymentMethods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💳 {t('billing.paymentMethod')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">{t('billing.noPaymentMethod')}</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('billing.addCard')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          💳 {t('billing.paymentMethod')}
        </CardTitle>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {t('billing.addCard')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.map((method) => (
          <div 
            key={method.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-4">
              {getCardIcon(method.type)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">•••• •••• •••• {method.last4}</span>
                  {method.isDefault && (
                    <Badge variant="secondary">{t('billing.defaultCard')}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="capitalize">{method.type}</span>
                  {' | '}
                  {t('billing.expires')}: {method.expiryMonth}/{method.expiryYear}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
