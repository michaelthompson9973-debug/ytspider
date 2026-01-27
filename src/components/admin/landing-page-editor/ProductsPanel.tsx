import { useState } from 'react';
import { Plus, Trash2, GripVertical, Minus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProducts, LandingPageProduct } from './useProducts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface ProductsPanelProps {
  landingPageId: string;
}

function SortableProductItem({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: LandingPageProduct;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageUrl = item.product.images?.[0] || '/placeholder.svg';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-background border rounded-lg',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Product Image */}
      <div className="w-12 h-12 rounded border overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={item.product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.product.name}</p>
        <p className="text-xs text-muted-foreground">
          ৳{Number(item.product.price).toLocaleString()}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onQuantityChange(item.id, Math.max(1, item.default_quantity - 1))}
          disabled={item.default_quantity <= 1}
          className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-50"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-sm">{item.default_quantity}</span>
        <button
          type="button"
          onClick={() => onQuantityChange(item.id, item.default_quantity + 1)}
          className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ProductsPanel({ landingPageId }: ProductsPanelProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  const {
    products,
    availableProducts,
    isLoading,
    addProduct,
    removeProduct,
    updateQuantity,
    reorderProducts,
    isAdding,
  } = useProducts(landingPageId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(products, oldIndex, newIndex);
      reorderProducts(reordered);
    }
  };

  const handleAddProduct = () => {
    if (selectedProductId) {
      addProduct(selectedProductId);
      setSelectedProductId('');
    }
  };

  // Filter out already added products from the selection dropdown
  const unaddedProducts = availableProducts.filter(
    (p) => !products.some((lp) => lp.product_id === p.id)
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Products
        </h3>
        <span className="text-xs text-muted-foreground">
          {products.length} item{products.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add Product */}
      <div className="flex gap-2 mb-4">
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select product..." />
          </SelectTrigger>
          <SelectContent>
            {unaddedProducts.length === 0 ? (
              <SelectItem value="_empty" disabled>
                No products available
              </SelectItem>
            ) : (
              unaddedProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - ৳{Number(product.price).toLocaleString()}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          onClick={handleAddProduct}
          disabled={!selectedProductId || isAdding}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Product List */}
      {products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg">
          <Package className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No products added yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Select a product above to add it
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={products.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {products.map((item) => (
                  <SortableProductItem
                    key={item.id}
                    item={item}
                    onRemove={removeProduct}
                    onQuantityChange={updateQuantity}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      )}

      {/* Help Text */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Drag to reorder. Set default quantity for each product.
        </p>
      </div>
    </div>
  );
}
