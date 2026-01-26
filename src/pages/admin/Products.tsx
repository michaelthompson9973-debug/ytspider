import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, ImageIcon, Film, X } from 'lucide-react';
import { z } from 'zod';
import MediaPickerDialog from '@/components/admin/MediaPickerDialog';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().max(2000).optional(),
  active: z.boolean(),
  images: z.array(z.string()),
  videos: z.array(z.string()),
});

type ProductForm = z.infer<typeof productSchema>;

const defaultForm: ProductForm = {
  name: '',
  price: 0,
  description: '',
  active: true,
  images: [],
  videos: [],
};

export default function Products() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [imageInput, setImageInput] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
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
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Price</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : products?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No products yet
                      </td>
                    </tr>
                  ) : (
                    products?.map((product) => (
                      <tr key={product.id} className="border-b">
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3">${Number(product.price).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
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
              <DialogTitle>{editingId ? 'Edit Product' : 'New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
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
                <Label htmlFor="description">Description</Label>
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
                <Label htmlFor="active">Active</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Images</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setImagePickerOpen(true)}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Gallery
                  </Button>
                  <Input
                    placeholder="Or paste URL"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addImage}>Add</Button>
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
                <Label>Videos</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setVideoPickerOpen(true)}>
                    <Film className="mr-2 h-4 w-4" />
                    Gallery
                  </Button>
                  <Input
                    placeholder="Or paste URL"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addVideo}>Add</Button>
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
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
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
    </AdminLayout>
  );
}
