import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Plus, Copy, CheckCircle, ExternalLink, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import { useConnections } from '@/components/admin/messenger/hooks/useConnections';
import { PageConnectionCard } from '@/components/admin/messenger/PageConnectionCard';
import { AddPageModal } from '@/components/admin/messenger/AddPageModal';

export default function ApiMessenger() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: connections, isLoading } = useConnections();

  const webhookUrl = `https://otibsrdecgygoeshfoho.supabase.co/functions/v1/messenger-webhook`;

  const handleCopyWebhookUrl = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('Webhook URL কপি করা হয়েছে');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading">Messenger Pages</h1>
              <p className="text-muted-foreground">
                Facebook Messenger এ সংযুক্ত পেজগুলো ম্যানেজ করুন
              </p>
            </div>
          </div>
          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            নতুন পেজ যোগ করুন
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Connected Pages - Main Column */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <Facebook className="h-5 w-5 text-blue-500" />
                  Connected Pages
                </CardTitle>
                <CardDescription>
                  আপনার সংযুক্ত Facebook Page গুলো এখানে দেখুন
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : connections && connections.length > 0 ? (
                  connections.map((connection) => (
                    <PageConnectionCard key={connection.id} connection={connection} />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Facebook className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">কোনো পেজ সংযুক্ত নেই</p>
                    <p className="text-sm mt-1">
                      "নতুন পেজ যোগ করুন" বাটনে ক্লিক করে আপনার Facebook Page যোগ করুন
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Setup Guide - Right Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Setup Guide</CardTitle>
                <CardDescription>
                  Facebook Page যোগ করার ধাপসমূহ
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
                      <li>একটি App তৈরি করুন বা বিদ্যমান App সিলেক্ট করুন</li>
                      <li>"Messenger" প্রোডাক্ট যোগ করুন</li>
                      <li>Messenger Settings এ গিয়ে আপনার Page যোগ করুন</li>
                      <li>Page Access Token জেনারেট করুন</li>
                      <li>নিচের Webhook URL এবং Verify Token ব্যবহার করুন</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={webhookUrl}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyWebhookUrl}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Facebook Messenger Webhook সেটআপে এই URL ব্যবহার করুন
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="font-medium mb-2 text-sm">Required Permissions:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['pages_show_list', 'pages_messaging', 'pages_read_engagement', 'pages_manage_metadata'].map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground"
                      >
                        {perm}
                      </span>
                    ))}
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
      </div>

      <AddPageModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </AdminLayout>
  );
}
