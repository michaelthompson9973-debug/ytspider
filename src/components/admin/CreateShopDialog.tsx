import { useState } from 'react';
import { useShop } from '@/contexts/ShopContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Store, Loader2 } from 'lucide-react';

interface CreateShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateShopDialog({ open, onOpenChange, onSuccess }: CreateShopDialogProps) {
  const { t } = useLanguage();
  const { createShop } = useShop();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
    setName(value);
    // Auto-generate slug if user hasn't manually edited it
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('শপের নাম দিন');
      return;
    }

    if (!slug.trim()) {
      toast.error('Slug দিন');
      return;
    }

    setIsCreating(true);
    try {
      await createShop(name.trim(), slug.trim());
      toast.success('শপ তৈরি হয়েছে!');
      setName('');
      setSlug('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating shop:', error);
      toast.error(error.message || 'শপ তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name">শপের নাম *</Label>
            <Input
              id="shop-name"
              placeholder="যেমন: My Awesome Store"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isCreating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shop-slug">Slug (URL-friendly) *</Label>
            <Input
              id="shop-slug"
              placeholder="my-awesome-store"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              শুধু ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              বাতিল
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim() || !slug.trim()}>
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
      </DialogContent>
    </Dialog>
  );
}
