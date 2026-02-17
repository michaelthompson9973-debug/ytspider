import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Order } from './types';

interface OrderEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSave: (updates: Partial<Order>) => void;
  isSaving?: boolean;
}

export const OrderEditModal = React.forwardRef<HTMLDivElement, OrderEditModalProps>(
  ({ open, onOpenChange, order, onSave, isSaving = false }, ref) => {
    const [formData, setFormData] = useState({
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      customer_city: '',
      note: '',
    });

    useEffect(() => {
      if (order) {
        setFormData({
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          customer_city: order.customer_city,
          note: order.note || '',
        });
      }
    }, [order]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    if (!order) return null;

    return (
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent ref={ref} className="max-w-md">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>অর্ডার এডিট করুন</ResponsiveModalTitle>
          </ResponsiveModalHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">কাস্টমার নাম</Label>
              <Input id="customer_name" value={formData.customer_name} onChange={(e) => setFormData((prev) => ({ ...prev, customer_name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">ফোন নম্বর</Label>
              <Input id="customer_phone" value={formData.customer_phone} onChange={(e) => setFormData((prev) => ({ ...prev, customer_phone: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_address">ঠিকানা</Label>
              <Textarea id="customer_address" value={formData.customer_address} onChange={(e) => setFormData((prev) => ({ ...prev, customer_address: e.target.value }))} rows={2} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_city">শহর/এলাকা</Label>
              <Input id="customer_city" value={formData.customer_city} onChange={(e) => setFormData((prev) => ({ ...prev, customer_city: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">নোট</Label>
              <Textarea id="note" value={formData.note} onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))} rows={2} placeholder="অতিরিক্ত নোট..." />
            </div>

            <ResponsiveModalFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" /> বাতিল
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" /> {isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </Button>
            </ResponsiveModalFooter>
          </form>
        </ResponsiveModalContent>
      </ResponsiveModal>
    );
  }
);

OrderEditModal.displayName = 'OrderEditModal';
