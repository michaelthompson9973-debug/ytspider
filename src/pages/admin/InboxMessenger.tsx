import AdminLayout from '@/components/admin/AdminLayout';
import { InboxLayout } from '@/components/admin/messenger';

export default function InboxMessenger() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messenger Inbox</h1>
          <p className="text-muted-foreground text-sm">
            Facebook Messenger কথোপকথন পরিচালনা করুন
          </p>
        </div>

        <InboxLayout />
      </div>
    </AdminLayout>
  );
}
