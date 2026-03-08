import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, CheckCircle, XCircle, Plus, Smartphone } from 'lucide-react';

export default function MarketingSMS() {
  const { t } = useLanguage();
  const stats = { totalCampaigns: 0, sent: 0, delivered: 0, failed: 0 };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('sidebar.smsCampaigns')}</h1>
            <p className="text-muted-foreground">SMS marketing campaign management</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />New Campaign</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Total Campaigns</span></div><p className="text-2xl font-bold mt-1">{stats.totalCampaigns}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Send className="h-4 w-4 text-blue-500" /><span className="text-sm text-muted-foreground">Sent</span></div><p className="text-2xl font-bold mt-1">{stats.sent}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm text-muted-foreground">Delivered</span></div><p className="text-2xl font-bold mt-1">{stats.delivered}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /><span className="text-sm text-muted-foreground">Failed</span></div><p className="text-2xl font-bold mt-1">{stats.failed}</p></CardContent></Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-blue-500" />SMS Provider Setup</CardTitle>
            <CardDescription>Connect an SMS gateway for bulk messaging</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4"><MessageCircle className="h-8 w-8 text-blue-600" /></div>
              <h3 className="font-semibold text-lg mb-2">Connect SMS Provider</h3>
              <p className="text-muted-foreground max-w-md mb-4">Integrate SSL SMS, Twilio, or any other SMS gateway.</p>
              <div className="flex gap-2"><Button variant="outline">SSL SMS</Button><Button variant="outline">Twilio</Button></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}