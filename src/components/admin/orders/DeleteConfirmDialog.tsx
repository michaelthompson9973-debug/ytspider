import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
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
              <DrawerTitle>Delete this order?</DrawerTitle>
              <DrawerDescription>
                Order <strong>{getShortOrderId(order.id)}</strong> by <strong>{order.customer_name}</strong> will be permanently deleted. This action cannot be undone.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>Cancel</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent ref={ref}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order <strong>{getShortOrderId(order.id)}</strong> by <strong>{order.customer_name}</strong>?
              <br /><br />This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';
