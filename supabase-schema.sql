-- King Account - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Registered third-party applications
CREATE TABLE public.apps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  redirect_uri TEXT NOT NULL,
  logo_url TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User authorizations for apps
CREATE TABLE public.authorizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  scopes TEXT[] DEFAULT '{"identity"}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app_id)
);

-- Cloud storage for app data per user
CREATE TABLE public.app_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app_id)
);

-- User settings
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  profile_visible BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Apps: anyone can read (needed for authorize flow)
CREATE POLICY "Apps are readable by everyone"
  ON public.apps FOR SELECT
  USING (true);

-- Apps: authenticated users can create apps
CREATE POLICY "Users can create apps"
  ON public.apps FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Apps: creators can update their own apps
CREATE POLICY "Creators can update their own apps"
  ON public.apps FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Apps: creators can delete their own apps
CREATE POLICY "Creators can delete their own apps"
  ON public.apps FOR DELETE
  USING (auth.uid() = creator_id);

-- Authorizations: users can only read/insert their own
CREATE POLICY "Users manage their own authorizations"
  ON public.authorizations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- App data: users manage their own
CREATE POLICY "Users manage their own app data"
  ON public.app_data FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User settings: users manage their own
CREATE POLICY "Users manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

