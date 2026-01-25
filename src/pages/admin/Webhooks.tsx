import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Send, MessageSquare, Mail } from 'lucide-react';
import { z } from 'zod';

// Type for webhook since it's not in generated types yet
interface Webhook {
  id: string;
  name: string;
  type: string;
  url: string | null;
  email: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['telegram', 'slack', 'email']),
  url: z.string().optional(),
  email: z.string().email().optional(),
  enabled: z.boolean(),
});

type WebhookForm = z.infer<typeof webhookSchema>;

const defaultForm: WebhookForm = {
  name: '',
  type: 'telegram',
  url: '',
  email: '',
  enabled: true,
};

export default function Webhooks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WebhookForm>(defaultForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks' as never)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Webhook[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: WebhookForm) => {
      const payload = {
        name: data.name,
        type: data.type,
        url: data.type !== 'email' ? data.url : null,
        email: data.type === 'email' ? data.email : null,
        enabled: data.enabled,
      };

      if (editingId) {
        const { error } = await supabase
          .from('webhooks' as never)
          .update(payload as never)
          .eq('id' as never, editingId as never);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('webhooks' as never).insert([payload] as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editingId ? 'Webhook updated' : 'Webhook created' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhooks' as never).delete().eq('id' as never, id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({ title: 'Webhook deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (webhook: Webhook) => {
      const { error } = await supabase.functions.invoke('send-webhook', {
        body: {
          webhookId: webhook.id,
          test: true,
          message: 'Test notification from Ytspider',
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Test sent successfully' });
    },
    onError: (error) => {
      toast({ title: 'Test failed', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openEdit = (webhook: Webhook) => {
    setForm({
      name: webhook.name,
      type: webhook.type as 'telegram' | 'slack' | 'email',
      url: webhook.url ?? '',
      email: webhook.email ?? '',
      enabled: webhook.enabled,
    });
    setEditingId(webhook.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = webhookSchema.safeParse(form);
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'telegram': return Send;
      case 'slack': return MessageSquare;
      case 'email': return Mail;
      default: return Send;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">Get notified when new orders come in</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Webhook
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Loading...
            </div>
          ) : webhooks?.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                No webhooks configured. Add one to get notifications.
              </CardContent>
            </Card>
          ) : (
            webhooks?.map((webhook) => {
              const Icon = getIcon(webhook.type);
              return (
                <Card key={webhook.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">{webhook.name}</CardTitle>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${webhook.enabled ? 'bg-green-500' : 'bg-muted'}`} />
                    </div>
                    <CardDescription className="capitalize">{webhook.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground truncate mb-4">
                      {webhook.type === 'email' ? webhook.email : webhook.url}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => testMutation.mutate(webhook)}
                        disabled={testMutation.isPending}
                      >
                        Test
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(webhook)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(webhook.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Webhook' : 'New Webhook'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Order notifications"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm({ ...form, type: val as 'telegram' | 'slack' | 'email' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type === 'email' ? (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="notify@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="url">Webhook URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder={form.type === 'telegram' ? 'https://api.telegram.org/bot.../sendMessage' : 'https://hooks.slack.com/...'}
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  id="enabled"
                  checked={form.enabled}
                  onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
                />
                <Label htmlFor="enabled">Enabled</Label>
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
      </div>
    </AdminLayout>
  );
}
