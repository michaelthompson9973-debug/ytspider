import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/admin/landing-page-editor/DeleteConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Layers, 
  Target,
  MoreHorizontal,
  Globe,
  FileText,
  Calendar,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import { z } from 'zod';
import { SectionBuilder } from '@/components/admin/landing-page-editor';
import { useTrackingProfilesSelect } from '@/hooks/useTrackingProfiles';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const pageSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  product_id: z.string().nullable(),
  gtm_id: z.string().max(50).optional(),
  tracking_profile_id: z.string().nullable(),
  published: z.boolean(),
});

type PageForm = z.infer<typeof pageSchema>;

const defaultForm: PageForm = {
  slug: '',
  product_id: null,
  gtm_id: '',
  tracking_profile_id: null,
  published: false,
};

interface LandingPage {
  id: string;
  slug: string;
  product_id: string | null;
  gtm_id: string | null;
  tracking_profile_id: string | null;
  published: boolean;
  html_content: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  products: { name: string } | null;
  tracking_profiles: { name: string } | null;
}

export default function LandingPages() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PageForm>(defaultForm);
  const [builderPageId, setBuilderPageId] = useState<string | null>(null);
  const [builderGtmId, setBuilderGtmId] = useState<string | undefined>();
  const [builderSlug, setBuilderSlug] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profiles: trackingProfiles } = useTrackingProfilesSelect();

  const { data: pages, isLoading } = useQuery({
    queryKey: ['landing-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select(`
          *,
          products (name),
          tracking_profiles (name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LandingPage[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Filter pages based on search query
  const filteredPages = pages?.filter(page => 
    page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.products?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async (data: PageForm) => {
      if (editingId) {
        const { error } = await supabase
          .from('landing_pages')
          .update({
            slug: data.slug,
            product_id: data.product_id || null,
            gtm_id: data.gtm_id || null,
            tracking_profile_id: data.tracking_profile_id || null,
            published: data.published,
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_pages').insert([{
          slug: data.slug,
          product_id: data.product_id || null,
          gtm_id: data.gtm_id || null,
          tracking_profile_id: data.tracking_profile_id || null,
          published: data.published,
          html_content: '',
          created_by: user?.id,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editingId ? 'পেজ আপডেট হয়েছে' : 'নতুন পেজ তৈরি হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast({ title: 'পেজ ডিলিট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (page: LandingPage) => {
      const { data: newPage, error: pageError } = await supabase
        .from('landing_pages')
        .insert({
          slug: `${page.slug}-copy-${Date.now()}`,
          product_id: page.product_id,
          gtm_id: page.gtm_id,
          published: false,
          html_content: page.html_content,
          created_by: user?.id,
        })
        .select()
        .single();
      if (pageError) throw pageError;

      const { data: sections } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('landing_page_id', page.id)
        .order('sort_order');

      if (sections && sections.length > 0) {
        const newSections = sections.map((s) => ({
          landing_page_id: newPage.id,
          name: s.name,
          html: s.html,
          sort_order: s.sort_order,
        }));
        await supabase.from('landing_page_sections').insert(newSections);
      }

      const { data: theme } = await supabase
        .from('landing_page_theme')
        .select('*')
        .eq('landing_page_id', page.id)
        .maybeSingle();

      if (theme) {
        await supabase.from('landing_page_theme').insert({
          landing_page_id: newPage.id,
          config: theme.config,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast({ title: 'পেজ ডুপ্লিকেট হয়েছে' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openEdit = (page: LandingPage) => {
    setForm({
      slug: page.slug,
      product_id: page.product_id,
      gtm_id: page.gtm_id ?? '',
      tracking_profile_id: page.tracking_profile_id,
      published: page.published,
    });
    setEditingId(page.id);
    setDialogOpen(true);
  };

  const openBuilder = (page: LandingPage) => {
    setBuilderPageId(page.id);
    setBuilderGtmId(page.gtm_id ?? undefined);
    setBuilderSlug(page.slug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = pageSchema.safeParse(form);
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

  // Stats
  const totalPages = pages?.length ?? 0;
  const publishedPages = pages?.filter(p => p.published).length ?? 0;
  const draftPages = totalPages - publishedPages;

  if (builderPageId) {
    return (
      <AdminLayout>
        <SectionBuilder
          landingPageId={builderPageId}
          gtmId={builderGtmId}
          slug={builderSlug}
          onBack={() => setBuilderPageId(null)}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight">
              ল্যান্ডিং পেজ
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              আপনার সকল ল্যান্ডিং পেজ ম্যানেজ করুন
            </p>
          </div>
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true); }}
            size="lg"
            className="font-medium"
          >
            <Plus className="mr-2 h-5 w-5" />
            নতুন পেজ
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">মোট পেজ</p>
                  <p className="text-xl sm:text-2xl font-bold font-digit">{totalPages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-green-500/10">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">পাবলিশড</p>
                  <p className="text-xl sm:text-2xl font-bold font-digit text-green-600">{publishedPages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-amber-500/10">
                  <Pencil className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">ড্রাফট</p>
                  <p className="text-xl sm:text-2xl font-bold font-digit text-amber-600">{draftPages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="পেজ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-10 w-10"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-10 w-10"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Pages Grid/List */}
        {isLoading ? (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-3"
          )}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPages?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">কোনো পেজ নেই</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'আপনার সার্চে কোনো পেজ পাওয়া যায়নি' : 'এখনো কোনো ল্যান্ডিং পেজ তৈরি হয়নি'}
              </p>
              {!searchQuery && (
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  প্রথম পেজ তৈরি করুন
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages?.map((page, index) => (
              <Card 
                key={page.id} 
                className={cn(
                  "group hover:shadow-lg transition-all duration-200 hover:border-primary/30",
                  "animate-in fade-in-50 slide-in-from-bottom-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold truncate font-heading">
                        /{page.slug}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {page.products?.name ?? 'কোনো প্রোডাক্ট নেই'}
                      </p>
                    </div>
                    <Badge 
                      variant={page.published ? 'default' : 'secondary'}
                      className={cn(
                        "shrink-0 font-medium",
                        page.published && "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                      )}
                    >
                      {page.published ? 'পাবলিশড' : 'ড্রাফট'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(page.created_at), 'dd MMM yyyy')}</span>
                    </div>
                    {page.tracking_profiles && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[100px]">{page.tracking_profiles.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openBuilder(page)}
                      className="flex-1 font-medium"
                    >
                      <Layers className="h-4 w-4 mr-1.5" />
                      এডিট
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {page.published && (
                          <DropdownMenuItem asChild>
                            <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              লাইভ দেখুন
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openEdit(page)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          সেটিংস
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(page)}>
                          <Copy className="h-4 w-4 mr-2" />
                          ডুপ্লিকেট
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setDeletingPageId(page.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          ডিলিট
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredPages?.map((page) => (
                  <div 
                    key={page.id} 
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold truncate font-heading">/{page.slug}</h3>
                        <Badge 
                          variant={page.published ? 'default' : 'secondary'}
                          className={cn(
                            "shrink-0 font-medium text-xs",
                            page.published && "bg-green-500/10 text-green-600 border-green-500/20"
                          )}
                        >
                          {page.published ? 'পাবলিশড' : 'ড্রাফট'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{page.products?.name ?? 'প্রোডাক্ট নেই'}</span>
                        <span className="text-xs">•</span>
                        <span className="text-xs">{format(new Date(page.created_at), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.published && (
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                          <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBuilder(page)}
                        className="font-medium"
                      >
                        <Layers className="h-4 w-4 mr-1.5" />
                        এডিট
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEdit(page)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            সেটিংস
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateMutation.mutate(page)}>
                            <Copy className="h-4 w-4 mr-2" />
                            ডুপ্লিকেট
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setDeletingPageId(page.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ডিলিট
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">
                {editingId ? 'পেজ সেটিংস' : 'নতুন ল্যান্ডিং পেজ'}
              </DialogTitle>
              <DialogDescription>
                {editingId ? 'পেজের সেটিংস আপডেট করুন' : 'নতুন ল্যান্ডিং পেজ তৈরি করতে নিচের তথ্য দিন'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium">
                  Slug (URL path)
                </Label>
                <Input
                  id="slug"
                  placeholder="my-product-page"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  URL হবে: /p/{form.slug || 'your-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm font-medium">প্রোডাক্ট</Label>
                <Select
                  value={form.product_id ?? 'none'}
                  onValueChange={(val) => setForm({ ...form, product_id: val === 'none' ? null : val })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="প্রোডাক্ট সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">কোনো প্রোডাক্ট নেই</SelectItem>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking_profile" className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4" />
                  ট্র্যাকিং প্রোফাইল
                </Label>
                <Select
                  value={form.tracking_profile_id ?? 'none'}
                  onValueChange={(val) => setForm({ ...form, tracking_profile_id: val === 'none' ? null : val })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="ট্র্যাকিং প্রোফাইল সিলেক্ট করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">কোনো ট্র্যাকিং নেই</SelectItem>
                    {trackingProfiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Purchase, add_to_cart ইভেন্ট এই প্রোফাইলের প্ল্যাটফর্মে পাঠানো হবে
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="published" className="text-sm font-medium">পাবলিশ স্ট্যাটাস</Label>
                  <p className="text-xs text-muted-foreground">পাবলিশ করলে পেজ লাইভ হয়ে যাবে</p>
                </div>
                <Switch
                  id="published"
                  checked={form.published}
                  onCheckedChange={(checked) => setForm({ ...form, published: checked })}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={() => {
            if (deletingPageId) {
              deleteMutation.mutate(deletingPageId);
            }
            setDeleteDialogOpen(false);
            setDeletingPageId(null);
          }}
          title="ল্যান্ডিং পেজ ডিলিট"
          description="আপনি কি নিশ্চিত যে এই ল্যান্ডিং পেজটি ডিলিট করতে চান? সকল সেকশন এবং সেটিংস স্থায়ীভাবে মুছে যাবে। এই কাজটি আর ফেরানো যাবে না।"
        />
      </div>
    </AdminLayout>
  );
}
