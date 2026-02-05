import { useState } from 'react';
import { useShop } from '@/contexts/ShopContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createShopSchema, type CreateShopInput } from '@/lib/validations/shopValidation';
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
import { Store, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface CreateShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateShopDialog({ open, onOpenChange, onSuccess }: CreateShopDialogProps) {
  const { t } = useLanguage();
  const { createShop } = useShop();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<CreateShopInput>({
    resolver: zodResolver(createShopSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    const currentSlug = form.getValues('slug');
    const previousName = form.getValues('name');
    // Auto-generate slug if user hasn't manually edited it
    if (!currentSlug || currentSlug === generateSlug(previousName)) {
      form.setValue('slug', generateSlug(value));
    }
  };

  const onSubmit = async (data: CreateShopInput) => {
    setIsCreating(true);
    try {
      await createShop(data.name.trim(), data.slug.trim());
      toast.success('শপ তৈরি হয়েছে!');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating shop:', error);
      toast.error(error.message || 'শপ তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            নতুন শপ তৈরি করুন
          </DialogTitle>
          <DialogDescription>
            আপনার নতুন শপের তথ্য দিন। প্রতিটি শপে আলাদা প্রোডাক্ট, অর্ডার ও ল্যান্ডিং পেজ থাকবে।
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>শপের নাম *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="যেমন: My Awesome Store"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                      disabled={isCreating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL-friendly) *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my-awesome-store"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      disabled={isCreating}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    শুধু ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন
                  </p>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    তৈরি হচ্ছে...
                  </>
                ) : (
                  'শপ তৈরি করুন'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
