-- ============================================
-- MESSENGER INTEGRATION TABLES
-- ============================================

-- Create messenger_connections table
CREATE TABLE public.messenger_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id text NOT NULL UNIQUE,
    page_name text NOT NULL,
    page_access_token text NOT NULL,
    user_access_token text,
    token_expires_at timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    app_id text,
    webhook_verify_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create messenger_conversations table
CREATE TABLE public.messenger_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id uuid NOT NULL REFERENCES public.messenger_connections(id) ON DELETE CASCADE,
    sender_psid text NOT NULL,
    sender_name text,
    sender_profile_pic text,
    last_message_at timestamptz NOT NULL DEFAULT now(),
    unread_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(connection_id, sender_psid)
);

-- Create messenger_messages table
CREATE TABLE public.messenger_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id uuid NOT NULL REFERENCES public.messenger_connections(id) ON DELETE CASCADE,
    conversation_id uuid NOT NULL REFERENCES public.messenger_conversations(id) ON DELETE CASCADE,
    sender_psid text NOT NULL,
    sender_name text,
    message_id text,
    message_text text,
    attachments jsonb,
    is_from_page boolean NOT NULL DEFAULT false,
    timestamp timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_messenger_connections_page_id ON public.messenger_connections(page_id);
CREATE INDEX idx_messenger_connections_is_active ON public.messenger_connections(is_active);

CREATE INDEX idx_messenger_conversations_connection_id ON public.messenger_conversations(connection_id);
CREATE INDEX idx_messenger_conversations_sender_psid ON public.messenger_conversations(sender_psid);
CREATE INDEX idx_messenger_conversations_last_message ON public.messenger_conversations(last_message_at DESC);

CREATE INDEX idx_messenger_messages_connection_id ON public.messenger_messages(connection_id);
CREATE INDEX idx_messenger_messages_conversation_id ON public.messenger_messages(conversation_id);
CREATE INDEX idx_messenger_messages_timestamp ON public.messenger_messages(timestamp DESC);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_messenger_connections_updated_at
    BEFORE UPDATE ON public.messenger_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messenger_conversations_updated_at
    BEFORE UPDATE ON public.messenger_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.messenger_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_messages ENABLE ROW LEVEL SECURITY;

-- messenger_connections policies
CREATE POLICY "Admins can manage messenger_connections"
    ON public.messenger_connections FOR ALL
    USING (public.is_admin());

-- messenger_conversations policies
CREATE POLICY "Admins can manage messenger_conversations"
    ON public.messenger_conversations FOR ALL
    USING (public.is_admin());

-- messenger_messages policies
CREATE POLICY "Admins can manage messenger_messages"
    ON public.messenger_messages FOR ALL
    USING (public.is_admin());

-- Allow service role to insert messages (for webhook)
CREATE POLICY "Service role can insert messenger_messages"
    ON public.messenger_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can insert messenger_conversations"
    ON public.messenger_conversations FOR INSERT
    WITH CHECK (true);

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messenger_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messenger_conversations;