import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Monitor, Smartphone, Tablet, ChevronDown } from 'lucide-react';

export interface DevicePreset {
  name: string;
  width: number | 'full';
  height: number | 'full';
  icon: 'desktop' | 'mobile' | 'tablet';
}

export const devicePresets: DevicePreset[] = [
  { name: 'Desktop', width: 'full', height: 'full', icon: 'desktop' },
  { name: 'iPhone 14 Pro', width: 393, height: 852, icon: 'mobile' },
  { name: 'iPhone SE', width: 375, height: 667, icon: 'mobile' },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, icon: 'mobile' },
  { name: 'iPad', width: 768, height: 1024, icon: 'tablet' },
  { name: 'iPad Pro', width: 1024, height: 1366, icon: 'tablet' },
];

interface PreviewToolbarProps {
  selectedDevice: string;
  onDeviceChange: (deviceName: string) => void;
  isUnpublished?: boolean;
}

export function PreviewToolbar({ selectedDevice, onDeviceChange, isUnpublished }: PreviewToolbarProps) {
  const currentDevice = devicePresets.find(d => d.name === selectedDevice) || devicePresets[0];
  const isMobileOrTablet = currentDevice.width !== 'full';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Preview Mode Label */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Preview Mode</span>
          {isUnpublished && (
            <span className="text-xs bg-warning text-warning-foreground px-2 py-0.5 rounded">
              Unpublished
            </span>
          )}
        </div>

        {/* Center: Device Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {currentDevice.icon === 'desktop' && <Monitor className="h-4 w-4" />}
              {currentDevice.icon === 'mobile' && <Smartphone className="h-4 w-4" />}
              {currentDevice.icon === 'tablet' && <Tablet className="h-4 w-4" />}
              <span className="hidden sm:inline">{selectedDevice}</span>
              {isMobileOrTablet && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  ({currentDevice.width}×{currentDevice.height})
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="bg-popover">
            {devicePresets.map(device => (
              <DropdownMenuItem
                key={device.name}
                onClick={() => onDeviceChange(device.name)}
                className="flex items-center gap-2"
              >
                {device.icon === 'desktop' && <Monitor className="h-4 w-4" />}
                {device.icon === 'mobile' && <Smartphone className="h-4 w-4" />}
                {device.icon === 'tablet' && <Tablet className="h-4 w-4" />}
                <span>{device.name}</span>
                {device.width !== 'full' && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {device.width}×{device.height}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right: Quick Toggle Buttons */}
        <div className="flex gap-1">
          <Button
            variant={currentDevice.icon === 'desktop' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onDeviceChange('Desktop')}
            title="Desktop"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={currentDevice.icon === 'mobile' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onDeviceChange('iPhone 14 Pro')}
            title="Mobile"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            variant={currentDevice.icon === 'tablet' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onDeviceChange('iPad')}
            title="Tablet"
          >
            <Tablet className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
