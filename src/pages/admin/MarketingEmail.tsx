import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Send, CheckCircle, Plus, Inbox } from 'lucide-react';

export default function MarketingEmail() {
  const { t } = useLanguage();
  const stats = { totalCampaigns: 0, sent: 0, opened: 0, clicked: 0 };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('sidebar.emailMarketing')}</h1>
            <p className="text-muted-foreground">Email marketing campaign management</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />New Campaign</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Total Campaigns</span></div><p className="text-2xl font-bold mt-1">{stats.totalCampaigns}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Send className="h-4 w-4 text-blue-500" /><span className="text-sm text-muted-foreground">Sent</span></div><p className="text-2xl font-bold mt-1">{stats.sent}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Inbox className="h-4 w-4 text-green-600" /><span className="text-sm text-muted-foreground">Opened</span></div><p className="text-2xl font-bold mt-1">{stats.opened}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-500" /><span className="text-sm text-muted-foreground">Clicked</span></div><p className="text-2xl font-bold mt-1">{stats.clicked}</p></CardContent></Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-purple-500" />Email Provider Setup</CardTitle>
            <CardDescription>Connect an email marketing service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4"><Mail className="h-8 w-8 text-purple-600" /></div>
              <h3 className="font-semibold text-lg mb-2">Connect Email Service</h3>
              <p className="text-muted-foreground max-w-md mb-4">Integrate Mailchimp, SendGrid, or any other email service.</p>
              <div className="flex gap-2"><Button variant="outline">Mailchimp</Button><Button variant="outline">SendGrid</Button><Button variant="outline">Resend</Button></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}