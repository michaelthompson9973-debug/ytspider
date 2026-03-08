import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderItem } from './types';
import { formatCurrency } from './utils';
import { cn } from '@/lib/utils';

interface Product { id: string; name: string; price: number; }

interface OrderItemsEditorProps {
  items: OrderItem[];
  products: Product[];
  currency: string;
  onSave: (items: OrderItem[]) => void;
  isEditing: boolean;
  onEditChange: (editing: boolean) => void;
  isSaving?: boolean;
}

export const OrderItemsEditor = React.forwardRef<HTMLDivElement, OrderItemsEditorProps>(
  ({ items, products, currency, onSave, isEditing, onEditChange, isSaving = false }, ref) => {
    const [editedItems, setEditedItems] = useState<OrderItem[]>(items);
    useEffect(() => { setEditedItems(items); }, [items]);

    const handleQuantityChange = (itemId: string, delta: number) => {
      setEditedItems((prev) => prev.map((item) => {
        if (item.id === itemId) { const newQuantity = Math.max(1, item.quantity + delta); return { ...item, quantity: newQuantity, subtotal: newQuantity * item.unit_price }; }
        return item;
      }));
    };
    const handleRemoveItem = (itemId: string) => { setEditedItems((prev) => prev.filter((item) => item.id !== itemId)); };
    const handleAddItem = (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const newItem: OrderItem = { id: `new-${Date.now()}`, order_id: items[0]?.order_id || '', product_id: product.id, product_name: product.name, quantity: 1, unit_price: product.price, subtotal: product.price, created_at: new Date().toISOString() };
      setEditedItems((prev) => [...prev, newItem]);
    };
    const handleSave = () => { onSave(editedItems); };
    const handleCancel = () => { setEditedItems(items); onEditChange(false); };
    const total = editedItems.reduce((sum, item) => sum + item.subtotal, 0);

    return (
      <div ref={ref} className="space-y-3">
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-3 py-2 text-left font-medium">Product</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 text-center font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                {isEditing && <th className="px-3 py-2 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {editedItems.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{item.product_name}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price, currency)}</td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.id, -1)} disabled={item.quantity <= 1}><Minus className="h-3 w-3" /></Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                    ) : (<span className="text-center block">{item.quantity}</span>)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.subtotal, currency)}</td>
                  {isEditing && (<td className="px-3 py-2"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveItem(item.id)} disabled={editedItems.length <= 1}><Trash2 className="h-4 w-4" /></Button></td>)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30">
                <td colSpan={isEditing ? 3 : 3} className="px-3 py-2 text-right font-medium">Total:</td>
                <td className="px-3 py-2 text-right font-bold">{formatCurrency(total, currency)}</td>
                {isEditing && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
        {isEditing ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Select onValueChange={handleAddItem}><SelectTrigger className="flex-1"><SelectValue placeholder="Add new product..." /></SelectTrigger><SelectContent>{products.map((product) => (<SelectItem key={product.id} value={product.id}>{product.name} - {formatCurrency(product.price, currency)}</SelectItem>))}</SelectContent></Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}><X className="mr-2 h-4 w-4" />Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}><Save className="mr-2 h-4 w-4" />{isSaving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => onEditChange(true)}>Edit Items</Button>
        )}
      </div>
    );
  }
);

OrderItemsEditor.displayName = 'OrderItemsEditor';
