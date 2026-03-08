import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Store, Crown, Calendar, Shield } from 'lucide-react';

export interface ShopOverviewRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  is_active: boolean;
  shop_type: string | null;
  logo_url: string | null;
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  grace_period_ends_at: string | null;
  created_at: string;
  product_count: number;
  landing_page_count: number;
  order_count: number;
  team_member_count: number;
  total_rows: number;
}

interface ShopManageModalProps {
  shop: ShopOverviewRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-emerald-500' },
  { value: 'grace_period', label: 'Grace Period', color: 'bg-amber-500' },
  { value: 'suspended', label: 'Suspended', color: 'bg-destructive' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-muted-foreground' },
] as const;

export function ShopManageModal({ shop, open, onOpenChange }: ShopManageModalProps) {
  const queryClient = useQueryClient();
  const { data: plans } = usePricingPlans(true);

  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [graceDate, setGraceDate] = useState('');

  useEffect(() => {
    if (shop) {
      setSelectedPlan(shop.plan || '');
      setSelectedStatus(shop.status || 'active');
      setGraceDate(
        shop.grace_period_ends_at
          ? new Date(shop.grace_period_ends_at).toISOString().split('T')[0]
          : ''
      );
    }
  }, [shop]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!shop) return;
      const updates: Record<string, unknown> = {};

      if (selectedPlan !== shop.plan) updates.plan = selectedPlan;
      if (selectedStatus !== shop.status) {
        updates.status = selectedStatus;
        // Auto-set is_active based on status
        updates.is_active = selectedStatus === 'active' || selectedStatus === 'grace_period';
      }
      if (graceDate) {
        updates.grace_period_ends_at = new Date(graceDate).toISOString();
      } else if (shop.grace_period_ends_at && !graceDate) {
        updates.grace_period_ends_at = null;
      }

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        return;
      }

      const { error } = await supabase
        .from('shops')
        .update(updates)
        .eq('id', shop.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] });
      toast.success('Shop updated successfully');
      onOpenChange(false);
    },
    onError: (err) => toast.error('Update failed: ' + (err as Error).message),
  });

  if (!shop) return null;

  const currentPlanObj = plans?.find((p) => p.slug === shop.plan);
  const hasChanges =
    selectedPlan !== shop.plan ||
    selectedStatus !== shop.status ||
    graceDate !== (shop.grace_period_ends_at ? new Date(shop.grace_period_ends_at).toISOString().split('T')[0] : '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Manage Shop
          </DialogTitle>
          <DialogDescription>
            {shop.name} — owned by {shop.owner_name || shop.owner_email || 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        {/* Shop Summary */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: 'Products', value: shop.product_count },
            { label: 'Pages', value: shop.landing_page_count },
            { label: 'Orders', value: shop.order_count },
            { label: 'Team', value: shop.team_member_count },
          ].map((stat) => (
            <div key={stat.label} className="rounded-md border p-2">
              <div className="text-lg font-bold font-digit">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Status Control */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Shop Status
          </Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Plan Management */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Pricing Plan
            {currentPlanObj && (
              <Badge variant="outline" className="ml-auto text-xs capitalize">
                Current: {currentPlanObj.name_en}
              </Badge>
            )}
          </Label>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans?.map((plan) => (
                <SelectItem key={plan.slug} value={plan.slug}>
                  <div className="flex items-center justify-between gap-4">
                    <span>{plan.name_en}</span>
                    <span className="text-xs text-muted-foreground">
                      ৳{plan.price_monthly}/mo
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grace Period */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Grace Period Ends At
          </Label>
          <Input
            type="date"
            value={graceDate}
            onChange={(e) => setGraceDate(e.target.value)}
            className="font-digit"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to clear. Shop auto-suspends after this date.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
