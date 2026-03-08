import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, TrendingUp, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function MarketingWhatsApp() {
  const { t } = useLanguage();
  const stats = { totalCampaigns: 0, sent: 0, delivered: 0, failed: 0 };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('sidebar.whatsappCampaigns')}</h1>
            <p className="text-muted-foreground">WhatsApp marketing campaign management</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />New Campaign</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Total Campaigns</span></div><p className="text-2xl font-bold mt-1">{stats.totalCampaigns}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Send className="h-4 w-4 text-blue-500" /><span className="text-sm text-muted-foreground">Sent</span></div><p className="text-2xl font-bold mt-1">{stats.sent}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm text-muted-foreground">Delivered</span></div><p className="text-2xl font-bold mt-1">{stats.delivered}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /><span className="text-sm text-muted-foreground">Failed</span></div><p className="text-2xl font-bold mt-1">{stats.failed}</p></CardContent></Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-green-500" />WhatsApp Business Setup</CardTitle>
            <CardDescription>Connect WhatsApp Business API to run marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4"><MessageSquare className="h-8 w-8 text-green-600" /></div>
              <h3 className="font-semibold text-lg mb-2">Connect WhatsApp Business API</h3>
              <p className="text-muted-foreground max-w-md mb-4">Set up WhatsApp Business API from Meta Business Suite to communicate directly with customers.</p>
              <Button variant="outline">Start Setup</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg"><Users className="h-6 w-6 text-primary mb-2" /><h4 className="font-medium">Audience Segmentation</h4><p className="text-sm text-muted-foreground">Segment customers into groups and send targeted messages</p></div>
              <div className="p-4 border rounded-lg"><Clock className="h-6 w-6 text-primary mb-2" /><h4 className="font-medium">Scheduled Campaigns</h4><p className="text-sm text-muted-foreground">Schedule automatic messages at specific times</p></div>
              <div className="p-4 border rounded-lg"><TrendingUp className="h-6 w-6 text-primary mb-2" /><h4 className="font-medium">Campaign Analytics</h4><p className="text-sm text-muted-foreground">Delivery rate, open rate, and click tracking</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}