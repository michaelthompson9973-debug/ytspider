import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '@/contexts/ShopContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shopOnboardingStep1Schema, type ShopOnboardingStep1Input } from '@/lib/validations/shopValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, Sparkles, ArrowRight, ArrowLeft, Package, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

type ShopType = 'physical' | 'digital';

interface OnboardingData {
  shopName: string;
  shopType: ShopType;
  businessCategory: string;
}

const BUSINESS_CATEGORIES = [
  { value: 'fashion', label: 'Fashion & Clothing' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'beauty', label: 'Beauty & Health' },
  { value: 'food', label: 'Food & Restaurant' },
  { value: 'home', label: 'Home & Lifestyle' },
  { value: 'education', label: 'Education & Courses' },
  { value: 'software', label: 'Software & SaaS' },
  { value: 'ebooks', label: 'E-books & Documents' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' },
];

export default function ShopOnboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    shopName: '',
    shopType: 'physical',
    businessCategory: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const { createShop } = useShop();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = 3;

  const step1Form = useForm<ShopOnboardingStep1Input>({
    resolver: zodResolver(shopOnboardingStep1Schema),
    defaultValues: { shopName: data.shopName },
  });

  const handleNext = async () => {
    if (step === 1) {
      const result = await step1Form.trigger();
      if (!result) return;
      setData({ ...data, shopName: step1Form.getValues('shopName') });
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreateShop = async () => {
    const shopName = data.shopName || step1Form.getValues('shopName');
    if (!shopName || shopName.trim().length < 3) {
      toast({ title: 'Shop name must be at least 3 characters', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      await createShop(shopName.trim(), undefined, {
        shop_type: data.shopType,
        business_category: data.businessCategory || null,
        onboarding_completed: true,
      });
      toast({ title: 'Shop created!', description: 'Welcome to your new shop' });
      navigate('/shop');
    } catch (error: any) {
      toast({ title: 'Failed to create shop', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Create Your Shop</CardTitle>
            <CardDescription className="mt-2">
              Step {step}/{totalSteps} — {step === 1 ? 'Shop Name' : step === 2 ? 'Product Type' : 'Category'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i < step ? 'bg-primary' : 'bg-muted')} />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <Form {...step1Form}>
              <div className="space-y-4">
                <FormField control={step1Form.control} name="shopName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Fashion House, Gadget World..." {...field} autoFocus /></FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">This name will be visible to your customers (minimum 3 characters)</p>
                  </FormItem>
                )} />
              </div>
            </Form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>What type of products will you sell?</Label>
              <div className="grid grid-cols-1 gap-4">
                <button type="button" onClick={() => setData({ ...data, shopType: 'physical' })} className={cn('flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all group', data.shopType === 'physical' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}>
                  <div className="p-3 rounded-full bg-primary/10 text-primary"><Package className="h-6 w-6" /></div>
                  <div>
                    <p className="font-semibold">Physical Products</p>
                    <p className="text-sm text-muted-foreground">Clothing, gadgets, cosmetics — delivered via courier</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">COD Support</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">Courier Integration</span>
                    </div>
                  </div>
                </button>
                <button type="button" onClick={() => setData({ ...data, shopType: 'digital' })} className={cn('flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all', data.shopType === 'digital' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}>
                  <div className="p-3 rounded-full bg-secondary text-secondary-foreground"><Download className="h-6 w-6" /></div>
                  <div>
                    <p className="font-semibold">Digital Products</p>
                    <p className="text-sm text-muted-foreground">E-books, courses, software — delivered via download/email</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">Payment Gateway</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">Auto Delivery</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>Business Category (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <button key={cat.value} type="button" onClick={() => setData({ ...data, businessCategory: cat.value })} className={cn('p-3 rounded-lg border text-sm transition-all text-left', data.businessCategory === cat.value ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50')}>{cat.label}</button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">This helps us suggest the right tools for you</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {step > 1 && (<Button variant="outline" onClick={handleBack} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>)}
            {step < totalSteps ? (
              <Button onClick={handleNext} className="flex-1">Next<ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button onClick={handleCreateShop} disabled={isCreating} className="flex-1">
                {isCreating ? 'Creating...' : 'Create Shop'}<Sparkles className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {step === 1 && (
            <div className="mt-6 pt-6 border-t space-y-3">
              <p className="text-sm text-muted-foreground text-center font-medium">With YTSpider you get:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Landing Page Builder', 'Order Management', 'Messenger Integration', 'Courier Connection'].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
