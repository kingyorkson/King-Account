-- Run this if you already ran the original schema
-- It adds the new columns and table without recreating anything

ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS allow_king_device BOOLEAN DEFAULT false;
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS features TEXT;

CREATE TABLE IF NOT EXISTS public.king_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(id) ON DELETE SET NULL,
  device_name TEXT NOT NULL,
  device_identifier TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.king_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own king devices" ON public.king_devices;
CREATE POLICY "Users manage their own king devices"
  ON public.king_devices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
