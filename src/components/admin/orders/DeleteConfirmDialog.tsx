import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Order } from './types';
import { getShortOrderId } from './utils';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmDialog = React.forwardRef<HTMLDivElement, DeleteConfirmDialogProps>(
  ({ open, onOpenChange, order, onConfirm, isDeleting = false }, ref) => {
    if (!order) return null;

    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent ref={ref}>
          <AlertDialogHeader>
            <AlertDialogTitle>অর্ডার ডিলিট করতে চান?</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে আপনি <strong>{order.customer_name}</strong> এর অর্ডার{' '}
              <strong>{getShortOrderId(order.id)}</strong> ডিলিট করতে চান?
              <br />
              <br />
              এই অ্যাকশনটি পূর্বাবস্থায় ফেরানো যাবে না। অর্ডার এবং সংশ্লিষ্ট সব আইটেম স্থায়ীভাবে মুছে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'ডিলিট হচ্ছে...' : 'ডিলিট করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';
