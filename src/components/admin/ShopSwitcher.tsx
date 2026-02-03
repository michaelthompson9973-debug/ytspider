import React, { useState } from 'react';
import { useShop, Shop, ShopRole } from '@/contexts/ShopContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  ChevronDown, 
  Plus, 
  Check, 
  Settings,
  Users,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const roleLabels: Record<ShopRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const roleBadgeVariants: Record<ShopRole, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  editor: 'outline',
  viewer: 'outline',
};

export function ShopSwitcher() {
  const { currentShop, availableShops, userRole, switchShop, createShop, isLoading } = useShop();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSwitchShop = async (shop: Shop) => {
    try {
      await switchShop(shop.id);
      toast.success(`${shop.name} এ সুইচ করা হয়েছে`);
    } catch (error) {
      toast.error('শপ সুইচ করতে সমস্যা হয়েছে');
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newShopName.trim()) {
      toast.error('শপের নাম দিন');
      return;
    }

    setIsCreating(true);
    try {
      const shop = await createShop(newShopName.trim());
      toast.success(`"${shop.name}" শপ তৈরি হয়েছে!`);
      setCreateDialogOpen(false);
      setNewShopName('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'শপ তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setIsCreating(false);
    }
  };

  const getShopInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">লোড হচ্ছে...</span>
      </Button>
    );
  }

  if (!currentShop) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="h-4 w-4" />
        <span>নতুন শপ তৈরি করুন</span>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 max-w-[200px]">
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentShop.logo_url || undefined} alt={currentShop.name} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getShopInitials(currentShop.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate hidden sm:inline font-medium">{currentShop.name}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-[260px]">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            আপনার শপসমূহ
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {availableShops.map((shop) => (
            <DropdownMenuItem
              key={shop.id}
              onClick={() => handleSwitchShop(shop)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={shop.logo_url || undefined} alt={shop.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getShopInitials(shop.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{shop.name}</span>
                  {shop.id === currentShop.id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
                {shop.id === currentShop.id && userRole && (
                  <Badge variant={roleBadgeVariants[userRole]} className="text-[10px] h-4 mt-0.5">
                    {roleLabels[userRole]}
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2 text-primary cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            নতুন শপ তৈরি করুন
          </DropdownMenuItem>
          
          {userRole === 'owner' || userRole === 'admin' ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                <a href="/admin/settings">
                  <Settings className="h-4 w-4" />
                  শপ সেটিংস
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                <a href="/admin/team">
                  <Users className="h-4 w-4" />
                  টিম মেম্বার
                </a>
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Shop Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateShop}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                নতুন শপ তৈরি করুন
              </DialogTitle>
              <DialogDescription>
                আপনার নতুন বিজনেসের জন্য একটি শপ তৈরি করুন। পরে সব সেটিংস পরিবর্তন করা যাবে।
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="shop-name">শপের নাম</Label>
                <Input
                  id="shop-name"
                  placeholder="যেমন: chaldal, EcomX v2 Pro"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  disabled={isCreating}
                  autoFocus
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isCreating}
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={isCreating || !newShopName.trim()}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    শপ তৈরি করুন
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
