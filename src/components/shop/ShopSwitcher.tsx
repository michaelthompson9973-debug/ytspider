import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '@/contexts/ShopContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Store, Check, Plus } from 'lucide-react';
import { CreateShopDialog } from '@/components/admin/CreateShopDialog';

export function ShopSwitcher() {
  const { currentShop, availableShops, switchShop } = useShop();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const handleSwitch = async (shopId: string) => {
    await switchShop(shopId);
    navigate('/shop');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-[180px] justify-between">
            <div className="flex items-center gap-2">
              {currentShop?.logo_url ? (
                <img
                  src={currentShop.logo_url}
                  alt=""
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <Store className="h-4 w-4" />
              )}
              <span className="truncate max-w-[120px]">
                {currentShop?.name || 'Select Shop'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-[220px]">
          {availableShops.map((shop) => (
            <DropdownMenuItem
              key={shop.id}
              onClick={() => handleSwitch(shop.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt=""
                    className="h-5 w-5 rounded object-cover"
                  />
                ) : (
                  <div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-xs font-medium">
                    {shop.name.charAt(0)}
                  </div>
                )}
                <span className="truncate">{shop.name}</span>
              </div>
              {currentShop?.id === shop.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Shop
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateShopDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
