import { Layers, Code, Eye, Palette, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'sections' | 'editor' | 'preview' | 'theme' | 'checkout';

interface MobileNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  hasActiveSection: boolean;
}

const tabs: { id: MobileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'sections', label: 'Sections', icon: Layers },
  { id: 'editor', label: 'Editor', icon: Code },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'checkout', label: 'Checkout', icon: ShoppingCart },
];

export function MobileNavigation({ activeTab, onTabChange, hasActiveSection }: MobileNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40 lg:hidden safe-area-inset-bottom">
      <nav className="flex items-center justify-around h-14">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const isDisabled = id === 'editor' && !hasActiveSection;
          
          return (
            <button
              key={id}
              onClick={() => !isDisabled && onTabChange(id)}
              disabled={isDisabled}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors',
                isActive && 'text-primary',
                !isActive && !isDisabled && 'text-muted-foreground hover:text-foreground',
                isDisabled && 'text-muted-foreground/50 cursor-not-allowed'
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
