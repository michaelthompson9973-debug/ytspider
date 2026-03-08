import { Button } from '@/components/ui/button';
import { Globe, EyeOff, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/admin/landing-page-editor/DeleteConfirmDialog';

interface Props {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onPublish: (ids: string[]) => void;
  onUnpublish: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  isProcessing: boolean;
}

export function LandingPageBulkBar({ selectedIds, setSelectedIds, onPublish, onUnpublish, onDelete, isProcessing }: Props) {
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border rounded-lg shadow-xl px-4 py-3 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{selectedIds.length}টি সিলেক্টেড</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedIds([])}><X className="h-4 w-4" /></Button>
        </div>
        <div className="h-6 w-px bg-border" />
        <Button size="sm" variant="outline" onClick={() => onPublish(selectedIds)} disabled={isProcessing} className="h-8">
          <Globe className="mr-1.5 h-3.5 w-3.5" />Publish
        </Button>
        <Button size="sm" variant="outline" onClick={() => onUnpublish(selectedIds)} disabled={isProcessing} className="h-8">
          <EyeOff className="mr-1.5 h-3.5 w-3.5" />Unpublish
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)} disabled={isProcessing} className="h-8">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
        </Button>
      </div>

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={() => {
          onDelete(selectedIds);
          setBulkDeleteOpen(false);
        }}
        title={`${selectedIds.length}টি ল্যান্ডিং পেজ ডিলিট`}
        description={`আপনি কি নিশ্চিত যে ${selectedIds.length}টি ল্যান্ডিং পেজ ডিলিট করতে চান? সকল সেকশন এবং সেটিংস স্থায়ীভাবে মুছে যাবে। এই কাজটি আর ফেরানো যাবে না।`}
      />
    </>
  );
}
