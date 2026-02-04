import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Star, Zap, Shield, Headphones } from 'lucide-react';
import { usePricingPlans, formatLimit, isUnlimited } from '@/hooks/usePricingPlans';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Pricing() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: plans, isLoading } = usePricingPlans(true);
  const unlimitedText = language === 'bn' ? 'আনলিমিটেড' : 'Unlimited';
  
  const handleBuy = (planSlug: string, isContactSales: boolean) => {
    if (isContactSales) {
      // TODO: Open contact form or redirect to contact page
      window.open('mailto:sales@ytspider.com?subject=Enterprise Plan Inquiry', '_blank');
    } else {
      navigate(`/checkout?plan=${planSlug}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Ytspider</h1>
          <Button variant="outline" onClick={() => navigate('/auth')}>
            {language === 'bn' ? 'লগইন' : 'Login'}
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4" variant="secondary">
            <Zap className="h-3 w-3 mr-1" />
            {language === 'bn' ? '৭ দিনের মানি-ব্যাক গ্যারান্টি' : '7-day Money-Back Guarantee'}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
            {language === 'bn' 
              ? 'আপনার ব্যবসার জন্য সেরা প্ল্যান বেছে নিন'
              : 'Choose the Best Plan for Your Business'
            }
          </h1>
          <p className="text-lg text-muted-foreground">
            {language === 'bn'
              ? 'সব প্ল্যানে সম্পূর্ণ ফিচার, কোনো লুকানো চার্জ নেই। যেকোনো সময় বাতিল করুন।'
              : 'Full features on all plans, no hidden charges. Cancel anytime.'
            }
          </p>
        </div>
        
        {/* Pricing Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="relative">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-32 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans?.map(plan => {
              const name = language === 'bn' ? plan.name : plan.name_en;
              const description = language === 'bn' ? plan.description : plan.description_en;
              
              return (
                <Card 
                  key={plan.id}
                  className={`relative flex flex-col ${
                    plan.is_featured 
                      ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-105' 
                      : ''
                  }`}
                >
                  {plan.is_featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-md">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {language === 'bn' ? 'সবচেয়ে জনপ্রিয়' : 'Most Popular'}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <h3 className="text-xl font-semibold">{name}</h3>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">৳{plan.price_monthly.toLocaleString()}</span>
                      <span className="text-muted-foreground">/{language === 'bn' ? 'মাস' : 'mo'}</span>
                    </div>
                    {description && (
                      <p className="text-sm text-muted-foreground mt-2">{description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {formatLimit(plan.max_shops, unlimitedText)} {language === 'bn' ? 'শপ' : 'Shops'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {formatLimit(plan.max_orders_per_month, unlimitedText)} {language === 'bn' ? 'অর্ডার/মাস' : 'Orders/mo'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {formatLimit(plan.max_team_members, unlimitedText)} {language === 'bn' ? 'টিম মেম্বার' : 'Team Members'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {formatLimit(plan.max_landing_pages, unlimitedText)} {language === 'bn' ? 'ল্যান্ডিং পেজ' : 'Landing Pages'}
                        </span>
                      </li>
                      {plan.features?.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full mt-6 ${plan.is_featured ? '' : 'variant-outline'}`}
                      variant={plan.is_featured ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleBuy(plan.slug, plan.is_contact_sales)}
                    >
                      {plan.is_contact_sales 
                        ? (language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Sales')
                        : (language === 'bn' ? 'এখনই কিনুন' : 'Buy Now')
                      }
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mt-16 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span>{language === 'bn' ? 'সিকিউর পেমেন্ট' : 'Secure Payment'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            <span>{language === 'bn' ? '২৪/৭ সাপোর্ট' : '24/7 Support'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span>{language === 'bn' ? 'তাৎক্ষণিক অ্যাক্সেস' : 'Instant Access'}</span>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-20 py-8 text-center text-muted-foreground">
        <p>© 2026 Ytspider. All rights reserved.</p>
      </footer>
    </div>
  );
}
