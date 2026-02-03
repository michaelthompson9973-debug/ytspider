import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit2, BookOpen, Tag, Package, HelpCircle, Megaphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TrainingData {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  is_active: boolean;
  created_at: string;
}

const categories = [
  { value: 'product', label: 'প্রোডাক্ট', icon: Package },
  { value: 'faq', label: 'FAQ', icon: HelpCircle },
  { value: 'policy', label: 'পলিসি', icon: BookOpen },
  { value: 'promo', label: 'প্রমো', icon: Megaphone },
  { value: 'greeting', label: 'গ্রিটিং', icon: Tag },
];

export function AITrainingPanel() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrainingData | null>(null);
  const queryClient = useQueryClient();

  const { data: trainingData = [], isLoading } = useQuery({
    queryKey: ['ai-training-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_training_data')
        .select('*')
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TrainingData[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<TrainingData, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('ai_training_data')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-training-data'] });
      setAddDialogOpen(false);
      toast.success('ট্রেনিং ডেটা যোগ করা হয়েছে');
    },
    onError: (error) => {
      toast.error('ত্রুটি: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TrainingData> & { id: string }) => {
      const { error } = await supabase
        .from('ai_training_data')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-training-data'] });
      setEditingItem(null);
      toast.success('আপডেট করা হয়েছে');
    },
    onError: (error) => {
      toast.error('ত্রুটি: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_training_data')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-training-data'] });
      toast.success('ডিলিট করা হয়েছে');
    },
    onError: (error) => {
      toast.error('ত্রুটি: ' + error.message);
    },
  });

  const groupedData = categories.map(cat => ({
    ...cat,
    items: trainingData.filter(item => item.category === cat.value),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">AI ট্রেনিং ডেটা</h4>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              যোগ করুন
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন ট্রেনিং ডেটা</DialogTitle>
            </DialogHeader>
            <TrainingDataForm
              onSubmit={(data) => addMutation.mutate(data)}
              isLoading={addMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <Accordion type="multiple" className="w-full">
            {groupedData.map(category => (
              <AccordionItem key={category.value} value={category.value}>
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <category.icon className="h-4 w-4" />
                    {category.label}
                    <Badge variant="secondary" className="ml-2">
                      {category.items.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-6">
                    {category.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        কোনো ডেটা নেই
                      </p>
                    ) : (
                      category.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between p-2 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {item.title}
                              </p>
                              {!item.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                  নিষ্ক্রিয়
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {item.content}
                            </p>
                            {item.keywords && item.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.keywords.slice(0, 3).map((kw, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] px-1">
                                    {kw}
                                  </Badge>
                                ))}
                                {item.keywords.length > 3 && (
                                  <Badge variant="outline" className="text-[10px] px-1">
                                    +{item.keywords.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ট্রেনিং ডেটা এডিট</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <TrainingDataForm
              initialData={editingItem}
              onSubmit={(data) => updateMutation.mutate({ id: editingItem.id, ...data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TrainingDataFormProps {
  initialData?: TrainingData;
  onSubmit: (data: Omit<TrainingData, 'id' | 'created_at'>) => void;
  isLoading: boolean;
}

function TrainingDataForm({ initialData, onSubmit, isLoading }: TrainingDataFormProps) {
  const [category, setCategory] = useState(initialData?.category || 'product');
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [keywords, setKeywords] = useState(initialData?.keywords?.join(', ') || '');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('টাইটেল এবং কন্টেন্ট আবশ্যক');
      return;
    }

    onSubmit({
      category,
      title: title.trim(),
      content: content.trim(),
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>ক্যাটাগরি</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>টাইটেল</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="যেমন: ফ্রি ডেলিভারি পলিসি"
        />
      </div>

      <div className="space-y-2">
        <Label>কন্টেন্ট</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="বিস্তারিত তথ্য লিখুন..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>কীওয়ার্ড (কমা দিয়ে আলাদা করুন)</Label>
        <Input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="ডেলিভারি, শিপিং, ফ্রি"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>সক্রিয়</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'সেভ করুন'}
      </Button>
    </form>
  );
}
