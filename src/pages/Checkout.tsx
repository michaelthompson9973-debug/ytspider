import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Shield, Check } from 'lucide-react';
import { usePricingPlan } from '@/hooks/usePricingPlans';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planSlug = searchParams.get('plan') || 'starter';
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const { data: plan, isLoading: planLoading } = usePricingPlan(planSlug);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    shopName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan) return;
    
    // Basic validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.shopName) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'সব ফিল্ড পূরণ করুন' : 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate shop slug
      const shopSlug = formData.shopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
      
      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          email: formData.email,
          phone: formData.phone || null,
          full_name: formData.fullName,
          plan_id: plan.id,
          plan_snapshot: plan as any,
          shop_name: formData.shopName,
          shop_slug: shopSlug,
          payment_provider: 'manual',
          payment_status: 'pending',
          amount: plan.price_monthly,
          currency: plan.currency,
        }])
        .select()
        .single();
      
      if (purchaseError) throw purchaseError;
      
      // For now, show success and redirect to auth
      // Later this will redirect to Stripe checkout
      toast({
        title: language === 'bn' ? 'অর্ডার তৈরি হয়েছে!' : 'Order Created!',
        description: language === 'bn' 
          ? 'পেমেন্ট সম্পন্ন করতে সাইন আপ করুন'
          : 'Sign up to complete payment',
      });
      
      // Redirect to auth with purchase context
      navigate(`/auth?purchase=${purchase.id}&email=${encodeURIComponent(formData.email)}`);
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || (language === 'bn' ? 'কিছু ভুল হয়েছে' : 'Something went wrong'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pricing')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'bn' ? 'প্রাইসিং এ ফিরুন' : 'Back to Pricing'}
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Form */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'bn' ? 'আপনার তথ্য' : 'Your Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      {language === 'bn' ? 'পুরো নাম' : 'Full Name'} *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={language === 'bn' ? 'আপনার নাম' : 'Your name'}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {language === 'bn' ? 'ইমেইল' : 'Email'} *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {language === 'bn' ? 'ফোন' : 'Phone'}
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'} *
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
                    </p>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="shopName">
                      {language === 'bn' ? 'শপের নাম' : 'Shop Name'} *
                    </Label>
                    <Input
                      id="shopName"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      placeholder={language === 'bn' ? 'আমার শপ' : 'My Shop'}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'bn' 
                        ? 'এই নামে আপনার শপ তৈরি হবে'
                        : 'Your shop will be created with this name'
                      }
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {language === 'bn' ? 'প্রসেসিং...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        {language === 'bn' ? 'পেমেন্ট করুন' : 'Proceed to Payment'} - ৳{plan.price_monthly.toLocaleString()}
                      </>
                    )}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    {language === 'bn' ? 'সিকিউর পেমেন্ট' : 'Secure Payment'}
                  </div>
                </form>
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
  );
}
