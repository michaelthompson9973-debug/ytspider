/**
 * ProductsContent - Shared content component for Products page
 * Used by both Admin and Shop areas with their respective layouts
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { ShopGuard } from '@/components/admin/ShopGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Pencil, Trash2, ImageIcon, Film, X, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import MediaPickerDialog from '@/components/admin/MediaPickerDialog';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().max(2000).optional(),
  active: z.boolean(),
  images: z.array(z.string()),
  videos: z.array(z.string()),
  track_stock: z.boolean(),
  stock: z.number().nullable(),
  low_stock_threshold: z.number(),
});

type ProductForm = z.infer<typeof productSchema>;

const defaultForm: ProductForm = {
  name: '',
  price: 0,
  description: '',
  active: true,
  images: [],
  videos: [],
  track_stock: false,
  stock: null,
  low_stock_threshold: 5,
};

export function ProductsContent() {
  const { currentShop } = useShop();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [imageInput, setImageInput] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentShop,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      if (!currentShop) throw new Error('No shop selected');
      
      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            price: data.price,
            description: data.description || null,
            active: data.active,
            images: data.images,
            videos: data.videos,
            track_stock: data.track_stock,
            stock: data.track_stock ? data.stock : null,
            low_stock_threshold: data.low_stock_threshold,
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([{
          name: data.name,
          price: data.price,
          description: data.description || null,
          active: data.active,
          images: data.images,
          videos: data.videos,
          shop_id: currentShop.id,
          track_stock: data.track_stock,
          stock: data.track_stock ? data.stock : null,
          low_stock_threshold: data.low_stock_threshold,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', currentShop?.id] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editingId ? 'Product updated' : 'Product created' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', currentShop?.id] });
      toast({ title: 'Product deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setImageInput('');
    setVideoInput('');
  };

  const openEdit = (product: typeof products extends (infer T)[] ? T : never) => {
    setForm({
      name: product.name,
      price: Number(product.price),
      description: product.description ?? '',
      active: product.active,
      images: product.images ?? [],
      videos: product.videos ?? [],
      track_stock: (product as any).track_stock ?? false,
      stock: (product as any).stock ?? null,
      low_stock_threshold: (product as any).low_stock_threshold ?? 5,
    });
    setEditingId(product.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = productSchema.safeParse(form);
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate(form);
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setForm({ ...form, images: [...form.images, imageInput.trim()] });
      setImageInput('');
    }
  };

  const addVideo = () => {
    if (videoInput.trim()) {
      setForm({ ...form, videos: [...form.videos, videoInput.trim()] });
      setVideoInput('');
    }
  };

  const handleImageSelect = (urls: string[]) => {
    setForm({ ...form, images: [...form.images, ...urls] });
  };

  const handleVideoSelect = (urls: string[]) => {
    setForm({ ...form, videos: [...form.videos, ...urls] });
  };

  return (
    <ShopGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading">{t('products.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {products?.length ?? 0} টি প্রোডাক্ট
            </p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {t('products.addProduct')}
          </Button>
        </div>

        {/* Products Table */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">{t('products.image')}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('products.name')}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('products.price')}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">স্টক</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('common.status')}</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : products?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                          <p className="text-muted-foreground">{t('products.noProducts')}</p>
                          <Button size="sm" variant="outline" onClick={() => { resetForm(); setDialogOpen(true); }}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            প্রথম প্রোডাক্ট যোগ করুন
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products?.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-11 h-11 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3 font-digit">৳{Number(product.price).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {(product as any).track_stock ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium font-digit">{(product as any).stock ?? 0}</span>
                              {(product as any).stock !== null && (product as any).stock <= ((product as any).low_stock_threshold || 5) && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  <AlertTriangle className="h-3 w-3 mr-0.5" />লো
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">ট্র্যাক নেই</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={product.active ? 'default' : 'secondary'} className="text-xs">
                            {product.active ? t('common.active') : t('common.inactive')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? t('products.editProduct') : t('products.newProduct')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('products.name')}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t('products.price')}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('products.description')}</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                />
                <Label htmlFor="active">{t('common.active')}</Label>
              </div>

              {/* Stock Management */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="track_stock"
                    checked={form.track_stock}
                    onCheckedChange={(checked) => setForm({ ...form, track_stock: checked })}
                  />
                  <Label htmlFor="track_stock">স্টক ট্র্যাক করুন</Label>
                </div>
                {form.track_stock && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="stock">বর্তমান স্টক</Label>
                      <Input
                        id="stock"
                        type="number"
                        min={0}
                        value={form.stock ?? 0}
                        onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="low_threshold">লো-স্টক থ্রেশহোল্ড</Label>
                      <Input
                        id="low_threshold"
                        type="number"
                        min={0}
                        value={form.low_stock_threshold}
                        onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>{t('products.images')}</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setImagePickerOpen(true)}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {t('products.gallery')}
                  </Button>
                  <Input
                    placeholder="Or paste URL"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addImage}>{t('common.add')}</Button>
                </div>
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative group w-20 h-20">
                        <img
                          src={url}
                          alt={`Image ${i + 1}`}
                          className="w-full h-full object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('products.videos')}</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setVideoPickerOpen(true)}>
                    <Film className="mr-2 h-4 w-4" />
                    {t('products.gallery')}
                  </Button>
                  <Input
                    placeholder="Or paste URL"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addVideo}>{t('common.add')}</Button>
                </div>
                {form.videos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.videos.map((url, i) => (
                      <div key={i} className="relative group">
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1.5 text-xs">
                          <Film className="h-3 w-3" />
                          {url.length > 30 ? url.substring(0, 30) + '...' : url}
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, videos: form.videos.filter((_, j) => j !== i) })}
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? t('common.loading') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <MediaPickerDialog
          open={imagePickerOpen}
          onOpenChange={setImagePickerOpen}
          onSelect={handleImageSelect}
          multiple={true}
          accept="image"
        />

        <MediaPickerDialog
          open={videoPickerOpen}
          onOpenChange={setVideoPickerOpen}
          onSelect={handleVideoSelect}
          multiple={true}
          accept="video"
        />
      </div>
    </ShopGuard>
  );
}
