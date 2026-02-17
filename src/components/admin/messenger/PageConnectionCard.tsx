import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from '@/components/ui/drawer';
import {
  ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Facebook, Trash2, Link2, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MessengerConnection } from './types';
import { useToggleConnectionStatus, useDeleteConnection } from './hooks/useConnections';

interface PageConnectionCardProps {
  connection: MessengerConnection;
}

export function PageConnectionCard({ connection }: PageConnectionCardProps) {
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState<'url' | 'token' | null>(null);
  const isMobile = useIsMobile();

  const toggleStatus = useToggleConnectionStatus();
  const deleteConnection = useDeleteConnection();

  const webhookUrl = `https://otibsrdecgygoeshfoho.supabase.co/functions/v1/messenger-webhook`;

  const handleCopy = async (text: string, type: 'url' | 'token') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('কপি করা হয়েছে');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleToggle = (checked: boolean) => toggleStatus.mutate({ connectionId: connection.id, isActive: checked });
  const handleDelete = () => { deleteConnection.mutate(connection.id); setDeleteOpen(false); };
  const maskToken = (token: string) => token.length <= 10 ? '••••••••••' : '••••••••••' + token.slice(-6);

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-blue-500/10 shrink-0"><Facebook className="h-5 w-5 text-blue-500" /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate font-heading">{connection.page_name}</h3>
                <Badge variant={connection.is_active ? 'default' : 'secondary'} className={connection.is_active ? 'bg-green-500' : ''}>
                  {connection.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">ID: {connection.page_id}</p>
              <p className="text-xs text-muted-foreground mt-1">{format(new Date(connection.created_at), 'dd MMM yyyy', { locale: bn })}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={connection.is_active} onCheckedChange={handleToggle} disabled={toggleStatus.isPending} />
            
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWebhookDialogOpen(true)}>
              <Link2 className="h-4 w-4" />
            </Button>

            <ResponsiveModal open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
              <ResponsiveModalContent>
                <ResponsiveModalHeader>
                  <ResponsiveModalTitle className="font-heading">Webhook তথ্য</ResponsiveModalTitle>
                </ResponsiveModalHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input value={webhookUrl} readOnly className="text-xs font-mono" />
                      <Button size="icon" variant="outline" onClick={() => handleCopy(webhookUrl, 'url')}>
                        {copied === 'url' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Verify Token</Label>
                    <div className="flex gap-2">
                      <Input value={connection.webhook_verify_token} readOnly className="text-xs font-mono" />
                      <Button size="icon" variant="outline" onClick={() => handleCopy(connection.webhook_verify_token, 'token')}>
                        {copied === 'token' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Page Access Token</Label>
                    <Input value={maskToken(connection.page_access_token)} readOnly className="text-xs font-mono" />
                  </div>
                </div>
              </ResponsiveModalContent>
            </ResponsiveModal>

            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>

            {isMobile ? (
              <Drawer open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DrawerContent>
                  <DrawerHeader className="text-left">
                    <DrawerTitle className="font-heading">পেজ ডিলিট করবেন?</DrawerTitle>
                    <DrawerDescription>"{connection.page_name}" ডিলিট করলে সব conversation মুছে যাবে।</DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleteConnection.isPending}>
                      {deleteConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ডিলিট করুন'}
                    </Button>
                    <Button variant="outline" onClick={() => setDeleteOpen(false)}>বাতিল</Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ) : (
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading">পেজ ডিলিট করবেন?</AlertDialogTitle>
                    <AlertDialogDescription>"{connection.page_name}" ডিলিট করলে সব conversation ও message মুছে যাবে।</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>বাতিল</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteConnection.isPending}>
                      {deleteConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ডিলিট করুন'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
