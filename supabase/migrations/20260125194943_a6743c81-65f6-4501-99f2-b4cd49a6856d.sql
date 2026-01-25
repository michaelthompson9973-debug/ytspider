-- Add missing index for sent_at
CREATE INDEX IF NOT EXISTS idx_conversion_events_sent_at ON public.conversion_events(sent_at DESC);