import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Shield, Check, LogIn } from 'lucide-react';
import { usePricingPlan } from '@/hooks/usePricingPlans';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planSlug = searchParams.get('plan') || 'starter';
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { currentShop, availableShops } = useShop();
  
  const { data: plan, isLoading: planLoading } = usePricingPlan(planSlug);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If not logged in, redirect to login with return URL
  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = `/checkout?plan=${planSlug}`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [authLoading, user, navigate, planSlug]);

  const handlePayment = async () => {
    if (!plan || !user) return;

    setIsSubmitting(true);

    try {
      // Determine shop_id - use current shop or first available
      const shopId = currentShop?.id || (availableShops.length > 0 ? availableShops[0].id : null);

      const { data, error } = await supabase.functions.invoke('paystation-initiate', {
        body: {
          plan_slug: planSlug,
          shop_id: shopId,
        },
      });

      if (error) throw error;

      if (data?.payment_url) {
        // Redirect to PayStation checkout
        window.location.href = data.payment_url;
      } else {
        throw new Error(data?.error || 'Payment URL not received');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || (language === 'bn' ? 'পেমেন্ট শুরু করতে সমস্যা হয়েছে' : 'Failed to initiate payment'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === 'bn' ? 'প্ল্যান পাওয়া যায়নি' : 'Plan Not Found'}
            </h2>
            <Button onClick={() => navigate('/pricing')}>
              {language === 'bn' ? 'প্রাইসিং পেজে যান' : 'Go to Pricing'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planName = language === 'bn' ? plan.name : plan.name_en;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-muted/30 pt-20">
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pricing')}
            className="gap-2 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'bn' ? 'প্রাইসিং এ ফিরুন' : 'Back to Pricing'}
          </Button>

          <div className="grid md:grid-cols-5 gap-8">
            {/* User Info & Payment */}
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'bn' ? 'পেমেন্ট করুন' : 'Complete Payment'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logged in user info */}
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <LogIn className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'bn' ? 'লগইনকৃত একাউন্ট' : 'Logged in account'}
                      </p>
                    </div>
                  </div>

                  {currentShop && (
                    <div className="bg-accent/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        {language === 'bn' ? 'শপ' : 'Shop'}
                      </p>
                      <p className="font-medium">{currentShop.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'bn' 
                          ? 'এই শপের প্ল্যান আপগ্রেড হবে' 
                          : 'This shop\'s plan will be upgraded'}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="font-medium">
                      {language === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'}
                    </h3>
                    <div className="border rounded-lg p-4 flex items-center gap-3 bg-background">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        PS
                      </div>
                      <div>
                        <p className="font-medium">PayStation</p>
                        <p className="text-xs text-muted-foreground">
                          bKash, Nagad, Rocket, Card
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                    onClick={handlePayment}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {language === 'bn' ? 'প্রসেসিং...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        {language === 'bn' ? 'পেমেন্ট করুন' : 'Pay Now'} — ৳{plan.price_monthly.toLocaleString()}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    {language === 'bn' ? 'সিকিউর পেমেন্ট' : 'Secure Payment'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-2">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>
                    {language === 'bn' ? 'অর্ডার সামারি' : 'Order Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{planName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.duration_days} {language === 'bn' ? 'দিন' : 'days'}
                      </p>
                    </div>
                    {plan.is_featured && (
                      <Badge>{language === 'bn' ? 'জনপ্রিয়' : 'Popular'}</Badge>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {language === 'bn' ? 'সাবটোটাল' : 'Subtotal'}
                      </span>
                      <span>৳{plan.price_monthly.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {language === 'bn' ? 'ট্যাক্স' : 'Tax'}
                      </span>
                      <span>৳0</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>{language === 'bn' ? 'মোট' : 'Total'}</span>
                    <span>৳{plan.price_monthly.toLocaleString()}</span>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{language === 'bn' ? '৭ দিনের মানি-ব্যাক' : '7-day money-back'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{language === 'bn' ? 'তাৎক্ষণিক অ্যাক্সেস' : 'Instant access'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{language === 'bn' ? 'যেকোনো সময় বাতিল' : 'Cancel anytime'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
