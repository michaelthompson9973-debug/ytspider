import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Zap, MessageSquare, Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AutoReplyRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_conditions: Record<string, unknown>;
  response_type: string;
  response_content: string | null;
  priority: number;
  is_active: boolean;
  use_count: number;
  created_at: string;
}

const triggerTypes = [
  { value: 'keyword', label: 'কীওয়ার্ড', description: 'নির্দিষ্ট শব্দ থাকলে ট্রিগার হবে' },
  { value: 'first_message', label: 'প্রথম মেসেজ', description: 'নতুন কথোপকথন শুরু হলে' },
];

const responseTypes = [
  { value: 'text', label: 'টেক্সট', icon: MessageSquare },
  { value: 'ai', label: 'AI জেনারেটেড', icon: Bot },
];

export function AutoReplyRulesPanel() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['auto-reply-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_reply_rules')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as AutoReplyRule[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<AutoReplyRule, 'id' | 'created_at' | 'use_count'>) => {
      const insertData: {
        name: string;
        trigger_type: string;
        trigger_conditions: Json;
        response_type: string;
        response_content: string | null;
        priority: number;
        is_active: boolean;
      } = {
        name: data.name,
        trigger_type: data.trigger_type,
        trigger_conditions: data.trigger_conditions as Json,
        response_type: data.response_type,
        response_content: data.response_content,
        priority: data.priority,
        is_active: data.is_active,
      };
      const { error } = await supabase
        .from('auto_reply_rules')
        .insert([insertData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rules'] });
      setAddDialogOpen(false);
      toast.success('রুল যোগ করা হয়েছে');
    },
    onError: (error) => {
      toast.error('ত্রুটি: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AutoReplyRule> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.trigger_type !== undefined) updateData.trigger_type = data.trigger_type;
      if (data.trigger_conditions !== undefined) updateData.trigger_conditions = data.trigger_conditions;
      if (data.response_type !== undefined) updateData.response_type = data.response_type;
      if (data.response_content !== undefined) updateData.response_content = data.response_content;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      
      const { error } = await supabase
        .from('auto_reply_rules')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rules'] });
      setEditingRule(null);
      toast.success('আপডেট করা হয়েছে');
    },
    onError: (error) => {
      toast.error('ত্রুটি: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('auto_reply_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rules'] });
      toast.success('ডিলিট করা হয়েছে');
    },
    onError: (error) => {
      toast.error('ত্রুটি: ' + error.message);
    },
  });

  const toggleActive = async (rule: AutoReplyRule) => {
    updateMutation.mutate({ id: rule.id, is_active: !rule.is_active });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">অটো রিপ্লাই রুলস</h4>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              নতুন রুল
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>নতুন অটো রিপ্লাই রুল</DialogTitle>
            </DialogHeader>
            <AutoReplyRuleForm
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
      ) : rules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Zap className="h-10 w-10 mx-auto opacity-50 mb-2" />
          <p className="text-sm">কোনো রুল নেই</p>
          <p className="text-xs mt-1">নতুন রুল তৈরি করুন</p>
        </div>
      ) : (
        <ScrollArea className="h-[350px]">
          <div className="space-y-2">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{rule.name}</p>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {rule.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {triggerTypes.find(t => t.value === rule.trigger_type)?.label || rule.trigger_type}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {responseTypes.find(t => t.value === rule.response_type)?.label || rule.response_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      ব্যবহার: {rule.use_count}
                    </span>
                  </div>
                  {rule.trigger_type === 'keyword' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      কীওয়ার্ড: {((rule.trigger_conditions?.keywords as string[]) || []).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => toggleActive(rule)}
                    className="scale-75"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingRule(rule)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => deleteMutation.mutate(rule.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>রুল এডিট</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <AutoReplyRuleForm
              initialData={editingRule}
              onSubmit={(data) => updateMutation.mutate({ id: editingRule.id, ...data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AutoReplyRuleFormProps {
  initialData?: AutoReplyRule;
  onSubmit: (data: Omit<AutoReplyRule, 'id' | 'created_at' | 'use_count'>) => void;
  isLoading: boolean;
}

function AutoReplyRuleForm({ initialData, onSubmit, isLoading }: AutoReplyRuleFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [triggerType, setTriggerType] = useState(initialData?.trigger_type || 'keyword');
  const [keywords, setKeywords] = useState(
    ((initialData?.trigger_conditions?.keywords as string[]) || []).join(', ')
  );
  const [responseType, setResponseType] = useState(initialData?.response_type || 'text');
  const [responseContent, setResponseContent] = useState(initialData?.response_content || '');
  const [priority, setPriority] = useState(initialData?.priority || 0);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('রুলের নাম আবশ্যক');
      return;
    }

    const triggerConditions: Record<string, unknown> = {};
    if (triggerType === 'keyword') {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
      if (keywordList.length === 0) {
        toast.error('অন্তত একটি কীওয়ার্ড দিন');
        return;
      }
      triggerConditions.keywords = keywordList;
    }

    if (responseType === 'text' && !responseContent.trim()) {
      toast.error('রেসপন্স কন্টেন্ট আবশ্যক');
      return;
    }

    onSubmit({
      name: name.trim(),
      trigger_type: triggerType,
      trigger_conditions: triggerConditions,
      response_type: responseType,
      response_content: responseType === 'text' ? responseContent.trim() : null,
      priority,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>রুলের নাম</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="যেমন: অর্ডার কীওয়ার্ড রিপ্লাই"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>ট্রিগার টাইপ</Label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {triggerTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>রেসপন্স টাইপ</Label>
          <Select value={responseType} onValueChange={setResponseType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {responseTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {triggerType === 'keyword' && (
        <div className="space-y-2">
          <Label>কীওয়ার্ড (কমা দিয়ে আলাদা করুন)</Label>
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="অর্ডার, কিনতে, দাম"
          />
          <p className="text-xs text-muted-foreground">
            মেসেজে এই শব্দগুলো থাকলে রুল ট্রিগার হবে
          </p>
        </div>
      )}

      {responseType === 'text' && (
        <div className="space-y-2">
          <Label>রেসপন্স মেসেজ</Label>
          <Textarea
            value={responseContent}
            onChange={(e) => setResponseContent(e.target.value)}
            placeholder="এই মেসেজ পাঠানো হবে..."
            rows={3}
          />
        </div>
      )}

      {responseType === 'ai' && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            AI স্বয়ংক্রিয়ভাবে ট্রেনিং ডেটা ব্যবহার করে উত্তর তৈরি করবে
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>প্রায়োরিটি</Label>
          <Input
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            min={0}
            max={100}
          />
          <p className="text-xs text-muted-foreground">
            বড় সংখ্যা = বেশি প্রায়োরিটি
          </p>
        </div>

        <div className="flex items-center justify-between pt-6">
          <Label>সক্রিয়</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'সেভ করুন'}
      </Button>
    </form>
  );
}
