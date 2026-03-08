import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useTrackingProfilesSelect } from '@/hooks/useTrackingProfiles';
import type { LandingPage, PageForm } from './types';
import { defaultForm } from './types';

const pageSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  product_id: z.string().nullable(),
  gtm_id: z.string().max(50).optional(),
  tracking_profile_id: z.string().nullable(),
  published: z.boolean(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPage: LandingPage | null;
  products: { id: string; name: string }[] | undefined;
  onSave: (form: PageForm, editingId: string | null) => void;
  isSaving: boolean;
}

export function LandingPageFormDialog({ open, onOpenChange, editingPage, products, onSave, isSaving }: Props) {
  const [form, setForm] = useState<PageForm>(defaultForm);
  const { toast } = useToast();
  const { profiles: trackingProfiles } = useTrackingProfilesSelect();

  useEffect(() => {
    if (editingPage) {
      setForm({
        slug: editingPage.slug,
        product_id: editingPage.product_id,
        gtm_id: editingPage.gtm_id ?? '',
        tracking_profile_id: editingPage.tracking_profile_id,
        published: editingPage.published,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingPage, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = pageSchema.safeParse(form);
    if (!validation.success) {
      toast({ title: 'Validation Error', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }
    onSave(form, editingPage?.id ?? null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">{editingPage ? 'পেজ সেটিংস' : 'নতুন ল্যান্ডিং পেজ'}</DialogTitle>
          <DialogDescription>{editingPage ? 'পেজের সেটিংস আপডেট করুন' : 'নতুন ল্যান্ডিং পেজ তৈরি করতে নিচের তথ্য দিন'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-medium">Slug (URL path)</Label>
            <Input id="slug" placeholder="my-product-page" value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} required className="h-11" />
            <p className="text-xs text-muted-foreground">URL হবে: /p/{form.slug || 'your-slug'}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product" className="text-sm font-medium">প্রোডাক্ট</Label>
            <Select value={form.product_id ?? 'none'} onValueChange={(val) => setForm({ ...form, product_id: val === 'none' ? null : val })}>
              <SelectTrigger className="h-11"><SelectValue placeholder="প্রোডাক্ট সিলেক্ট করুন" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">কোনো প্রোডাক্ট নেই</SelectItem>
                {products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking_profile" className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />ট্র্যাকিং প্রোফাইল
            </Label>
            <Select value={form.tracking_profile_id ?? 'none'} onValueChange={(val) => setForm({ ...form, tracking_profile_id: val === 'none' ? null : val })}>
              <SelectTrigger className="h-11"><SelectValue placeholder="ট্র্যাকিং প্রোফাইল সিলেক্ট করুন" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">কোনো ট্র্যাকিং নেই</SelectItem>
                {trackingProfiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Purchase, add_to_cart ইভেন্ট এই প্রোফাইলের প্ল্যাটফর্মে পাঠানো হবে</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="published" className="text-sm font-medium">পাবলিশ স্ট্যাটাস</Label>
              <p className="text-xs text-muted-foreground">পাবলিশ করলে পেজ লাইভ হয়ে যাবে</p>
            </div>
            <Switch id="published" checked={form.published} onCheckedChange={(checked) => setForm({ ...form, published: checked })} />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
