import { format } from 'date-fns';
import { Order, OrderItem } from './types';
import { formatCurrency, getShortOrderId } from './utils';

interface PrintOptions {
  order: Order;
  items: OrderItem[];
  shopName?: string;
  type: 'invoice' | 'label';
}

export function printInvoiceHTML({ order, items, shopName = 'Shop', type }: PrintOptions) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const isLabel = type === 'label';
  const orderId = getShortOrderId(order.id);
  const date = format(new Date(order.created_at), 'dd/MM/yyyy');

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${item.product_name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.unit_price, order.currency)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.subtotal, order.currency)}</td>
    </tr>
  `).join('');

  const invoiceHTML = `
    <!DOCTYPE html><html><head><title>${isLabel ? 'Shipping Label' : 'Invoice'} - ${orderId}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',Tahoma,sans-serif; padding:${isLabel ? '10mm' : '15mm'}; color:#222; font-size:12px; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; border-bottom:2px solid #222; padding-bottom:12px; }
      .shop-name { font-size:20px; font-weight:700; }
      .doc-type { font-size:14px; font-weight:600; text-transform:uppercase; color:#666; }
      .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
      .meta-box { background:#f8f8f8; padding:10px 12px; border-radius:4px; }
      .meta-label { font-size:10px; text-transform:uppercase; color:#999; margin-bottom:2px; }
      .meta-value { font-weight:600; }
      table { width:100%; border-collapse:collapse; margin-bottom:16px; }
      th { background:#f0f0f0; padding:8px; text-align:left; font-size:11px; text-transform:uppercase; color:#555; }
      .totals { text-align:right; margin-top:8px; }
      .totals .row { display:flex; justify-content:flex-end; gap:24px; padding:4px 0; }
      .totals .grand { font-size:16px; font-weight:700; border-top:2px solid #222; padding-top:8px; margin-top:4px; }
      .label-box { border:2px dashed #ccc; padding:16px; margin-top:20px; }
      .barcode { font-family:monospace; font-size:18px; letter-spacing:3px; text-align:center; margin:12px 0; }
      @media print { body { padding:10mm; } }
    </style></head><body>
    <div class="header">
      <div><div class="shop-name">${shopName}</div><div class="doc-type">${isLabel ? 'Shipping Label' : 'Invoice'}</div></div>
      <div style="text-align:right"><div style="font-size:14px;font-weight:600">#${orderId}</div><div style="color:#666">${date}</div></div>
    </div>
    <div class="meta-grid">
      <div class="meta-box"><div class="meta-label">Customer</div><div class="meta-value">${order.customer_name}</div><div>${order.customer_phone}</div></div>
      <div class="meta-box"><div class="meta-label">Address</div><div class="meta-value">${order.customer_address}</div><div>${order.customer_city}</div></div>
    </div>
    ${!isLabel ? `
    <table><thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${itemRows || `<tr><td colspan="4" style="padding:8px">${(order as any).products?.name || 'Product'} × ${order.quantity || 1}</td></tr>`}</tbody></table>
    <div class="totals">
      <div class="row"><span>Subtotal:</span><span>${formatCurrency(order.subtotal, order.currency)}</span></div>
      <div class="row"><span>Delivery:</span><span>${formatCurrency(order.delivery_charge, order.currency)}</span></div>
      <div class="row grand"><span>Total:</span><span>${formatCurrency(order.total, order.currency)}</span></div>
    </div>
    ` : `
    <div class="label-box">
      <div class="barcode">${order.id.slice(0, 12).toUpperCase()}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
        <div><strong>Recipient:</strong> ${order.customer_name}<br/>${order.customer_phone}</div>
        <div><strong>Address:</strong> ${order.customer_address}<br/>${order.customer_city}</div>
      </div>
      <div style="margin-top:12px;padding-top:8px;border-top:1px solid #ddd;display:flex;justify-content:space-between">
        <span><strong>COD:</strong> ${formatCurrency(order.total, order.currency)}</span>
        <span><strong>Weight:</strong> —</span>
      </div>
    </div>
    `}
    <script>window.onload=()=>{window.print();}</script>
    </body></html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
}
