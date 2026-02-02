import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateConnection } from './hooks/useConnections';

interface AddPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPageModal({ open, onOpenChange }: AddPageModalProps) {
  const [pageName, setPageName] = useState('');
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const createConnection = useCreateConnection();

  const resetForm = () => {
    setPageName('');
    setPageId('');
    setAccessToken('');
    setShowToken(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pageName.trim() || !pageId.trim() || !accessToken.trim()) {
      toast.error('সকল ফিল্ড পূরণ করুন');
      return;
    }

    try {
      await createConnection.mutateAsync({
        page_name: pageName.trim(),
        page_id: pageId.trim(),
        page_access_token: accessToken.trim(),
      });

      toast.success('পেজ সফলভাবে যোগ করা হয়েছে');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating connection:', error);
      toast.error('পেজ যোগ করতে সমস্যা হয়েছে');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Plus className="h-5 w-5" />
            নতুন Facebook Page যোগ করুন
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="pageName">Page Name *</Label>
            <Input
              id="pageName"
              placeholder="যেমন: My Shop"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pageId">Page ID *</Label>
            <Input
              id="pageId"
              placeholder="1234567890123456"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Facebook Page এর About সেকশন থেকে Page ID পাবেন
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessToken">Page Access Token *</Label>
            <div className="relative">
              <Input
                id="accessToken"
                type={showToken ? 'text' : 'password'}
                placeholder="EAAG..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Meta Developer Console → Messenger → Access Tokens থেকে জেনারেট করুন
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              বাতিল
            </Button>
            <Button type="submit" disabled={createConnection.isPending}>
              {createConnection.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  যোগ হচ্ছে...
                </>
              ) : (
                'পেজ যোগ করুন'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
