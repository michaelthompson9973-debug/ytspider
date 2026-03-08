import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createShopForUserSchema, type CreateShopForUserInput } from '@/lib/validations/shopValidation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Store, User, Package, Mail, Download, ArrowLeft, Check, Copy, AlertTriangle, KeyRound, RefreshCw } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  name_en: string;
  price_monthly: number;
  currency: string;
  duration_days: number;
}

export default function CreateShop() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<{ email: string; password?: string; shopName: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<CreateShopForUserInput>({
    resolver: zodResolver(createShopForUserSchema),
    defaultValues: { shopName: '', slug: '', shopType: 'physical', ownerEmail: '', ownerPassword: '', planId: '', durationDays: '30', sendCredentials: true },
  });

  const generateCredentials = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const password = Array.from(array, (byte) => chars[byte % chars.length]).join('');
    form.setValue('ownerPassword', password);
    toast.success(language === 'bn' ? 'পাসওয়ার্ড জেনারেট হয়েছে!' : 'Password generated!');
  };

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['pricing-plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pricing_plans').select('id, name, name_en, price_monthly, currency, duration_days').eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data as PricingPlan[];
    },
  });

  useEffect(() => {
    if (plans && plans.length > 0 && !form.getValues('planId')) form.setValue('planId', plans[0].id);
  }, [plans, form]);

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
      queryClient.invalidateQueries({ queryKey: ['all-shops'] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      setResult({
        email: data.user.email,
        password: data.user.isNewUser ? data.credentials?.password : undefined,
        shopName: data.shop.name,
        emailSent: data.emailSent,
      });
      toast.success(language === 'bn' ? 'শপ সফলভাবে তৈরি হয়েছে!' : 'Shop created successfully!');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleCopy = async () => {
    if (!result) return;
    const text = result.password
      ? `ইমেইল: ${result.email}\nপাসওয়ার্ড: ${result.password}`
      : `ইমেইল: ${result.email}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('কপি করা হয়েছে!');
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = (data: CreateShopForUserInput) => provisionMutation.mutate(data);
  const selectedPlan = plans?.find((p) => p.id === form.watch('planId'));

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/business/shops')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{language === 'bn' ? 'নতুন শপ তৈরি করুন' : 'Create New Shop'}</h1>
            <p className="text-muted-foreground text-sm">{language === 'bn' ? 'ব্যবসায়ীর জন্য শপ প্রোভিশন করুন' : 'Provision a shop for a business owner'}</p>
          </div>
        </div>

        {!result ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Shop Info */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    {language === 'bn' ? 'শপের তথ্য' : 'Shop Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="shopName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'bn' ? 'শপের নাম' : 'Shop Name'} *</FormLabel>
                        <FormControl><Input placeholder={language === 'bn' ? 'আমার শপ' : 'My Shop'} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="slug" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl><Input placeholder="my-shop" {...field} onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="shopType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'bn' ? 'প্রোডাক্ট টাইপ' : 'Product Type'} *</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3">
                          <label htmlFor="type-physical" className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${field.value === 'physical' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                            <RadioGroupItem value="physical" id="type-physical" />
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{language === 'bn' ? 'ফিজিক্যাল' : 'Physical'}</span>
                              <p className="text-xs text-muted-foreground">{language === 'bn' ? 'কুরিয়ারে ডেলিভারি' : 'Ship via courier'}</p>
                            </div>
                          </label>
                          <label htmlFor="type-digital" className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${field.value === 'digital' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                            <RadioGroupItem value="digital" id="type-digital" />
                            <Download className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{language === 'bn' ? 'ডিজিটাল' : 'Digital'}</span>
                              <p className="text-xs text-muted-foreground">{language === 'bn' ? 'ডাউনলোড/লাইসেন্স' : 'Download/License'}</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Owner Info */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    {language === 'bn' ? 'ওনারের তথ্য' : 'Owner Information'}
                  </CardTitle>
                  <CardDescription>{language === 'bn' ? 'বিদ্যমান ইউজার হলে শপ অ্যাসাইন হবে, নতুন হলে অ্যাকাউন্ট তৈরি হবে' : 'Existing users get the shop assigned, new users get an account created'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="ownerEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'bn' ? 'ওনারের ইমেইল' : 'Owner Email'} *</FormLabel>
                      <FormControl><Input type="email" placeholder="owner@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="ownerPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl><Input type="text" placeholder={language === 'bn' ? 'জেনারেট করুন বা নিজে লিখুন' : 'Generate or type manually'} {...field} /></FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={generateCredentials} title={language === 'bn' ? 'পাসওয়ার্ড জেনারেট করুন' : 'Generate Password'}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'bn' ? 'খালি রাখলে সিস্টেম অটো জেনারেট করবে। ওনার পরে পরিবর্তন করতে পারবেন।' : 'Leave empty for auto-generation. Owner can change later.'}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="button" variant="secondary" onClick={generateCredentials} className="gap-2">
                    <KeyRound className="h-4 w-4" />
                    {language === 'bn' ? 'ক্রেডেনশিয়াল জেনারেট করুন' : 'Generate Credentials'}
                  </Button>
                </CardContent>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="planId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'bn' ? 'প্ল্যান' : 'Plan'} *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={plansLoading}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {plans?.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {language === 'bn' ? plan.name : plan.name_en} — {plan.currency} {plan.price_monthly}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="durationDays" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'bn' ? 'মেয়াদ' : 'Duration'} *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="30">{language === 'bn' ? '৩০ দিন' : '30 Days'}</SelectItem>
                            <SelectItem value="90">{language === 'bn' ? '৯০ দিন' : '90 Days'}</SelectItem>
                            <SelectItem value="365">{language === 'bn' ? '১ বছর' : '1 Year'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {selectedPlan && (
                    <div className="rounded-lg bg-muted/50 p-4 text-sm">
                      <strong>{language === 'bn' ? 'মোট খরচ:' : 'Total:'}</strong>{' '}
                      <span className="font-bold text-primary text-lg">
                        {selectedPlan.currency} {selectedPlan.price_monthly * (parseInt(form.watch('durationDays')) / 30)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Options & Submit */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <FormField control={form.control} name="sendCredentials" render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="flex items-center gap-2 cursor-pointer font-normal">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {language === 'bn' ? 'ইমেইলে লগইন তথ্য পাঠান' : 'Send login credentials via email'}
                      </FormLabel>
                    </FormItem>
                  )} />

                  <Separator />

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/business/shops')}>
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </Button>
                    <Button type="submit" disabled={provisionMutation.isPending} size="lg">
                      {provisionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Store className="mr-2 h-4 w-4" />
                      {language === 'bn' ? 'শপ তৈরি করুন' : 'Create Shop'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        ) : (
          /* Success State */
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{language === 'bn' ? 'শপ তৈরি সফল!' : 'Shop Created Successfully!'}</CardTitle>
              <CardDescription>{result.shopName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ইমেইল:</span>
                  <span className="font-medium">{result.email}</span>
                </div>
                {result.password && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">পাসওয়ার্ড:</span>
                    <span className="font-medium text-primary">{result.password}</span>
                  </div>
                )}
              </div>

              {result.emailSent && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Mail className="h-4 w-4" />
                  ক্রেডেনশিয়াল ইমেইলে পাঠানো হয়েছে
                </div>
              )}

              {!result.emailSent && result.password && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  ইমেইল পাঠানো যায়নি — কপি করে ম্যানুয়ালি পাঠান
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'কপি হয়েছে!' : 'কপি করুন'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setResult(null); form.reset(); }}>
                    {language === 'bn' ? 'আরেকটি তৈরি করুন' : 'Create Another'}
                  </Button>
                  <Button onClick={() => navigate('/admin/business/shops')}>
                    {language === 'bn' ? 'শপ লিস্টে যান' : 'Go to Shops'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
