import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function ResponsiveModal({ open, onOpenChange, children }: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

const ResponsiveModalTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DialogTrigger>
>(({ ...props }, ref) => {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerTrigger ref={ref} {...props} />;
  return <DialogTrigger ref={ref} {...props} />;
});
ResponsiveModalTrigger.displayName = "ResponsiveModalTrigger";

const ResponsiveModalClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DialogClose>
>(({ ...props }, ref) => {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerClose ref={ref} {...props} />;
  return <DialogClose ref={ref} {...props} />;
});
ResponsiveModalClose.displayName = "ResponsiveModalClose";

interface ResponsiveModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  drawerClassName?: string;
}

const ResponsiveModalContent = React.forwardRef<
  HTMLDivElement,
  ResponsiveModalContentProps
>(({ className, drawerClassName, children, ...props }, ref) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DrawerContent
        ref={ref}
        className={cn("max-h-[85vh]", drawerClassName || className)}
      >
        <div className="overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent ref={ref} className={className} {...props}>
      {children}
    </DialogContent>
  );
});
ResponsiveModalContent.displayName = "ResponsiveModalContent";

const ResponsiveModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerHeader className={cn("text-left", className)} {...props} />;
  return <DialogHeader className={className} {...props} />;
};
ResponsiveModalHeader.displayName = "ResponsiveModalHeader";

const ResponsiveModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerFooter className={className} {...props} />;
  return <DialogFooter className={className} {...props} />;
};
ResponsiveModalFooter.displayName = "ResponsiveModalFooter";

const ResponsiveModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerTitle ref={ref} className={className} {...props} />;
  return <DialogTitle ref={ref} className={className} {...props} />;
});
ResponsiveModalTitle.displayName = "ResponsiveModalTitle";

const ResponsiveModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerDescription ref={ref} className={className} {...props} />;
  return <DialogDescription ref={ref} className={className} {...props} />;
});
ResponsiveModalDescription.displayName = "ResponsiveModalDescription";

export {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalClose,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalFooter,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
};
