import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
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
    const isMobile = useIsMobile();

    if (!order) return null;

    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>অর্ডার ডিলিট করতে চান?</DrawerTitle>
              <DrawerDescription>
                <strong>{order.customer_name}</strong> এর অর্ডার{' '}
                <strong>{getShortOrderId(order.id)}</strong> ডিলিট করলে পূর্বাবস্থায় ফেরানো যাবে না।
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
                {isDeleting ? 'ডিলিট হচ্ছে...' : 'ডিলিট করুন'}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
                বাতিল
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent ref={ref}>
          <AlertDialogHeader>
            <AlertDialogTitle>অর্ডার ডিলিট করতে চান?</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে আপনি <strong>{order.customer_name}</strong> এর অর্ডার{' '}
              <strong>{getShortOrderId(order.id)}</strong> ডিলিট করতে চান?
              <br /><br />
              এই অ্যাকশনটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'ডিলিট হচ্ছে...' : 'ডিলিট করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';
