import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  Inbox
} from 'lucide-react';

export default function MarketingEmail() {
  const { t } = useLanguage();

  // Placeholder stats
  const stats = {
    totalCampaigns: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('sidebar.emailMarketing')}</h1>
            <p className="text-muted-foreground">ইমেইল মার্কেটিং ক্যাম্পেইন ম্যানেজমেন্ট</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            নতুন ক্যাম্পেইন
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">মোট ক্যাম্পেইন</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalCampaigns}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">পাঠানো</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.sent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">ওপেনড</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.opened}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">ক্লিকড</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.clicked}</p>
            </CardContent>
          </Card>
        </div>

        {/* Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-500" />
              Email Provider সেটআপ
            </CardTitle>
            <CardDescription>
              ইমেইল মার্কেটিং সার্ভিস কানেক্ট করুন
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email Service কানেক্ট করুন</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Mailchimp, SendGrid অথবা অন্য কোনো ইমেইল সার্ভিস ইন্টিগ্রেট করুন।
              </p>
              <div className="flex gap-2">
                <Button variant="outline">Mailchimp</Button>
                <Button variant="outline">SendGrid</Button>
                <Button variant="outline">Resend</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}