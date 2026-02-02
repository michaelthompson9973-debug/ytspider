import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Plus, Facebook, Settings, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateConnection, useConnections } from './hooks/useConnections';
import { useFacebookLogin, FacebookPage } from '@/hooks/useFacebookLogin';
import { FacebookLoginButton } from './FacebookLoginButton';
import { PageSelector } from './PageSelector';
import { supabase } from '@/integrations/supabase/client';

interface AddPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPageModal({ open, onOpenChange }: AddPageModalProps) {
  const [activeTab, setActiveTab] = useState('facebook');
  
  // Manual form state
  const [pageName, setPageName] = useState('');
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  // Facebook App ID state
  const [appId, setAppId] = useState<string | null>(null);
  const [loadingAppId, setLoadingAppId] = useState(true);

  const createConnection = useCreateConnection();
  const { data: connections } = useConnections();
  const connectedPageIds = connections?.map(c => c.page_id) || [];

  const {
    isSDKLoaded,
    isLoading: fbLoading,
    isLoggedIn,
    pages,
    error: fbError,
    login,
    logout,
    clearError,
  } = useFacebookLogin(appId);

  // Fetch Facebook App ID on mount
  useEffect(() => {
    const fetchAppId = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('facebook-pages', {
          body: {},
          method: 'GET',
        });

        // For GET with query params, we need to use a different approach
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-pages?action=get-app-id`,
          {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        const result = await response.json();
        setAppId(result.app_id || null);
      } catch (error) {
        console.error('Error fetching app id:', error);
      } finally {
        setLoadingAppId(false);
      }
    };

    if (open) {
      fetchAppId();
    }
  }, [open]);

  const resetForm = () => {
    setPageName('');
    setPageId('');
    setAccessToken('');
    setShowToken(false);
    clearError();
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
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

  const handleFacebookConnect = async (page: FacebookPage) => {
    try {
      // Call edge function to connect page with long-lived token exchange
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-pages?action=connect-page`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_id: page.id,
            page_name: page.name,
            page_access_token: page.access_token,
            category: page.category,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect page');
      }

      toast.success(`${page.name} সফলভাবে সংযুক্ত হয়েছে`);
      
      // Refetch connections
      createConnection.reset();
      
    } catch (error) {
      console.error('Error connecting page:', error);
      toast.error('পেজ সংযুক্ত করতে সমস্যা হয়েছে');
      throw error;
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Plus className="h-5 w-5" />
            নতুন Facebook Page যোগ করুন
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="facebook" className="gap-2">
              <Facebook className="h-4 w-4" />
              Facebook Login
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Settings className="h-4 w-4" />
              Manual Setup
            </TabsTrigger>
          </TabsList>

          {/* Facebook Login Tab */}
          <TabsContent value="facebook" className="mt-4 space-y-4">
            {loadingAppId ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !appId ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Facebook App ID কনফিগার করা হয়নি। অনুগ্রহ করে FACEBOOK_APP_ID secret যোগ করুন।
                </AlertDescription>
              </Alert>
            ) : !isLoggedIn ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Facebook className="h-12 w-12 mx-auto mb-4 text-[#1877F2]" />
                  <h3 className="font-medium mb-2">Facebook দিয়ে লগইন করুন</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    আপনার Facebook অ্যাকাউন্ট দিয়ে লগইন করুন এবং পেজ সিলেক্ট করে সংযুক্ত করুন
                  </p>
                </div>

                {fbError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{fbError}</AlertDescription>
                  </Alert>
                )}

                <FacebookLoginButton
                  onClick={login}
                  isLoading={fbLoading}
                  disabled={!isSDKLoaded}
                />

                <div className="text-xs text-muted-foreground text-center">
                  <p className="mb-1">প্রয়োজনীয় permissions:</p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {['pages_show_list', 'pages_messaging', 'pages_read_engagement'].map(p => (
                      <span key={p} className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <PageSelector
                  pages={pages}
                  connectedPageIds={connectedPageIds}
                  onConnect={handleFacebookConnect}
                />
                
                <div className="flex justify-between pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={logout}>
                    অন্য অ্যাকাউন্ট ব্যবহার করুন
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    বন্ধ করুন
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Manual Setup Tab */}
          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
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
                  onClick={handleClose}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
