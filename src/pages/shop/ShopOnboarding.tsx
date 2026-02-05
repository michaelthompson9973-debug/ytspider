import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '@/contexts/ShopContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, Sparkles, ArrowRight } from 'lucide-react';

export default function ShopOnboarding() {
  const [shopName, setShopName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createShop } = useShop();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopName.trim()) {
      toast({ title: 'শপের নাম দিন', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      await createShop(shopName.trim());
      toast({ title: 'শপ তৈরি হয়েছে!', description: 'আপনার নতুন শপে স্বাগতম' });
      navigate('/shop');
    } catch (error: any) {
      toast({ 
        title: 'শপ তৈরিতে সমস্যা', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">আপনার শপ তৈরি করুন</CardTitle>
            <CardDescription className="mt-2">
              YTSpider-এ স্বাগতম! আপনার ই-কমার্স জার্নি শুরু করুন
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateShop} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="shopName">শপের নাম</Label>
              <Input
                id="shopName"
                placeholder="যেমন: Fashion House, Gadget World..."
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                disabled={isCreating}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                এই নাম আপনার গ্রাহকদের কাছে দেখাবে
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? (
                'তৈরি হচ্ছে...'
              ) : (
                <>
                  শপ তৈরি করুন
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 space-y-3">
            <p className="text-sm text-muted-foreground text-center font-medium">
              YTSpider-এ আপনি পাচ্ছেন:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                'ল্যান্ডিং পেজ বিল্ডার',
                'অর্ডার ম্যানেজমেন্ট',
                'মেসেঞ্জার ইন্টিগ্রেশন',
                'কুরিয়ার কানেকশন',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
