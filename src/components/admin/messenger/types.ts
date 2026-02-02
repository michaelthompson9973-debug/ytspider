// Messenger CRM Types

export interface MessengerConnection {
  id: string;
  page_id: string;
  page_name: string;
  page_access_token: string;
  is_active: boolean;
  webhook_verify_token: string;
  created_at: string;
  updated_at: string;
}

export interface MessengerConversation {
  id: string;
  connection_id: string;
  sender_psid: string;
  sender_name: string | null;
  sender_profile_pic: string | null;
  unread_count: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  connection?: MessengerConnection;
  customer?: CustomerProfile;
  tags?: ConversationTag[];
  assignment?: ConversationAssignment;
  ad_source?: AdSource;
  last_message?: MessengerMessage;
}

export interface MessengerMessage {
  id: string;
  connection_id: string;
  conversation_id: string;
  sender_psid: string;
  sender_name: string | null;
  message_text: string | null;
  message_id: string | null;
  is_from_page: boolean;
  attachments: MessageAttachment[] | null;
  read_at: string | null;
  timestamp: string;
  created_at: string;
}

export interface MessageAttachment {
  type: 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
  payload: {
    url?: string;
    coordinates?: { lat: number; long: number };
    sticker_id?: number;
  };
}

export interface CustomerProfile {
  id: string;
  psid: string;
  connection_id: string | null;
  name: string | null;
  profile_pic: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  total_orders: number;
  total_spent: number;
  first_contact_at: string | null;
  last_contact_at: string | null;
  source_ad_id: string | null;
  source_campaign_id: string | null;
  is_vip: boolean;
  risk_score: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined data
  labels?: CustomerLabel[];
}

export interface CustomerLabel {
  id: string;
  name: string;
  color: string;
  description: string | null;
  is_system: boolean;
  auto_rule: Record<string, unknown> | null;
  created_at: string;
}

export interface CustomerLabelAssignment {
  id: string;
  customer_id: string;
  label_id: string;
  assigned_by: string | null;
  assigned_at: string;
  label?: CustomerLabel;
}

export interface ConversationTag {
  id: string;
  conversation_id: string;
  tag: string;
  created_at: string;
}

export interface ConversationAssignment {
  id: string;
  conversation_id: string;
  agent_id: string;
  assigned_at: string;
  resolved_at: string | null;
  sla_breach: boolean;
  notes: string | null;
  agent?: MessengerAgent;
}

export interface MessengerAgent {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  status: 'online' | 'offline' | 'busy' | 'away';
  max_conversations: number;
  current_load: number;
  total_resolved: number;
  avg_response_time: number | null;
  satisfaction_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuickReply {
  id: string;
  title: string;
  content: string;
  shortcut: string | null;
  category: string;
  use_count: number;
  created_at: string;
}

export interface AdSource {
  id: string;
  conversation_id: string;
  ad_id: string | null;
  campaign_id: string | null;
  adset_id: string | null;
  ad_name: string | null;
  campaign_name: string | null;
  placement: string | null;
  click_timestamp: string | null;
  created_at: string;
}

export interface AITrainingData {
  id: string;
  category: 'product' | 'faq' | 'policy' | 'promo' | 'greeting';
  title: string;
  content: string;
  keywords: string[];
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutoReplyRule {
  id: string;
  name: string;
  trigger_type: 'keyword' | 'intent' | 'ad_source' | 'time' | 'first_message';
  trigger_conditions: Record<string, unknown>;
  response_type: 'text' | 'template' | 'ai' | 'quick_replies';
  response_content: string | null;
  priority: number;
  is_active: boolean;
  use_count: number;
  created_at: string;
}

// Filter types
export type ConversationFilter = 
  | 'all' 
  | 'unread' 
  | 'from_ads' 
  | 'vip' 
  | 'hot_lead' 
  | 'pending' 
  | 'complaint'
  | 'assigned_to_me';

// Control panel tabs
export type ControlPanelTab = 
  | 'customer' 
  | 'labels' 
  | 'orders' 
  | 'ads' 
  | 'ai' 
  | 'history';

// State types
export interface MessengerState {
  selectedConnectionId: string | null;
  selectedConversationId: string | null;
  filter: ConversationFilter;
  searchQuery: string;
  controlPanelTab: ControlPanelTab;
}
