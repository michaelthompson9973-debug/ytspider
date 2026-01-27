-- Add 'zoned' to delivery_mode enum
ALTER TYPE delivery_mode ADD VALUE IF NOT EXISTS 'zoned';

-- Add new columns for zone-based delivery
ALTER TABLE landing_page_checkout_settings
ADD COLUMN IF NOT EXISTS inside_city_label text DEFAULT 'ঢাকার মধ্যে',
ADD COLUMN IF NOT EXISTS inside_city_amount numeric DEFAULT 60,
ADD COLUMN IF NOT EXISTS outside_city_label text DEFAULT 'ঢাকার বাহিরে',
ADD COLUMN IF NOT EXISTS outside_city_amount numeric DEFAULT 120;