import { Minus, Plus } from 'lucide-react';

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  images?: string[] | null;
}

interface ProductListProps {
  items: CartItem[];
  currencySymbol: string;
  onQuantityChange: (productId: string, newQuantity: number) => void;
}

export function ProductList({ items, currencySymbol, onQuantityChange }: ProductListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const imageUrl = item.images?.[0] || '/placeholder.svg';
        const itemSubtotal = item.unitPrice * item.quantity;

        return (
          <div
            key={item.productId}
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-theme border"
          >
            {/* Product Image */}
            <div className="w-14 h-14 rounded-lg border overflow-hidden flex-shrink-0 bg-background">
              <img
                src={imageUrl}
                alt={item.productName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <p className="font-body font-medium text-sm truncate">{item.productName}</p>
              <p className="font-digit text-sm text-primary">
                {currencySymbol}{Number(item.unitPrice).toLocaleString('bn-BD')}
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onQuantityChange(item.productId, Math.max(0, item.quantity - 1))}
                className="w-8 h-8 rounded-theme border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-digit text-base w-8 text-center">{item.quantity}</span>
              <button
                type="button"
                onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
                className="w-8 h-8 rounded-theme border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Item Subtotal */}
            <div className="text-right min-w-[80px]">
              <p className="font-digit text-sm font-semibold">
                {currencySymbol}{itemSubtotal.toLocaleString('bn-BD')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
