import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DynamicLayout } from '@/components/DynamicLayout';
import { ShopGuard } from '@/components/admin/ShopGuard';
import { DeleteConfirmDialog } from '@/components/admin/landing-page-editor/DeleteConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LandingPageStats,
  LandingPageHeader,
  LandingPageFilters,
  LandingPageGrid,
  LandingPageList,
  LandingPageBulkBar,
  LandingPageFormDialog,
  LandingPagePagination,
  useLandingPages,
} from '@/components/admin/landing-pages';
import type { LandingPage, PageForm } from '@/components/admin/landing-pages';

export default function LandingPages() {
  const navigate = useNavigate();
  const lp = useLandingPages();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  // Determine builder base path based on current URL
  const isShopRoute = location.pathname.startsWith('/shop');
  const builderBase = isShopRoute ? '/shop/pages/builder' : '/admin/pages/builder';

  const handleNewPage = () => { setEditingPage(null); setDialogOpen(true); };
  const handleEdit = (page: LandingPage) => { setEditingPage(page); setDialogOpen(true); };
  const handleBuilder = (page: LandingPage) => navigate(`${builderBase}/${page.id}`);
  const handleDelete = (id: string) => { setDeletingPageId(id); setDeleteDialogOpen(true); };
  const handleSave = (form: PageForm, editingId: string | null) => {
    lp.saveMutation.mutate({ form, editingId }, { onSuccess: () => { setDialogOpen(false); setEditingPage(null); } });
  };

  return (
    <DynamicLayout>
      <ShopGuard>
        <div className="space-y-5">
          <LandingPageHeader onNewPage={handleNewPage} />
          <LandingPageStats stats={lp.enhancedStats} />
          <LandingPageFilters
            statusFilter={lp.statusFilter} setStatusFilter={lp.setStatusFilter}
            searchQuery={lp.searchQuery} setSearchQuery={lp.setSearchQuery}
            viewMode={viewMode} setViewMode={setViewMode}
            stats={lp.enhancedStats} setSelectedIds={lp.setSelectedIds}
            filteredCount={lp.pages.length} selectedCount={lp.selectedIds.length} onSelectAll={lp.selectAll}
          />

          {lp.isLoading ? (
            <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3")}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-6 w-3/4 mb-3" /><Skeleton className="h-4 w-1/2 mb-4" /><Skeleton className="h-8 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : lp.pages.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">কোনো পেজ নেই</h3>
                <p className="text-muted-foreground mb-6">
                  {lp.searchQuery ? 'আপনার সার্চে কোনো পেজ পাওয়া যায়নি' : 'এখনো কোনো ল্যান্ডিং পেজ তৈরি হয়নি'}
                </p>
                {!lp.searchQuery && (
                  <Button onClick={handleNewPage}><Plus className="mr-2 h-4 w-4" />প্রথম পেজ তৈরি করুন</Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <LandingPageGrid pages={lp.pages} selectedIds={lp.selectedIds} toggleSelection={lp.toggleSelection}
              enhancedStats={lp.enhancedStats} onBuilder={handleBuilder} onEdit={handleEdit}
              onDuplicate={(p) => lp.duplicateMutation.mutate(p)} onDelete={handleDelete} />
          ) : (
            <LandingPageList pages={lp.pages} selectedIds={lp.selectedIds} toggleSelection={lp.toggleSelection}
              enhancedStats={lp.enhancedStats} onBuilder={handleBuilder} onEdit={handleEdit}
              onDuplicate={(p) => lp.duplicateMutation.mutate(p)} onDelete={handleDelete} />
          )}

          <LandingPagePagination page={lp.page} totalPagesCount={lp.totalPagesCount} totalItems={lp.totalPages} onPageChange={lp.setPage} />
          <LandingPageBulkBar selectedIds={lp.selectedIds} setSelectedIds={lp.setSelectedIds}
            onPublish={(ids) => lp.bulkPublishMutation.mutate(ids)} onUnpublish={(ids) => lp.bulkUnpublishMutation.mutate(ids)}
            onDelete={(ids) => lp.bulkDeleteMutation.mutate(ids)} isProcessing={lp.isProcessing} />
        </div>

        <LandingPageFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editingPage={editingPage}
          products={lp.products} onSave={handleSave} isSaving={lp.saveMutation.isPending} />

        <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}
          onConfirm={() => { if (deletingPageId) lp.deleteMutation.mutate(deletingPageId); setDeleteDialogOpen(false); setDeletingPageId(null); }}
          title="ল্যান্ডিং পেজ ডিলিট" description="আপনি কি নিশ্চিত যে এই ল্যান্ডিং পেজটি ডিলিট করতে চান? সকল সেকশন এবং সেটিংস স্থায়ীভাবে মুছে যাবে। এই কাজটি আর ফেরানো যাবে না।" />
      </ShopGuard>
    </DynamicLayout>
  );
}
