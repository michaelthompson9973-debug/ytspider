import AdminLayout from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  Plus,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function MarketingWhatsApp() {
  const { t } = useLanguage();

  // Placeholder stats
  const stats = {
    totalCampaigns: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('sidebar.whatsappCampaigns')}</h1>
            <p className="text-muted-foreground">হোয়াটসঅ্যাপ মার্কেটিং ক্যাম্পেইন ম্যানেজমেন্ট</p>
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
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
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
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">ডেলিভার্ড</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.delivered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">ব্যর্থ</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.failed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              WhatsApp Business সেটআপ
            </CardTitle>
            <CardDescription>
              হোয়াটসঅ্যাপ বিজনেস API কানেক্ট করুন মার্কেটিং ক্যাম্পেইন চালানোর জন্য
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">WhatsApp Business API কানেক্ট করুন</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Meta Business Suite থেকে WhatsApp Business API সেটআপ করে কাস্টমারদের সাথে সরাসরি যোগাযোগ করুন।
              </p>
              <Button variant="outline">
                সেটআপ শুরু করুন
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Features */}
        <Card>
          <CardHeader>
            <CardTitle>আসছে শীঘ্রই</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <Users className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-medium">অডিয়েন্স সেগমেন্টেশন</h4>
                <p className="text-sm text-muted-foreground">
                  কাস্টমারদের বিভিন্ন গ্রুপে ভাগ করে টার্গেটেড মেসেজ পাঠান
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <Clock className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-medium">শিডিউল ক্যাম্পেইন</h4>
                <p className="text-sm text-muted-foreground">
                  নির্দিষ্ট সময়ে অটোমেটিক মেসেজ পাঠানোর সুবিধা
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-medium">ক্যাম্পেইন এনালিটিক্স</h4>
                <p className="text-sm text-muted-foreground">
                  ডেলিভারি রেট, ওপেন রেট এবং ক্লিক ট্র্যাকিং
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}