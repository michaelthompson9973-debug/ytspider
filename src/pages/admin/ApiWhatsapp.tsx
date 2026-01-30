import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Eye, EyeOff, ExternalLink, Construction } from 'lucide-react';
import { useState } from 'react';

export default function ApiWhatsapp() {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <MessageSquare className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Business API</h1>
            <p className="text-muted-foreground">
              WhatsApp Business integration এর জন্য API credentials কনফিগার করুন
            </p>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <Construction className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            WhatsApp Business API integration শীঘ্রই আসছে। বর্তমানে এই feature development এ আছে।
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Credentials Card */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                API Credentials
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                Meta Business Suite থেকে WhatsApp API credentials সংগ্রহ করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                <Input
                  id="phoneNumberId"
                  placeholder="123456789012345"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Permanent Access Token</Label>
                <div className="relative">
                  <Input
                    id="accessToken"
                    type={showToken ? 'text' : 'password'}
                    placeholder="••••••••••••••••"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    disabled
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowToken(!showToken)}
                    disabled
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button disabled className="w-full">
                সংরক্ষণ করুন
              </Button>
            </CardContent>
          </Card>

          {/* Setup Guide Card */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Guide</CardTitle>
              <CardDescription>
                WhatsApp Business API সেটআপ করার ধাপসমূহ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      <a 
                        href="https://business.facebook.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Meta Business Suite <ExternalLink className="h-3 w-3" />
                      </a>
                      {' '}এ যান
                    </li>
                    <li>WhatsApp Business Account তৈরি করুন</li>
                    <li>একটি Phone Number যোগ করুন এবং verify করুন</li>
                    <li>Developer Portal থেকে API Access নিন</li>
                    <li>Permanent Access Token generate করুন</li>
                    <li>Phone Number ID কপি করুন</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="pt-2">
                <h4 className="font-medium mb-2">API Features:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Send Messages</Badge>
                  <Badge variant="outline">Receive Messages</Badge>
                  <Badge variant="outline">Message Templates</Badge>
                  <Badge variant="outline">Media Messages</Badge>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a 
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
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
