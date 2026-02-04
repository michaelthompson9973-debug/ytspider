export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_sources: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          click_timestamp: string | null
          conversation_id: string
          created_at: string
          id: string
          placement: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          click_timestamp?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          placement?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          click_timestamp?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          placement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_sources_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "messenger_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_data: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          keywords: string[] | null
          metadata: Json | null
          shop_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          metadata?: Json | null
          shop_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          metadata?: Json | null
          shop_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_training_data_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      allowed_domains: {
        Row: {
          created_at: string
          domain: string
          enabled: boolean
          id: string
          is_wildcard: boolean
          shop_id: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          enabled?: boolean
          id?: string
          is_wildcard?: boolean
          shop_id?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          enabled?: boolean
          id?: string
          is_wildcard?: boolean
          shop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowed_domains_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_name: string
          key_value: string
          last_used_at: string | null
          provider: string
          rate_limited_until: string | null
          shop_id: string | null
          status: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          key_name?: string
          key_value: string
          last_used_at?: string | null
          provider?: string
          rate_limited_until?: string | null
          shop_id?: string | null
          status?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          key_value?: string
          last_used_at?: string | null
          provider?: string
          rate_limited_until?: string | null
          shop_id?: string | null
          status?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_reply_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          response_content: string | null
          response_type: string
          shop_id: string | null
          trigger_conditions: Json
          trigger_type: string
          use_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          response_content?: string | null
          response_type: string
          shop_id?: string | null
          trigger_conditions?: Json
          trigger_type: string
          use_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          response_content?: string | null
          response_type?: string
          shop_id?: string | null
          trigger_conditions?: Json
          trigger_type?: string
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_reply_rules_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      component_library: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          html: string
          id: string
          name: string
          shop_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          html?: string
          id?: string
          name: string
          shop_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          html?: string
          id?: string
          name?: string
          shop_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_library_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_assignments: {
        Row: {
          agent_id: string
          assigned_at: string
          conversation_id: string
          id: string
          notes: string | null
          resolved_at: string | null
          sla_breach: boolean | null
        }
        Insert: {
          agent_id: string
          assigned_at?: string
          conversation_id: string
          id?: string
          notes?: string | null
          resolved_at?: string | null
          sla_breach?: boolean | null
        }
        Update: {
          agent_id?: string
          assigned_at?: string
          conversation_id?: string
          id?: string
          notes?: string | null
          resolved_at?: string | null
          sla_breach?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "messenger_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_assignments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "messenger_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          tag: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          tag: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "messenger_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          event_id: string
          event_name: string
          id: string
          order_id: string
          platform: string
          response_body: string | null
          response_status: number | null
          sent_at: string
        }
        Insert: {
          event_id: string
          event_name: string
          id?: string
          order_id: string
          platform: string
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
        }
        Update: {
          event_id?: string
          event_name?: string
          id?: string
          order_id?: string
          platform?: string
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_credentials: {
        Row: {
          access_token: string | null
          created_at: string
          credential_type: string
          credential_value: string
          id: string
          is_active: boolean
          label: string | null
          provider: string
          shop_id: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          credential_type: string
          credential_value: string
          id?: string
          is_active?: boolean
          label?: string | null
          provider: string
          shop_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          credential_type?: string
          credential_value?: string
          id?: string
          is_active?: boolean
          label?: string | null
          provider?: string
          shop_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_credentials_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_courier_history: {
        Row: {
          checked_at: string
          created_at: string
          id: string
          phone: string
          provider: string
          raw_data: Json | null
          success_rate: number | null
          total_cancelled: number | null
          total_delivered: number | null
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          checked_at?: string
          created_at?: string
          id?: string
          phone: string
          provider: string
          raw_data?: Json | null
          success_rate?: number | null
          total_cancelled?: number | null
          total_delivered?: number | null
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          id?: string
          phone?: string
          provider?: string
          raw_data?: Json | null
          success_rate?: number | null
          total_cancelled?: number | null
          total_delivered?: number | null
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_label_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          customer_id: string
          id: string
          label_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          customer_id: string
          id?: string
          label_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          customer_id?: string
          id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_label_assignments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "customer_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_labels: {
        Row: {
          auto_rule: Json | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          shop_id: string | null
        }
        Insert: {
          auto_rule?: Json | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          shop_id?: string | null
        }
        Update: {
          auto_rule?: Json | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          shop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_labels_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          address: string | null
          city: string | null
          connection_id: string | null
          created_at: string
          email: string | null
          first_contact_at: string | null
          id: string
          is_vip: boolean | null
          last_contact_at: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
          profile_pic: string | null
          psid: string
          risk_score: number | null
          shop_id: string | null
          source_ad_id: string | null
          source_campaign_id: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          connection_id?: string | null
          created_at?: string
          email?: string | null
          first_contact_at?: string | null
          id?: string
          is_vip?: boolean | null
          last_contact_at?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          profile_pic?: string | null
          psid: string
          risk_score?: number | null
          shop_id?: string | null
          source_ad_id?: string | null
          source_campaign_id?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          connection_id?: string | null
          created_at?: string
          email?: string | null
          first_contact_at?: string | null
          id?: string
          is_vip?: boolean | null
          last_contact_at?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          profile_pic?: string | null
          psid?: string
          risk_score?: number | null
          shop_id?: string | null
          source_ad_id?: string | null
          source_campaign_id?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "messenger_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_profiles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_checkout_settings: {
        Row: {
          created_at: string
          currency: string
          delivery_amount: number
          delivery_mode: Database["public"]["Enums"]["delivery_mode"]
          free_over_amount: number | null
          id: string
          inside_city_amount: number | null
          inside_city_label: string | null
          landing_page_id: string
          outside_city_amount: number | null
          outside_city_label: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          delivery_amount?: number
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          free_over_amount?: number | null
          id?: string
          inside_city_amount?: number | null
          inside_city_label?: string | null
          landing_page_id: string
          outside_city_amount?: number | null
          outside_city_label?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          delivery_amount?: number
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          free_over_amount?: number | null
          id?: string
          inside_city_amount?: number | null
          inside_city_label?: string | null
          landing_page_id?: string
          outside_city_amount?: number | null
          outside_city_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_checkout_settings_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: true
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_products: {
        Row: {
          created_at: string
          default_quantity: number
          id: string
          landing_page_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          default_quantity?: number
          id?: string
          landing_page_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          default_quantity?: number
          id?: string
          landing_page_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_products_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_sections: {
        Row: {
          config: Json | null
          created_at: string
          html: string
          id: string
          landing_page_id: string
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          html?: string
          id?: string
          landing_page_id: string
          name?: string
          sort_order?: number
          type?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          html?: string
          id?: string
          landing_page_id?: string
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_sections_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_theme: {
        Row: {
          config: Json
          created_at: string
          id: string
          landing_page_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          landing_page_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          landing_page_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_theme_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: true
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          created_at: string
          created_by: string | null
          gtm_id: string | null
          html_content: string
          id: string
          product_id: string | null
          published: boolean
          shop_id: string | null
          slug: string
          tracking_profile_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          gtm_id?: string | null
          html_content?: string
          id?: string
          product_id?: string | null
          published?: boolean
          shop_id?: string | null
          slug: string
          tracking_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          gtm_id?: string | null
          html_content?: string
          id?: string
          product_id?: string | null
          published?: boolean
          shop_id?: string | null
          slug?: string
          tracking_profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_tracking_profile_id_fkey"
            columns: ["tracking_profile_id"]
            isOneToOne: false
            referencedRelation: "tracking_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          folder: string | null
          id: string
          public_url: string | null
          shop_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          folder?: string | null
          id?: string
          public_url?: string | null
          shop_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          folder?: string | null
          id?: string
          public_url?: string | null
          shop_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      messenger_agents: {
        Row: {
          avatar: string | null
          avg_response_time: number | null
          created_at: string
          current_load: number | null
          id: string
          max_conversations: number | null
          name: string
          satisfaction_score: number | null
          shop_id: string | null
          status: string | null
          total_resolved: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          avg_response_time?: number | null
          created_at?: string
          current_load?: number | null
          id?: string
          max_conversations?: number | null
          name: string
          satisfaction_score?: number | null
          shop_id?: string | null
          status?: string | null
          total_resolved?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          avg_response_time?: number | null
          created_at?: string
          current_load?: number | null
          id?: string
          max_conversations?: number | null
          name?: string
          satisfaction_score?: number | null
          shop_id?: string | null
          status?: string | null
          total_resolved?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messenger_agents_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      messenger_connections: {
        Row: {
          app_id: string | null
          created_at: string
          id: string
          is_active: boolean
          page_access_token: string
          page_id: string
          page_name: string
          shop_id: string | null
          token_expires_at: string | null
          updated_at: string
          user_access_token: string | null
          webhook_verify_token: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          page_access_token: string
          page_id: string
          page_name: string
          shop_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_access_token?: string | null
          webhook_verify_token?: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          page_access_token?: string
          page_id?: string
          page_name?: string
          shop_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_access_token?: string | null
          webhook_verify_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "messenger_connections_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      messenger_conversations: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          last_message_at: string
          sender_name: string | null
          sender_profile_pic: string | null
          sender_psid: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          sender_name?: string | null
          sender_profile_pic?: string | null
          sender_psid: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          sender_name?: string | null
          sender_profile_pic?: string | null
          sender_psid?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messenger_conversations_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "messenger_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      messenger_messages: {
        Row: {
          attachments: Json | null
          connection_id: string
          conversation_id: string
          created_at: string
          id: string
          is_from_page: boolean
          message_id: string | null
          message_text: string | null
          read_at: string | null
          sender_name: string | null
          sender_psid: string
          timestamp: string
        }
        Insert: {
          attachments?: Json | null
          connection_id: string
          conversation_id: string
          created_at?: string
          id?: string
          is_from_page?: boolean
          message_id?: string | null
          message_text?: string | null
          read_at?: string | null
          sender_name?: string | null
          sender_psid: string
          timestamp?: string
        }
        Update: {
          attachments?: Json | null
          connection_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_from_page?: boolean
          message_id?: string | null
          message_text?: string | null
          read_at?: string | null
          sender_name?: string | null
          sender_psid?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "messenger_messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "messenger_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "messenger_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          consignment_id: string | null
          courier_provider: string | null
          courier_status: string | null
          courier_synced_at: string | null
          created_at: string
          currency: string | null
          customer_address: string
          customer_city: string
          customer_name: string
          customer_phone: string
          delivery_charge: number | null
          event_id: string | null
          id: string
          ip_address: string | null
          landing_page_id: string | null
          note: string | null
          product_id: string | null
          quantity: number
          shop_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number | null
          total: number | null
          tracking_code: string | null
          unit_price: number | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          consignment_id?: string | null
          courier_provider?: string | null
          courier_status?: string | null
          courier_synced_at?: string | null
          created_at?: string
          currency?: string | null
          customer_address: string
          customer_city: string
          customer_name: string
          customer_phone: string
          delivery_charge?: number | null
          event_id?: string | null
          id?: string
          ip_address?: string | null
          landing_page_id?: string | null
          note?: string | null
          product_id?: string | null
          quantity?: number
          shop_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total?: number | null
          tracking_code?: string | null
          unit_price?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          consignment_id?: string | null
          courier_provider?: string | null
          courier_status?: string | null
          courier_synced_at?: string | null
          created_at?: string
          currency?: string | null
          customer_address?: string
          customer_city?: string
          customer_name?: string
          customer_phone?: string
          delivery_charge?: number | null
          event_id?: string | null
          id?: string
          ip_address?: string | null
          landing_page_id?: string | null
          note?: string | null
          product_id?: string | null
          quantity?: number
          shop_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total?: number | null
          tracking_code?: string | null
          unit_price?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      pathao_locations: {
        Row: {
          area_id: number | null
          area_name: string | null
          city_id: number | null
          city_name: string | null
          created_at: string
          id: string
          zone_id: number | null
          zone_name: string | null
        }
        Insert: {
          area_id?: number | null
          area_name?: string | null
          city_id?: number | null
          city_name?: string | null
          created_at?: string
          id?: string
          zone_id?: number | null
          zone_name?: string | null
        }
        Update: {
          area_id?: number | null
          area_name?: string | null
          city_id?: number | null
          city_name?: string | null
          created_at?: string
          id?: string
          zone_id?: number | null
          zone_name?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          name: string
          price: number
          shop_id: string | null
          size_options: Json | null
          updated_at: string
          videos: string[] | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          name: string
          price?: number
          shop_id?: string | null
          size_options?: Json | null
          updated_at?: string
          videos?: string[] | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          name?: string
          price?: number
          shop_id?: string | null
          size_options?: Json | null
          updated_at?: string
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_replies: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          shop_id: string | null
          shortcut: string | null
          title: string
          use_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          shop_id?: string | null
          shortcut?: string | null
          title: string
          use_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          shop_id?: string | null
          shortcut?: string | null
          title?: string
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_replies_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string
          invited_by: string | null
          role: Database["public"]["Enums"]["shop_role"]
          shop_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["shop_role"]
          shop_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["shop_role"]
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          shop_id: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          shop_id?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          shop_id?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_settings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["shop_plan"]
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          plan?: Database["public"]["Enums"]["shop_plan"]
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan?: Database["public"]["Enums"]["shop_plan"]
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracking_event_logs: {
        Row: {
          event_id: string
          event_name: string
          id: string
          order_id: string | null
          platform: string
          profile_id: string | null
          request_payload: Json | null
          response_body: string | null
          response_status: number | null
          sent_at: string
        }
        Insert: {
          event_id: string
          event_name: string
          id?: string
          order_id?: string | null
          platform: string
          profile_id?: string | null
          request_payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
        }
        Update: {
          event_id?: string
          event_name?: string
          id?: string
          order_id?: string | null
          platform?: string
          profile_id?: string | null
          request_payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_event_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_event_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tracking_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_profiles: {
        Row: {
          created_at: string
          description: string | null
          facebook_access_token: string | null
          facebook_pixel_id: string | null
          facebook_test_event_code: string | null
          google_ga4_id: string | null
          google_ga4_secret: string | null
          google_gtm_id: string | null
          id: string
          is_active: boolean
          name: string
          shop_id: string | null
          tiktok_access_token: string | null
          tiktok_pixel_id: string | null
          tiktok_test_event_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          facebook_test_event_code?: string | null
          google_ga4_id?: string | null
          google_ga4_secret?: string | null
          google_gtm_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          shop_id?: string | null
          tiktok_access_token?: string | null
          tiktok_pixel_id?: string | null
          tiktok_test_event_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          facebook_test_event_code?: string | null
          google_ga4_id?: string | null
          google_ga4_secret?: string | null
          google_gtm_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          shop_id?: string | null
          tiktok_access_token?: string | null
          tiktok_pixel_id?: string | null
          tiktok_test_event_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_profiles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_shop_role: { Args: { _shop_id: string }; Returns: string }
      get_user_shops: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["shop_plan"]
          settings: Json
          slug: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "shops"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_shop_access: {
        Args: { _min_role?: string; _shop_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin"
      delivery_mode: "flat" | "conditional" | "free" | "zoned"
      order_status:
        | "new"
        | "confirmed"
        | "shipped"
        | "cancelled"
        | "pending"
        | "processing"
        | "delivered"
      shop_plan: "free" | "pro" | "enterprise"
      shop_role: "owner" | "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
      delivery_mode: ["flat", "conditional", "free", "zoned"],
      order_status: [
        "new",
        "confirmed",
        "shipped",
        "cancelled",
        "pending",
        "processing",
        "delivered",
      ],
      shop_plan: ["free", "pro", "enterprise"],
      shop_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
