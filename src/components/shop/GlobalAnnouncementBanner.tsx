/**
 * GlobalAnnouncementBanner — Shows platform-wide announcements
 * 
 * Fetched from platform_settings table.
 * Rendered at the top of ShopLayout.
 */

import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Info, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import { useState } from 'react';

export function GlobalAnnouncementBanner() {
  const { announcement, announcementType, isMaintenanceMode, settings } = usePlatformSettings();
  const [dismissed, setDismissed] = useState(false);

  // Maintenance mode takes priority
  if (isMaintenanceMode) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <AlertOctagon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {settings?.maintenance_message || 'System is under maintenance. Please try again later.'}
          </span>
        </div>
      </div>
    );
  }

  if (!announcement || dismissed) return null;

  const iconMap = {
    info: Info,
    warning: AlertTriangle,
    critical: AlertOctagon,
  };

  const colorMap = {
    info: 'bg-primary/5 border-primary/20 text-primary',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
    critical: 'bg-destructive/10 border-destructive/20 text-destructive',
  };

  const Icon = iconMap[announcementType] || Info;
  const colors = colorMap[announcementType] || colorMap.info;

  return (
    <div className={`${colors} border-b px-4 py-2.5 text-center relative`}>
      <div className="flex items-center justify-center gap-2">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm">{announcement}</span>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
