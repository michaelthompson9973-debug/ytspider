import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { PricingPlan, PricingPlanInput } from '@/hooks/usePricingPlans';
import { useLanguage } from '@/contexts/LanguageContext';

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PricingPlan | null;
  onSubmit: (data: PricingPlanInput) => void;
  isLoading?: boolean;
}

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSubmit,
  isLoading,
}: PlanFormDialogProps) {
  const { language } = useLanguage();
  const isEdit = !!plan;
  
  const [formData, setFormData] = useState<PricingPlanInput>({
    name: '',
    name_en: '',
    slug: '',
    description: '',
    description_en: '',
    price_monthly: 0,
    price_yearly: undefined,
    duration_days: 30,
    max_shops: 1,
    max_orders_per_month: 100,
    max_team_members: 2,
    max_landing_pages: 10,
    max_products: 50,
    features: [],
    is_featured: false,
    is_active: true,
    is_contact_sales: false,
    sort_order: 0,
  });
  
  const [newFeature, setNewFeature] = useState('');
  const [unlimitedFields, setUnlimitedFields] = useState({
    max_shops: false,
    max_orders_per_month: false,
    max_team_members: false,
    max_landing_pages: false,
    max_products: false,
  });
  
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        name_en: plan.name_en,
        slug: plan.slug,
        description: plan.description || '',
        description_en: plan.description_en || '',
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly || undefined,
        duration_days: plan.duration_days,
        max_shops: plan.max_shops >= 999999 ? 999999 : plan.max_shops,
        max_orders_per_month: plan.max_orders_per_month === null || (plan.max_orders_per_month && plan.max_orders_per_month >= 999999) ? null : plan.max_orders_per_month,
        max_team_members: plan.max_team_members >= 999999 ? 999999 : plan.max_team_members,
        max_landing_pages: plan.max_landing_pages >= 999999 ? 999999 : plan.max_landing_pages,
        max_products: plan.max_products >= 999999 ? 999999 : plan.max_products,
        features: plan.features || [],
        is_featured: plan.is_featured,
        is_active: plan.is_active,
        is_contact_sales: plan.is_contact_sales,
        sort_order: plan.sort_order,
      });
      setUnlimitedFields({
        max_shops: plan.max_shops >= 999999,
        max_orders_per_month: plan.max_orders_per_month === null || (plan.max_orders_per_month && plan.max_orders_per_month >= 999999),
        max_team_members: plan.max_team_members >= 999999,
        max_landing_pages: plan.max_landing_pages >= 999999,
        max_products: plan.max_products >= 999999,
      });
    } else {
      setFormData({
        name: '',
        name_en: '',
        slug: '',
        description: '',
        description_en: '',
        price_monthly: 0,
        price_yearly: undefined,
        duration_days: 30,
        max_shops: 1,
        max_orders_per_month: 100,
        max_team_members: 2,
        max_landing_pages: 10,
        max_products: 50,
        features: [],
        is_featured: false,
        is_active: true,
        is_contact_sales: false,
        sort_order: 0,
      });
      setUnlimitedFields({
        max_shops: false,
        max_orders_per_month: false,
        max_team_members: false,
        max_landing_pages: false,
        max_products: false,
      });
    }
  }, [plan, open]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      max_shops: unlimitedFields.max_shops ? 999999 : formData.max_shops,
      max_orders_per_month: unlimitedFields.max_orders_per_month ? 999999 : formData.max_orders_per_month,
      max_team_members: unlimitedFields.max_team_members ? 999999 : formData.max_team_members,
      max_landing_pages: unlimitedFields.max_landing_pages ? 999999 : formData.max_landing_pages,
      max_products: unlimitedFields.max_products ? 999999 : formData.max_products,
    };
    onSubmit(submitData);
  };
  
  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()],
      }));
      setNewFeature('');
    }
  };
  
  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || [],
    }));
  };
  
  const generateSlug = () => {
    const slug = formData.name_en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit 
              ? (language === 'bn' ? 'প্ল্যান এডিট করুন' : 'Edit Plan')
              : (language === 'bn' ? 'নতুন প্ল্যান যোগ করুন' : 'Add New Plan')
            }
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'নাম (বাংলা)' : 'Name (Bengali)'}</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="প্রো"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'নাম (English)' : 'Name (English)'}</Label>
              <Input
                value={formData.name_en}
                onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                onBlur={generateSlug}
                placeholder="Pro"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="pro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'ক্রম' : 'Sort Order'}</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'মাসিক মূল্য (৳)' : 'Monthly Price (৳)'}</Label>
              <Input
                type="number"
                value={formData.price_monthly}
                onChange={e => setFormData(prev => ({ ...prev, price_monthly: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'বাৎসরিক মূল্য (৳)' : 'Yearly Price (৳)'}</Label>
              <Input
                type="number"
                value={formData.price_yearly || ''}
                onChange={e => setFormData(prev => ({ ...prev, price_yearly: parseFloat(e.target.value) || undefined }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'মেয়াদ (দিন)' : 'Duration (days)'}</Label>
              <Input
                type="number"
                value={formData.duration_days}
                onChange={e => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 30 }))}
                required
              />
            </div>
          </div>
          
          {/* Limits */}
          <div className="space-y-4">
            <h4 className="font-medium">{language === 'bn' ? 'লিমিটস' : 'Limits'}</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'max_shops', label: language === 'bn' ? 'শপ সংখ্যা' : 'Max Shops' },
                { key: 'max_orders_per_month', label: language === 'bn' ? 'অর্ডার/মাস' : 'Orders/month' },
                { key: 'max_team_members', label: language === 'bn' ? 'টিম মেম্বার' : 'Team Members' },
                { key: 'max_landing_pages', label: language === 'bn' ? 'ল্যান্ডিং পেজ' : 'Landing Pages' },
                { key: 'max_products', label: language === 'bn' ? 'প্রোডাক্ট' : 'Products' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">
                        {language === 'bn' ? 'আনলিমিটেড' : 'Unlimited'}
                      </Label>
                      <Switch
                        checked={unlimitedFields[key as keyof typeof unlimitedFields]}
                        onCheckedChange={checked => 
                          setUnlimitedFields(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={unlimitedFields[key as keyof typeof unlimitedFields] ? '' : (formData[key as keyof typeof formData] as number || '')}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      [key]: parseInt(e.target.value) || 0 
                    }))}
                    disabled={unlimitedFields[key as keyof typeof unlimitedFields]}
                    placeholder={unlimitedFields[key as keyof typeof unlimitedFields] ? '∞' : '0'}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
            <h4 className="font-medium">{language === 'bn' ? 'ফিচারস' : 'Features'}</h4>
            
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={e => setNewFeature(e.target.value)}
                placeholder={language === 'bn' ? 'নতুন ফিচার যোগ করুন' : 'Add new feature'}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.features?.map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{language === 'bn' ? 'সক্রিয়' : 'Active'}</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{language === 'bn' ? 'সবচেয়ে জনপ্রিয় ব্যাজ' : 'Most Popular Badge'}</Label>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{language === 'bn' ? 'যোগাযোগ করুন বাটন' : 'Contact Sales Button'}</Label>
              <Switch
                checked={formData.is_contact_sales}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_contact_sales: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (language === 'bn' ? 'সেভ হচ্ছে...' : 'Saving...')
                : (language === 'bn' ? 'সেভ করুন' : 'Save')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
