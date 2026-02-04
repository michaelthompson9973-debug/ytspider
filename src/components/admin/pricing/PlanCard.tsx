import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Star, Package } from 'lucide-react';
import { PricingPlan, formatLimit, isUnlimited } from '@/hooks/usePricingPlans';
import { useLanguage } from '@/contexts/LanguageContext';

interface PlanCardProps {
  plan: PricingPlan;
  onEdit: (plan: PricingPlan) => void;
  onDelete: (plan: PricingPlan) => void;
}

export function PlanCard({ plan, onEdit, onDelete }: PlanCardProps) {
  const { language } = useLanguage();
  const name = language === 'bn' ? plan.name : plan.name_en;
  const unlimitedText = language === 'bn' ? 'আনলিমিটেড' : 'Unlimited';
  
  return (
    <Card className={`relative ${plan.is_featured ? 'border-primary ring-2 ring-primary/20' : ''}`}>
      {plan.is_featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Star className="h-3 w-3 mr-1" />
            {language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{name}</h3>
          </div>
          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
            {plan.is_active ? (language === 'bn' ? 'সক্রিয়' : 'Active') : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
          </Badge>
        </div>
        
        <div className="mt-2">
          <span className="text-2xl font-bold">৳{plan.price_monthly.toLocaleString('bn-BD')}</span>
          <span className="text-muted-foreground">/{language === 'bn' ? 'মাস' : 'month'}</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {plan.duration_days} {language === 'bn' ? 'দিন' : 'days'}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{language === 'bn' ? 'শপ' : 'Shops'}</span>
            <span className="font-medium">{formatLimit(plan.max_shops, unlimitedText)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{language === 'bn' ? 'অর্ডার/মাস' : 'Orders/month'}</span>
            <span className="font-medium">{formatLimit(plan.max_orders_per_month, unlimitedText)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{language === 'bn' ? 'টিম মেম্বার' : 'Team members'}</span>
            <span className="font-medium">{formatLimit(plan.max_team_members, unlimitedText)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{language === 'bn' ? 'ল্যান্ডিং পেজ' : 'Landing pages'}</span>
            <span className="font-medium">{formatLimit(plan.max_landing_pages, unlimitedText)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{language === 'bn' ? 'প্রোডাক্ট' : 'Products'}</span>
            <span className="font-medium">{formatLimit(plan.max_products, unlimitedText)}</span>
          </div>
        </div>
        
        {plan.features && plan.features.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              {language === 'bn' ? 'ফিচারস' : 'Features'}
            </p>
            <div className="flex flex-wrap gap-1">
              {plan.features.slice(0, 3).map((feature, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {plan.features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{plan.features.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(plan)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            {language === 'bn' ? 'এডিট' : 'Edit'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(plan)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
