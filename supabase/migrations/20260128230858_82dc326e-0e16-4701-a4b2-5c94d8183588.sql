-- Add unique constraint for phone + provider combination
ALTER TABLE public.customer_courier_history 
ADD CONSTRAINT customer_courier_history_phone_provider_unique 
UNIQUE (phone, provider);