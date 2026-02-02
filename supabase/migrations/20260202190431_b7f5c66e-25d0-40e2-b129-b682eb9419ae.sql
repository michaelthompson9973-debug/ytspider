-- ============================================
-- MESSENGER CRM SCHEMA - PHASE 1
-- Core tables for Messenger Inbox functionality
-- ============================================

-- 1. Customer Profiles (CRM Brain)
CREATE TABLE public.customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  psid text NOT NULL,
  connection_id uuid REFERENCES public.messenger_connections(id) ON DELETE CASCADE,
  name text,
  profile_pic text,
  phone text,
  email text,
  address text,
  city text,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  source_ad_id text,
  source_campaign_id text,
  is_vip boolean DEFAULT false,
  risk_score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(psid, connection_id)
);

-- 2. Customer Labels (Dynamic Tags)
CREATE TABLE public.customer_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text DEFAULT '#3B82F6',
  description text,
  is_system boolean DEFAULT false,
  auto_rule jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Customer Label Assignments (Junction Table)
CREATE TABLE public.customer_label_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.customer_labels(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, label_id)
);

-- 4. AI Training Data (Product Knowledge Base)
CREATE TABLE public.ai_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('product', 'faq', 'policy', 'promo', 'greeting')),
  title text NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Auto-Reply Rules (Rule Engine)
CREATE TABLE public.auto_reply_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('keyword', 'intent', 'ad_source', 'time', 'first_message')),
  trigger_conditions jsonb NOT NULL DEFAULT '{}',
  response_type text NOT NULL CHECK (response_type IN ('text', 'template', 'ai', 'quick_replies')),
  response_content text,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  use_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Messenger Agents
CREATE TABLE public.messenger_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  avatar text,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'away')),
  max_conversations integer DEFAULT 10,
  current_load integer DEFAULT 0,
  total_resolved integer DEFAULT 0,
  avg_response_time integer,
  satisfaction_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Conversation Assignments
CREATE TABLE public.conversation_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.messenger_conversations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.messenger_agents(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  sla_breach boolean DEFAULT false,
  notes text,
  UNIQUE(conversation_id, agent_id, assigned_at)
);

-- 8. Quick Replies / Saved Responses
CREATE TABLE public.quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  shortcut text,
  category text DEFAULT 'general',
  use_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Ad Source Tracking
CREATE TABLE public.ad_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.messenger_conversations(id) ON DELETE CASCADE,
  ad_id text,
  campaign_id text,
  adset_id text,
  ad_name text,
  campaign_name text,
  placement text,
  click_timestamp timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id)
);

