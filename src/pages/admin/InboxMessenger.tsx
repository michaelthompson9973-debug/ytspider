import AdminLayout from '@/components/admin/AdminLayout';
import { InboxLayout } from '@/components/admin/messenger';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export default function InboxMessenger() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Messenger Inbox</h1>
            <p className="text-muted-foreground text-sm">
              Facebook Messenger কথোপকথন পরিচালনা করুন
            </p>
          </div>

          <Button variant="outline" className="gap-2" asChild>
            <Link to="/admin/api/messaging/messenger">
              <ExternalLink className="h-4 w-4" />
              Page Connect
            </Link>
          </Button>
        </div>

        <InboxLayout />
      </div>
    </AdminLayout>
  );
}
