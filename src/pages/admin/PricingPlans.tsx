import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, CreditCard, Users, Package, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PlanCard, PlanFormDialog } from '@/components/admin/pricing';
import { usePricingPlans, useCreatePricingPlan, useUpdatePricingPlan, useDeletePricingPlan, PricingPlan, PricingPlanInput } from '@/hooks/usePricingPlans';

export default function PricingPlans() {
  const { language } = useLanguage();
  const { data: plans, isLoading } = usePricingPlans();
  const createPlan = useCreatePricingPlan();
  const updatePlan = useUpdatePricingPlan();
  const deletePlan = useDeletePricingPlan();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PricingPlan | null>(null);

  const handleCreate = () => { setEditingPlan(null); setFormOpen(true); };
  const handleEdit = (plan: PricingPlan) => { setEditingPlan(plan); setFormOpen(true); };
  const handleDelete = (plan: PricingPlan) => { setDeleteConfirm(plan); };
  const handleSubmit = (data: PricingPlanInput) => {
    if (editingPlan) { updatePlan.mutate({ id: editingPlan.id, ...data }, { onSuccess: () => setFormOpen(false) }); }
    else { createPlan.mutate(data, { onSuccess: () => setFormOpen(false) }); }
  };
  const confirmDelete = () => { if (deleteConfirm) { deletePlan.mutate(deleteConfirm.id, { onSuccess: () => setDeleteConfirm(null) }); } };

  const stats = { totalPlans: plans?.length || 0, activePlans: plans?.filter(p => p.is_active).length || 0, totalSubscriptions: 0, thisMonthRevenue: 0 };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold font-heading">Pricing Plans</h1><p className="text-muted-foreground">Manage your plans and packages</p></div>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />New Plan</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Package className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.totalPlans}</p><p className="text-xs text-muted-foreground">Total Plans</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-500/10 rounded-lg"><CreditCard className="h-5 w-5 text-emerald-500" /></div><div><p className="text-2xl font-bold">{stats.activePlans}</p><p className="text-xs text-muted-foreground">Active Plans</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-500/10 rounded-lg"><Users className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold">{stats.totalSubscriptions}</p><p className="text-xs text-muted-foreground">Subscriptions</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-amber-500" /></div><div><p className="text-2xl font-bold">৳{stats.thisMonthRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">This Month</p></div></div></CardContent></Card>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">All Plans</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[1,2,3,4].map(i => (<Card key={i}><CardHeader className="pb-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-8 w-32 mt-2" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>))}</div>
          ) : plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{plans.map(plan => (<PlanCard key={plan.id} plan={plan} onEdit={handleEdit} onDelete={handleDelete} />))}</div>
          ) : (
            <Card><CardContent className="py-12 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="font-medium mb-2">No Plans Yet</h3><p className="text-sm text-muted-foreground mb-4">Create your first pricing plan</p><Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />Create Plan</Button></CardContent></Card>
          )}
        </div>
      </div>
      <PlanFormDialog open={formOpen} onOpenChange={setFormOpen} plan={editingPlan} onSubmit={handleSubmit} isLoading={createPlan.isPending || updatePlan.isPending} />
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Plan</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{deleteConfirm?.name_en}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}