-- 10. Conversation Tags
CREATE TABLE public.conversation_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.messenger_conversations(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_customer_profiles_psid ON public.customer_profiles(psid);
CREATE INDEX idx_customer_profiles_connection ON public.customer_profiles(connection_id);
CREATE INDEX idx_customer_profiles_vip ON public.customer_profiles(is_vip);
CREATE INDEX idx_customer_label_assignments_customer ON public.customer_label_assignments(customer_id);
CREATE INDEX idx_customer_label_assignments_label ON public.customer_label_assignments(label_id);
CREATE INDEX idx_ai_training_data_category ON public.ai_training_data(category);
CREATE INDEX idx_ai_training_data_active ON public.ai_training_data(is_active);
CREATE INDEX idx_auto_reply_rules_active ON public.auto_reply_rules(is_active);
CREATE INDEX idx_auto_reply_rules_priority ON public.auto_reply_rules(priority DESC);
CREATE INDEX idx_messenger_agents_status ON public.messenger_agents(status);
CREATE INDEX idx_messenger_agents_user ON public.messenger_agents(user_id);
CREATE INDEX idx_conversation_assignments_conversation ON public.conversation_assignments(conversation_id);
CREATE INDEX idx_conversation_assignments_agent ON public.conversation_assignments(agent_id);
CREATE INDEX idx_quick_replies_shortcut ON public.quick_replies(shortcut);
CREATE INDEX idx_ad_sources_conversation ON public.ad_sources(conversation_id);
CREATE INDEX idx_ad_sources_campaign ON public.ad_sources(campaign_id);
CREATE INDEX idx_conversation_tags_conversation ON public.conversation_tags(conversation_id);
CREATE INDEX idx_conversation_tags_tag ON public.conversation_tags(tag);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_training_data_updated_at
  BEFORE UPDATE ON public.ai_training_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messenger_agents_updated_at
  BEFORE UPDATE ON public.messenger_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reply_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

-- Customer Profiles Policies
CREATE POLICY "Admins can manage customer_profiles" ON public.customer_profiles
  FOR ALL USING (public.is_admin());

-- Customer Labels Policies
CREATE POLICY "Admins can manage customer_labels" ON public.customer_labels
  FOR ALL USING (public.is_admin());

-- Customer Label Assignments Policies
CREATE POLICY "Admins can manage customer_label_assignments" ON public.customer_label_assignments
  FOR ALL USING (public.is_admin());

-- AI Training Data Policies
CREATE POLICY "Admins can manage ai_training_data" ON public.ai_training_data
  FOR ALL USING (public.is_admin());

-- Auto-Reply Rules Policies
CREATE POLICY "Admins can manage auto_reply_rules" ON public.auto_reply_rules
  FOR ALL USING (public.is_admin());

-- Messenger Agents Policies
CREATE POLICY "Admins can manage messenger_agents" ON public.messenger_agents
  FOR ALL USING (public.is_admin());

-- Conversation Assignments Policies
CREATE POLICY "Admins can manage conversation_assignments" ON public.conversation_assignments
  FOR ALL USING (public.is_admin());

-- Quick Replies Policies
CREATE POLICY "Admins can manage quick_replies" ON public.quick_replies
  FOR ALL USING (public.is_admin());

-- Ad Sources Policies
CREATE POLICY "Admins can manage ad_sources" ON public.ad_sources
  FOR ALL USING (public.is_admin());

-- Conversation Tags Policies
CREATE POLICY "Admins can manage conversation_tags" ON public.conversation_tags
  FOR ALL USING (public.is_admin());

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_assignments;

-- ============================================
-- DEFAULT LABELS (Seed Data)
-- ============================================

INSERT INTO public.customer_labels (name, color, description, is_system) VALUES
  ('VIP', '#F59E0B', 'বিশ্বস্ত গ্রাহক - ৩+ অর্ডার', true),
  ('Hot Lead', '#EF4444', 'আগ্রহী - দ্রুত ফলো-আপ দরকার', true),
  ('From Ads', '#8B5CF6', 'বিজ্ঞাপন থেকে এসেছে', true),
  ('Returning', '#10B981', 'আগেও অর্ডার করেছে', true),
  ('Complaint', '#F97316', 'অভিযোগ আছে', true),
  ('COD Risk', '#DC2626', 'ক্যান্সেল রেট বেশি', true),
  ('New', '#3B82F6', 'নতুন গ্রাহক', true);

-- ============================================
-- DEFAULT QUICK REPLIES (Seed Data)
-- ============================================

INSERT INTO public.quick_replies (title, content, shortcut, category) VALUES
  ('Price Query', 'আমাদের প্রোডাক্টের দাম ৳[PRICE]। অর্ডার করতে আপনার নাম ও ঠিকানা দিন।', '/price', 'sales'),
  ('Delivery Info', 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি। ঢাকায় ১-২ দিন, ঢাকার বাইরে ২-৩ দিন।', '/delivery', 'info'),
  ('Order Confirm', 'অর্ডার কনফার্ম করতে নিচের তথ্য দিন:\n• নাম:\n• ফোন:\n• ঠিকানা:', '/order', 'sales'),
  ('Thanks', 'ধন্যবাদ! আপনার অর্ডার প্রসেস হচ্ছে। শীঘ্রই ডেলিভারি পাবেন। 🙏', '/thanks', 'closing'),
  ('Welcome', 'আসসালামু আলাইকুম! 🙏 আমাদের পেজে স্বাগতম। কিভাবে সাহায্য করতে পারি?', '/hi', 'greeting');