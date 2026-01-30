import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageCircle, Eye, EyeOff, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ApiMessenger() {
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connection, setConnection] = useState<{ id: string; app_id: string | null; is_active: boolean } | null>(null);

  useEffect(() => {
    fetchConnection();
  }, []);

  const fetchConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messenger_connections')
        .select('id, app_id, is_active')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setConnection(data);
        setAppId(data.app_id || '');
      }
    } catch (error) {
      console.error('Error fetching connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!appId.trim()) {
      toast.error('App ID দিন');
      return;
    }

    setSaving(true);
    try {
      if (connection) {
        // Update existing connection
        const { error } = await supabase
          .from('messenger_connections')
          .update({ app_id: appId.trim() })
          .eq('id', connection.id);

        if (error) throw error;
      }
      // Note: App Secret will be stored as a secret, not in DB
      
      toast.success('Messenger API credentials সংরক্ষণ হয়েছে');
      await fetchConnection();
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Credentials সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Messenger API</h1>
            <p className="text-muted-foreground">
              Facebook Messenger integration এর জন্য API credentials কনফিগার করুন
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Credentials Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                API Credentials
                {connection?.is_active ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Meta Developer Console থেকে App ID ও App Secret সংগ্রহ করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="appId">Facebook App ID</Label>
                    <Input
                      id="appId"
                      placeholder="123456789012345"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appSecret">Facebook App Secret</Label>
                    <div className="relative">
                      <Input
                        id="appSecret"
                        type={showSecret ? 'text' : 'password'}
                        placeholder="••••••••••••••••"
                        value={appSecret}
                        onChange={(e) => setAppSecret(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      App Secret নিরাপদে সংরক্ষণ করা হবে
                    </p>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        সংরক্ষণ হচ্ছে...
                      </>
                    ) : (
                      'সংরক্ষণ করুন'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Setup Guide Card */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Guide</CardTitle>
              <CardDescription>
                Meta Developer Console এ App তৈরি করার ধাপসমূহ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      <a 
                        href="https://developers.facebook.com/apps/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Meta Developer Console <ExternalLink className="h-3 w-3" />
                      </a>
                      {' '}এ যান
                    </li>
                    <li>"Create App" ক্লিক করুন → "Business" টাইপ সিলেক্ট করুন</li>
                    <li>App এর নাম দিন এবং Business Account সিলেক্ট করুন</li>
                    <li>"Messenger" প্রোডাক্ট যোগ করুন</li>
                    <li>Settings → Basic থেকে App ID ও App Secret কপি করুন</li>
                    <li>Messenger → Settings এ গিয়ে Facebook Page যোগ করুন</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="pt-2">
                <h4 className="font-medium mb-2">Required Permissions:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">pages_show_list</Badge>
                  <Badge variant="outline">pages_messaging</Badge>
                  <Badge variant="outline">pages_read_engagement</Badge>
                  <Badge variant="outline">pages_manage_metadata</Badge>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a 
                  href="https://developers.facebook.com/docs/messenger-platform/getting-started" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Official Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
