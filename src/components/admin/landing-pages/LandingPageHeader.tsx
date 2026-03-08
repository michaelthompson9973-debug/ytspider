import { Button } from '@/components/ui/button';
import { Plus, Layout, BarChart3, Upload } from 'lucide-react';

interface Props {
  onNewPage: () => void;
}

export function LandingPageHeader({ onNewPage }: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight">ল্যান্ডিং পেজ</h1>
        <p className="text-sm text-muted-foreground mt-0.5">আপনার সকল ল্যান্ডিং পেজ ম্যানেজ করুন</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onNewPage} size="sm" className="font-medium">
          <Plus className="mr-1.5 h-4 w-4" />নতুন পেজ
        </Button>
        <Button variant="outline" size="sm" disabled><Layout className="mr-1.5 h-4 w-4" />টেমপ্লেট</Button>
        <Button variant="outline" size="sm" disabled><BarChart3 className="mr-1.5 h-4 w-4" />Analytics</Button>
        <Button variant="outline" size="sm" disabled><Upload className="mr-1.5 h-4 w-4" />Bulk Import</Button>
      </div>
    </div>
  );
}
