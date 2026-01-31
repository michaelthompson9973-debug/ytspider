import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Package, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { currencyOptions } from '@/components/admin/landing-page-editor/types';

interface OrderDetails {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  subtotal: number | null;
  delivery_charge: number | null;
  total: number | null;
  currency: string | null;
  created_at: string;
  landing_page_id: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['thank-you-order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, customer_phone, customer_address, customer_city, subtotal, delivery_charge, total, currency, created_at, landing_page_id')
        .eq('id', orderId)
        .maybeSingle();
      if (error) throw error;
      return data as OrderDetails | null;
    },
    enabled: !!orderId,
  });

  const { data: orderItems } = useQuery({
    queryKey: ['thank-you-order-items', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select('id, product_name, quantity, unit_price, subtotal')
        .eq('order_id', orderId);
      if (error) throw error;
      return (data || []) as OrderItem[];
    },
    enabled: !!orderId,
  });

  const currencySymbol = currencyOptions.find(c => c.value === (order?.currency || 'BDT'))?.symbol || '৳';

  if (!orderId) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">অর্ডার খুঁজে পাওয়া যায়নি</h1>
          <p className="text-muted-foreground mb-4">একটি বৈধ অর্ডার আইডি প্রয়োজন।</p>
          <Link to="/" className="text-primary hover:underline">হোমে ফিরুন</Link>
        </div>
      </div>
    );
  }

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">অর্ডার লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">অর্ডার খুঁজে পাওয়া যায়নি</h1>
          <p className="text-muted-foreground mb-4">এই অর্ডার আইডিটি সঠিক নয়।</p>
          <Link to="/" className="text-primary hover:underline">হোমে ফিরুন</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8 px-4">
      <div className="container max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">ধন্যবাদ!</h1>
          <p className="text-muted-foreground text-lg">
            আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।
          </p>
          <p className="text-muted-foreground">
            শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব।
          </p>
        </div>

        {/* Order Card */}
        <div className="bg-background rounded-xl shadow-lg border overflow-hidden">
          {/* Order ID Banner */}
          <div className="bg-primary/10 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">অর্ডার আইডি</span>
              <span className="font-mono text-sm font-medium">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-6 border-b">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              গ্রাহক তথ্য
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium">{order.customer_name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {order.customer_phone}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{order.customer_address}, {order.customer_city}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          {orderItems && orderItems.length > 0 && (
            <div className="p-6 border-b">
              <h2 className="font-semibold text-lg mb-4">অর্ডার সামারি</h2>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {currencySymbol}{item.unit_price.toLocaleString('bn-BD')} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">
                      {currencySymbol}{item.subtotal.toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="p-6 bg-muted/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span>{currencySymbol}{(order.subtotal || 0).toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                <span className={order.delivery_charge === 0 ? 'text-green-600' : ''}>
                  {order.delivery_charge === 0 ? 'ফ্রি!' : `${currencySymbol}${(order.delivery_charge || 0).toLocaleString('bn-BD')}`}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>সর্বমোট</span>
                <span className="text-primary">{currencySymbol}{(order.total || 0).toLocaleString('bn-BD')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            হোমে ফিরুন
          </Link>
        </div>
      </div>
    </div>
  );
}
