-- Add PayStation-related columns to purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS paystation_invoice_number text,
ADD COLUMN IF NOT EXISTS paystation_trx_id text,
ADD COLUMN IF NOT EXISTS paystation_payment_url text;

-- Create index for invoice lookup
CREATE INDEX IF NOT EXISTS idx_purchases_paystation_invoice 
ON public.purchases(paystation_invoice_number) WHERE paystation_invoice_number IS NOT NULL;