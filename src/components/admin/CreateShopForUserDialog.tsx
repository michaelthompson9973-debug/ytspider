import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Store, User, Package, Mail } from 'lucide-react';

interface CreateShopForUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PricingPlan {
  id: string;
  name: string;
  name_en: string;
  price_monthly: number;
  currency: string;
  duration_days: number;
}

export function CreateShopForUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateShopForUserDialogProps) {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();

  const [shopName, setShopName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [sendCredentials, setSendCredentials] = useState(true);

  // Fetch pricing plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['pricing-plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('id, name, name_en, price_monthly, currency, duration_days')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as PricingPlan[];
    },
  });

  // Set default plan when plans load
  useEffect(() => {
    if (plans && plans.length > 0 && !planId) {
      setPlanId(plans[0].id);
    }
  }, [plans, planId]);

  // Auto-generate slug from shop name
  useEffect(() => {
    if (shopName) {
      const generatedSlug = shopName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generatedSlug);
    }
  }, [shopName]);

  // Provision shop mutation
  const provisionMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('provision-shop', {
        body: {
          shopName,
          slug,
          ownerEmail: ownerEmail.toLowerCase(),
          planId,
          durationDays: parseInt(durationDays),
          sendCredentials,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to provision shop');
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to provision shop');
      }

      return response.data;
    },
    onSuccess: (data) => {
      const message = data.user.isNewUser
        ? language === 'bn'
          ? `শপ তৈরি হয়েছে! নতুন অ্যাকাউন্ট ${data.user.email} এ তৈরি হয়েছে।`
          : `Shop created! New account created for ${data.user.email}.`
        : language === 'bn'
          ? `শপ তৈরি হয়েছে এবং ${data.user.email} কে owner হিসেবে যুক্ত করা হয়েছে।`
          : `Shop created and assigned to existing user ${data.user.email}.`;

      toast.success(message);

      if (data.emailSent) {
        toast.info(
          language === 'bn'
            ? 'লগইন তথ্য ইমেইলে পাঠানো হয়েছে।'
            : 'Login credentials sent via email.'
        );
      }

      queryClient.invalidateQueries({ queryKey: ['all-shops'] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    setShopName('');
    setSlug('');
    setOwnerEmail('');
    setPlanId(plans?.[0]?.id || '');
    setDurationDays('30');
    setSendCredentials(true);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !slug || !ownerEmail || !planId) {
      toast.error(
        language === 'bn'
          ? 'সব প্রয়োজনীয় তথ্য পূরণ করুন'
          : 'Please fill all required fields'
      );
      return;
    }
    provisionMutation.mutate();
  };

  const selectedPlan = plans?.find((p) => p.id === planId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {language === 'bn' ? 'নতুন শপ তৈরি করুন' : 'Create New Shop'}
          </DialogTitle>
          <DialogDescription>
            {language === 'bn'
              ? 'একজন ব্যবসায়ীর জন্য নতুন শপ তৈরি করুন। তার ইমেইলে লগইন তথ্য পাঠানো হবে।'
              : 'Create a shop for a business owner. Login credentials will be sent to their email.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Shop Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Store className="h-4 w-4" />
              {language === 'bn' ? 'শপের তথ্য' : 'Shop Information'}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">
                  {language === 'bn' ? 'শপের নাম' : 'Shop Name'} *
                </Label>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={language === 'bn' ? 'আমার শপ' : 'My Shop'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-shop"
                  required
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              {language === 'bn' ? 'Owner তথ্য' : 'Owner Information'}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerEmail">
                {language === 'bn' ? 'ইমেইল' : 'Email'} *
              </Label>
              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                {language === 'bn'
                  ? 'এই ইমেইলে অ্যাকাউন্ট না থাকলে নতুন অ্যাকাউন্ট তৈরি হবে।'
                  : 'If no account exists, a new one will be created.'}
              </p>
            </div>
          </div>

          {/* Subscription */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              {language === 'bn' ? 'সাবস্ক্রিপশন' : 'Subscription'}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'প্ল্যান' : 'Plan'} *</Label>
                <Select value={planId} onValueChange={setPlanId} disabled={plansLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'bn' ? 'প্ল্যান নির্বাচন করুন' : 'Select plan'} />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {language === 'bn' ? plan.name : plan.name_en} - {plan.currency}{' '}
                        {plan.price_monthly}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === 'bn' ? 'মেয়াদ' : 'Duration'} *</Label>
                <Select value={durationDays} onValueChange={setDurationDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">
                      {language === 'bn' ? '৩০ দিন' : '30 Days'}
                    </SelectItem>
                    <SelectItem value="90">
                      {language === 'bn' ? '৯০ দিন' : '90 Days'}
                    </SelectItem>
                    <SelectItem value="180">
                      {language === 'bn' ? '১৮০ দিন' : '180 Days'}
                    </SelectItem>
                    <SelectItem value="365">
                      {language === 'bn' ? '১ বছর' : '1 Year'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedPlan && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p>
                  <strong>{language === 'bn' ? 'মোট:' : 'Total:'}</strong>{' '}
                  {selectedPlan.currency} {selectedPlan.price_monthly} ×{' '}
                  {parseInt(durationDays) / 30}{' '}
                  {language === 'bn' ? 'মাস' : 'months'} ={' '}
                  <span className="font-bold text-primary">
                    {selectedPlan.currency}{' '}
                    {selectedPlan.price_monthly * (parseInt(durationDays) / 30)}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Email Credentials */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendCredentials"
              checked={sendCredentials}
              onCheckedChange={(checked) => setSendCredentials(checked === true)}
            />
            <Label htmlFor="sendCredentials" className="flex items-center gap-2 cursor-pointer">
              <Mail className="h-4 w-4" />
              {language === 'bn'
                ? 'ইমেইলে লগইন তথ্য পাঠান'
                : 'Send login credentials via email'}
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={provisionMutation.isPending}>
              {provisionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {language === 'bn' ? 'শপ তৈরি করুন' : 'Create Shop'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
