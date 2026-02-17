import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createShopForUserSchema, type CreateShopForUserInput } from '@/lib/validations/shopValidation';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Store, User, Package, Mail, Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Define the interfaces
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

export function CreateShopForUserDialog({ open, onOpenChange, onSuccess }: CreateShopForUserDialogProps) {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();

  const form = useForm<CreateShopForUserInput>({
    resolver: zodResolver(createShopForUserSchema),
    defaultValues: { shopName: '', slug: '', shopType: 'physical', ownerEmail: '', planId: '', durationDays: '30', sendCredentials: true },
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['pricing-plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pricing_plans').select('id, name, name_en, price_monthly, currency, duration_days').eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data as PricingPlan[];
    },
  });

  useEffect(() => { if (plans && plans.length > 0 && !form.getValues('planId')) form.setValue('planId', plans[0].id); }, [plans, form]);

  const watchShopName = form.watch('shopName');
  useEffect(() => {
    if (watchShopName) {
      const generatedSlug = watchShopName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
      const currentSlug = form.getValues('slug');
      if (!currentSlug || currentSlug === generatedSlug.slice(0, -1)) form.setValue('slug', generatedSlug);
    }
  }, [watchShopName, form]);

  const provisionMutation = useMutation({
    mutationFn: async (data: CreateShopForUserInput) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) throw new Error('Not authenticated');
      const response = await supabase.functions.invoke('provision-shop', {
        body: { shopName: data.shopName, slug: data.slug, shopType: data.shopType, ownerEmail: data.ownerEmail.toLowerCase(), planId: data.planId, durationDays: parseInt(data.durationDays), sendCredentials: data.sendCredentials },
      });
      if (response.error) throw new Error(response.error.message || 'Failed');
      if (!response.data.success) throw new Error(response.data.error || 'Failed');
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.user.isNewUser
        ? language === 'bn' ? `শপ তৈরি হয়েছে! ${data.user.email} এ অ্যাকাউন্ট তৈরি হয়েছে।` : `Shop created for ${data.user.email}.`
        : language === 'bn' ? `শপ তৈরি হয়েছে এবং ${data.user.email} কে যুক্ত করা হয়েছে।` : `Shop assigned to ${data.user.email}.`;
      toast.success(message);
      if (data.emailSent) toast.info(language === 'bn' ? 'লগইন তথ্য ইমেইলে পাঠানো হয়েছে।' : 'Credentials sent.');
      queryClient.invalidateQueries({ queryKey: ['all-shops'] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleClose = () => {
    form.reset({ shopName: '', slug: '', shopType: 'physical', ownerEmail: '', planId: plans?.[0]?.id || '', durationDays: '30', sendCredentials: true });
    onOpenChange(false);
  };

  const onSubmit = (data: CreateShopForUserInput) => provisionMutation.mutate(data);
  const selectedPlan = plans?.find((p) => p.id === form.watch('planId'));

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-[500px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {language === 'bn' ? 'নতুন শপ তৈরি করুন' : 'Create New Shop'}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {language === 'bn' ? 'ব্যবসায়ীর জন্য শপ তৈরি করুন।' : 'Create a shop for a business owner.'}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Store className="h-4 w-4" />{language === 'bn' ? 'শপের তথ্য' : 'Shop Info'}</div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="shopName" render={({ field }) => (
                  <FormItem><FormLabel>{language === 'bn' ? 'নাম' : 'Name'} *</FormLabel><FormControl><Input placeholder={language === 'bn' ? 'আমার শপ' : 'My Shop'} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>Slug *</FormLabel><FormControl><Input placeholder="my-shop" {...field} onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="shopType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'bn' ? 'টাইপ' : 'Type'} *</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3">
                      <label htmlFor="physical" className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${field.value === 'physical' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <RadioGroupItem value="physical" id="physical" /><Package className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium">{language === 'bn' ? 'ফিজিক্যাল' : 'Physical'}</span>
                      </label>
                      <label htmlFor="digital" className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${field.value === 'digital' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <RadioGroupItem value="digital" id="digital" /><Download className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium">{language === 'bn' ? 'ডিজিটাল' : 'Digital'}</span>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><User className="h-4 w-4" />{language === 'bn' ? 'Owner' : 'Owner'}</div>
              <FormField control={form.control} name="ownerEmail" render={({ field }) => (
                <FormItem><FormLabel>{language === 'bn' ? 'ইমেইল' : 'Email'} *</FormLabel><FormControl><Input type="email" placeholder="owner@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Package className="h-4 w-4" />{language === 'bn' ? 'সাবস্ক্রিপশন' : 'Subscription'}</div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="planId" render={({ field }) => (
                  <FormItem><FormLabel>{language === 'bn' ? 'প্ল্যান' : 'Plan'} *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={plansLoading}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{plans?.map((plan) => <SelectItem key={plan.id} value={plan.id}>{language === 'bn' ? plan.name : plan.name_en} - {plan.currency} {plan.price_monthly}</SelectItem>)}</SelectContent></Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="durationDays" render={({ field }) => (
                  <FormItem><FormLabel>{language === 'bn' ? 'মেয়াদ' : 'Duration'} *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="30">{language === 'bn' ? '৩০ দিন' : '30 Days'}</SelectItem>
                      <SelectItem value="90">{language === 'bn' ? '৯০ দিন' : '90 Days'}</SelectItem>
                      <SelectItem value="365">{language === 'bn' ? '১ বছর' : '1 Year'}</SelectItem>
                    </SelectContent></Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              {selectedPlan && (
                <div className="rounded-md bg-muted/50 p-3 text-sm">
                  <strong>{language === 'bn' ? 'মোট:' : 'Total:'}</strong>{' '}
                  <span className="font-bold text-primary">{selectedPlan.currency} {selectedPlan.price_monthly * (parseInt(form.watch('durationDays')) / 30)}</span>
                </div>
              )}
            </div>

            <FormField control={form.control} name="sendCredentials" render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="flex items-center gap-2 cursor-pointer font-normal"><Mail className="h-4 w-4" />{language === 'bn' ? 'ইমেইলে লগইন তথ্য পাঠান' : 'Send credentials'}</FormLabel>
              </FormItem>
            )} />

            <ResponsiveModalFooter>
              <Button type="button" variant="outline" onClick={handleClose}>{language === 'bn' ? 'বাতিল' : 'Cancel'}</Button>
              <Button type="submit" disabled={provisionMutation.isPending}>
                {provisionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === 'bn' ? 'শপ তৈরি করুন' : 'Create Shop'}
              </Button>
            </ResponsiveModalFooter>
          </form>
        </Form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
