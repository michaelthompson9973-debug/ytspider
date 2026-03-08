import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop, ShopType } from '@/contexts/ShopContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  createShopStep1Schema, 
  createShopStep2Schema,
  type CreateShopStep1Input,
  type CreateShopStep2Input 
} from '@/lib/validations/shopValidation';
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
import { Store, Loader2, Package, Download, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface CreateShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateShopDialog({ open, onOpenChange, onSuccess }: CreateShopDialogProps) {
  const { t } = useLanguage();
  const { createShop } = useShop();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ShopType | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const step1Form = useForm<CreateShopStep1Input>({ resolver: zodResolver(createShopStep1Schema), defaultValues: { shopType: undefined } });
  const step2Form = useForm<CreateShopStep2Input>({ resolver: zodResolver(createShopStep2Schema), defaultValues: { name: '', slug: '' } });

  const generateSlug = (name: string): string => name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const handleNameChange = (value: string) => { step2Form.setValue('name', value); step2Form.setValue('slug', generateSlug(value)); };
  const handleTypeSelect = (type: ShopType) => { setSelectedType(type); step1Form.setValue('shopType', type); step1Form.clearErrors('shopType'); };
  const handleStep1Submit = () => { if (!selectedType) { step1Form.setError('shopType', { message: 'Please select a product type' }); return; } setStep(2); };

  const handleStep2Submit = async (data: CreateShopStep2Input) => {
    if (!selectedType) { setStep(1); return; }
    setIsCreating(true);
    try {
      const slug = data.slug || generateSlug(data.name);
      await createShop(data.name.trim(), slug, { shop_type: selectedType, onboarding_completed: true });
      toast.success('শপ তৈরি হয়েছে!');
      handleClose();
      onSuccess?.();
      navigate('/shop');
    } catch (error: any) {
      toast.error(error.message || 'শপ তৈরি করতে সমস্যা হয়েছে');
    } finally { setIsCreating(false); }
  };

  const handleClose = () => { setStep(1); setSelectedType(null); step1Form.reset(); step2Form.reset(); onOpenChange(false); };

  return (
    <ResponsiveModal open={open} onOpenChange={handleClose}>
      <ResponsiveModalContent className="sm:max-w-[480px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" /> নতুন শপ তৈরি করুন
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {step === 1 ? 'কোন ধরনের প্রোডাক্ট বিক্রি করবেন?' : 'আপনার শপের নাম দিন'}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors", step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {step > 1 ? <Check className="h-4 w-4" /> : '১'}
          </div>
          <div className={cn("w-12 h-0.5 transition-colors", step > 1 ? "bg-primary" : "bg-muted")} />
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors", step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>২</div>
        </div>

        {step === 1 && (
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4 py-2">
              <FormField control={step1Form.control} name="shopType" render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => handleTypeSelect('physical')} className={cn("relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all hover:border-primary/50", selectedType === 'physical' ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-card hover:bg-accent/50")}>
                      {selectedType === 'physical' && <div className="absolute top-2 right-2"><Check className="h-5 w-5 text-primary" /></div>}
                      <div className={cn("p-3 rounded-full", selectedType === 'physical' ? "bg-primary/10" : "bg-muted")}><Package className={cn("h-7 w-7", selectedType === 'physical' ? "text-primary" : "text-muted-foreground")} /></div>
                      <div className="text-center"><p className="font-semibold text-sm">ফিজিক্যাল</p><p className="text-xs text-muted-foreground mt-1">পোশাক, গ্যাজেট</p></div>
                    </button>
                    <button type="button" onClick={() => handleTypeSelect('digital')} className={cn("relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all hover:border-primary/50", selectedType === 'digital' ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-card hover:bg-accent/50")}>
                      {selectedType === 'digital' && <div className="absolute top-2 right-2"><Check className="h-5 w-5 text-primary" /></div>}
                      <div className={cn("p-3 rounded-full", selectedType === 'digital' ? "bg-primary/10" : "bg-muted")}><Download className={cn("h-7 w-7", selectedType === 'digital' ? "text-primary" : "text-muted-foreground")} /></div>
                      <div className="text-center"><p className="font-semibold text-sm">ডিজিটাল</p><p className="text-xs text-muted-foreground mt-1">সফটওয়্যার, কোর্স</p></div>
                    </button>
                  </div>
                  <FormMessage className="text-center mt-2" />
                </FormItem>
              )} />
              <ResponsiveModalFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>বাতিল</Button>
                <Button type="submit" disabled={!selectedType} className="gap-2">পরবর্তী <ArrowRight className="h-4 w-4" /></Button>
              </ResponsiveModalFooter>
            </form>
          </Form>
        )}

        {step === 2 && (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4 py-2">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                {selectedType === 'physical' ? <><Package className="h-4 w-4 text-primary" /><span>ফিজিক্যাল শপ</span></> : <><Download className="h-4 w-4 text-primary" /><span>ডিজিটাল শপ</span></>}
              </div>
              <FormField control={step2Form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>শপের নাম *</FormLabel>
                  <FormControl><Input placeholder="যেমন: My Store" {...field} onChange={(e) => handleNameChange(e.target.value)} disabled={isCreating} autoFocus /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <ResponsiveModalFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isCreating} className="gap-2"><ArrowLeft className="h-4 w-4" /> পেছনে</Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />তৈরি হচ্ছে...</> : 'শপ তৈরি করুন'}
                </Button>
              </ResponsiveModalFooter>
            </form>
          </Form>
        )}
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
