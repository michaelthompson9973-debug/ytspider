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
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          customer_id: string | null
          delivered_at: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          provider_message_id: string | null
          read_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["recipient_status"]
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          provider_message_id?: string | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recipient_status"]
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          provider_message_id?: string | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recipient_status"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
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
          is_approved: boolean | null
          name: string
          shop_id: string | null
          source_shop_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          html?: string
          id?: string
          is_approved?: boolean | null
          name: string
          shop_id?: string | null
          source_shop_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          html?: string
          id?: string
          is_approved?: boolean | null
          name?: string
          shop_id?: string | null
          source_shop_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "component_library_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_library_source_shop_id_fkey"
            columns: ["source_shop_id"]
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
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_order_amount: number | null
          shop_id: string
          starts_at: string
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          shop_id: string
          starts_at?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          shop_id?: string
          starts_at?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
      digital_deliveries: {
        Row: {
          access_credentials: Json | null
          created_at: string
          delivery_type: Database["public"]["Enums"]["digital_delivery_type"]
          download_count: number
          download_token: string | null
          download_url: string | null
          email_sent_at: string | null
          email_status:
            | Database["public"]["Enums"]["email_delivery_status"]
            | null
          expires_at: string | null
          first_downloaded_at: string | null
          id: string
          last_downloaded_at: string | null
          license_key: string | null
          max_downloads: number | null
          order_id: string
          order_item_id: string | null
          product_id: string | null
        }
        Insert: {
          access_credentials?: Json | null
          created_at?: string
          delivery_type?: Database["public"]["Enums"]["digital_delivery_type"]
          download_count?: number
          download_token?: string | null
          download_url?: string | null
          email_sent_at?: string | null
          email_status?:
            | Database["public"]["Enums"]["email_delivery_status"]
            | null
          expires_at?: string | null
          first_downloaded_at?: string | null
          id?: string
          last_downloaded_at?: string | null
          license_key?: string | null
          max_downloads?: number | null
          order_id: string
          order_item_id?: string | null
          product_id?: string | null
        }
        Update: {
          access_credentials?: Json | null
          created_at?: string
          delivery_type?: Database["public"]["Enums"]["digital_delivery_type"]
          download_count?: number
          download_token?: string | null
          download_url?: string | null
          email_sent_at?: string | null
          email_status?:
            | Database["public"]["Enums"]["email_delivery_status"]
            | null
          expires_at?: string | null
          first_downloaded_at?: string | null
          id?: string
          last_downloaded_at?: string | null
          license_key?: string | null
          max_downloads?: number | null
          order_id?: string
          order_item_id?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_deliveries_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_deliveries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_meta: {
        Row: {
          access_instructions: string | null
          created_at: string
          delivery_type: Database["public"]["Enums"]["digital_delivery_type"]
          download_expires_days: number | null
          file_name: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          license_generator: Database["public"]["Enums"]["license_generator"]
          license_prefix: string | null
          max_downloads: number | null
          mime_type: string | null
          product_id: string
          updated_at: string
        }
        Insert: {
          access_instructions?: string | null
          created_at?: string
          delivery_type?: Database["public"]["Enums"]["digital_delivery_type"]
          download_expires_days?: number | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          license_generator?: Database["public"]["Enums"]["license_generator"]
          license_prefix?: string | null
          max_downloads?: number | null
          mime_type?: string | null
          product_id: string
          updated_at?: string
        }
        Update: {
          access_instructions?: string | null
          created_at?: string
          delivery_type?: Database["public"]["Enums"]["digital_delivery_type"]
          download_expires_days?: number | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          license_generator?: Database["public"]["Enums"]["license_generator"]
          license_prefix?: string | null
          max_downloads?: number | null
          mime_type?: string | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_meta_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
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
      marketing_campaigns: {
        Row: {
          channel: Database["public"]["Enums"]["campaign_channel"]
          clicked_count: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          delivered_count: number
          description: string | null
          failed_count: number
          id: string
          name: string
          read_count: number
          scheduled_at: string | null
          sent_count: number
          shop_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          subject: string | null
          target_count: number
          target_segment: Json | null
          template_content: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["campaign_channel"]
          clicked_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          description?: string | null
          failed_count?: number
          id?: string
          name: string
          read_count?: number
          scheduled_at?: string | null
          sent_count?: number
          shop_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string | null
          target_count?: number
          target_segment?: Json | null
          template_content?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["campaign_channel"]
          clicked_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          description?: string | null
          failed_count?: number
          id?: string
          name?: string
          read_count?: number
          scheduled_at?: string | null
          sent_count?: number
          shop_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string | null
          target_count?: number
          target_segment?: Json | null
          template_content?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
      order_returns: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          order_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          refund_amount: number | null
          refund_method: string | null
          requested_at: string
          shop_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          order_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          refund_amount?: number | null
          refund_method?: string | null
          requested_at?: string
          shop_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          order_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          refund_amount?: number | null
          refund_method?: string | null
          requested_at?: string
          shop_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_returns_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
          order_type: Database["public"]["Enums"]["order_type"]
          paid_at: string | null
          payment_gateway: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_transaction_id: string | null
          product_id: string | null
          quantity: number
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
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
          order_type?: Database["public"]["Enums"]["order_type"]
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_transaction_id?: string | null
          product_id?: string | null
          quantity?: number
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
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
          order_type?: Database["public"]["Enums"]["order_type"]
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_transaction_id?: string | null
          product_id?: string | null
          quantity?: number
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
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
      payment_gateways: {
        Row: {
          created_at: string
          credentials: Json
          display_name: string
          id: string
          is_active: boolean
          is_test_mode: boolean
          max_amount: number | null
          min_amount: number | null
          payout_schedule: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          shop_id: string
          supported_currencies: string[] | null
          supported_methods: string[] | null
          transaction_fee_fixed: number | null
          transaction_fee_percent: number | null
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string
          credentials?: Json
          display_name: string
          id?: string
          is_active?: boolean
          is_test_mode?: boolean
          max_amount?: number | null
          min_amount?: number | null
          payout_schedule?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          shop_id: string
          supported_currencies?: string[] | null
          supported_methods?: string[] | null
          transaction_fee_fixed?: number | null
          transaction_fee_percent?: number | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string
          credentials?: Json
          display_name?: string
          id?: string
          is_active?: boolean
          is_test_mode?: boolean
          max_amount?: number | null
          min_amount?: number | null
          payout_schedule?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          shop_id?: string
          supported_currencies?: string[] | null
          supported_methods?: string[] | null
          transaction_fee_fixed?: number | null
          transaction_fee_percent?: number | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateways_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          gateway_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          order_id: string | null
          provider_response: Json | null
          provider_transaction_id: string | null
          shop_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_agent: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          gateway_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          order_id?: string | null
          provider_response?: Json | null
          provider_transaction_id?: string | null
          shop_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_agent?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          gateway_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          order_id?: string | null
          provider_response?: Json | null
          provider_transaction_id?: string | null
          shop_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_order_shipping: {
        Row: {
          actual_delivery: string | null
          cod_amount: number | null
          cod_collected: boolean
          cod_collected_at: string | null
          consignment_id: string | null
          courier_provider: string | null
          courier_status: string | null
          courier_synced_at: string | null
          created_at: string
          delivery_attempts: number
          dimensions: Json | null
          estimated_delivery: string | null
          failure_reason: string | null
          id: string
          last_attempt_at: string | null
          order_id: string
          tracking_code: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          actual_delivery?: string | null
          cod_amount?: number | null
          cod_collected?: boolean
          cod_collected_at?: string | null
          consignment_id?: string | null
          courier_provider?: string | null
          courier_status?: string | null
          courier_synced_at?: string | null
          created_at?: string
          delivery_attempts?: number
          dimensions?: Json | null
          estimated_delivery?: string | null
          failure_reason?: string | null
          id?: string
          last_attempt_at?: string | null
          order_id: string
          tracking_code?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          actual_delivery?: string | null
          cod_amount?: number | null
          cod_collected?: boolean
          cod_collected_at?: string | null
          consignment_id?: string | null
          courier_provider?: string | null
          courier_status?: string | null
          courier_synced_at?: string | null
          created_at?: string
          delivery_attempts?: number
          dimensions?: Json | null
          estimated_delivery?: string | null
          failure_reason?: string | null
          id?: string
          last_attempt_at?: string | null
          order_id?: string
          tracking_code?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_order_shipping_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          announcement_active: boolean
          announcement_type: string | null
          config: Json | null
          created_at: string
          default_theme: Json | null
          global_announcement: string | null
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean
          updated_at: string
        }
        Insert: {
          announcement_active?: boolean
          announcement_type?: string | null
          config?: Json | null
          created_at?: string
          default_theme?: Json | null
          global_announcement?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          updated_at?: string
        }
        Update: {
          announcement_active?: boolean
          announcement_type?: string | null
          config?: Json | null
          created_at?: string
          default_theme?: Json | null
          global_announcement?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          description_en: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          is_contact_sales: boolean | null
          is_featured: boolean | null
          max_landing_pages: number
          max_orders_per_month: number | null
          max_products: number
          max_shops: number
          max_team_members: number
          name: string
          name_en: string
          price_monthly: number
          price_yearly: number | null
          slug: string
          sort_order: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          description_en?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_contact_sales?: boolean | null
          is_featured?: boolean | null
          max_landing_pages?: number
          max_orders_per_month?: number | null
          max_products?: number
          max_shops?: number
          max_team_members?: number
          name: string
          name_en: string
          price_monthly?: number
          price_yearly?: number | null
          slug: string
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          description_en?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_contact_sales?: boolean | null
          is_featured?: boolean | null
          max_landing_pages?: number
          max_orders_per_month?: number | null
          max_products?: number
          max_shops?: number
          max_team_members?: number
          name?: string
          name_en?: string
          price_monthly?: number
          price_yearly?: number | null
          slug?: string
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string | null
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
          low_stock_threshold: number | null
          name: string
          price: number
          product_type: Database["public"]["Enums"]["product_type"]
          shop_id: string | null
          size_options: Json | null
          stock: number | null
          track_stock: boolean | null
          updated_at: string
          videos: string[] | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          low_stock_threshold?: number | null
          name: string
          price?: number
          product_type?: Database["public"]["Enums"]["product_type"]
          shop_id?: string | null
          size_options?: Json | null
          stock?: number | null
          track_stock?: boolean | null
          updated_at?: string
          videos?: string[] | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          low_stock_threshold?: number | null
          name?: string
          price?: number
          product_type?: Database["public"]["Enums"]["product_type"]
          shop_id?: string | null
          size_options?: Json | null
          stock?: number | null
          track_stock?: boolean | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          email: string
          full_name: string | null
          id: string
          ip_address: string | null
          password_hash: string | null
          payment_intent_id: string | null
          payment_provider: string
          payment_session_id: string | null
          payment_status: string | null
          paystation_invoice_number: string | null
          paystation_payment_url: string | null
          paystation_trx_id: string | null
          phone: string | null
          plan_id: string
          plan_snapshot: Json
          shop_id: string | null
          shop_name: string
          shop_slug: string | null
          subscription_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          email: string
          full_name?: string | null
          id?: string
          ip_address?: string | null
          password_hash?: string | null
          payment_intent_id?: string | null
          payment_provider?: string
          payment_session_id?: string | null
          payment_status?: string | null
          paystation_invoice_number?: string | null
          paystation_payment_url?: string | null
          paystation_trx_id?: string | null
          phone?: string | null
          plan_id: string
          plan_snapshot: Json
          shop_id?: string | null
          shop_name: string
          shop_slug?: string | null
          subscription_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string
          full_name?: string | null
          id?: string
          ip_address?: string | null
          password_hash?: string | null
          payment_intent_id?: string | null
          payment_provider?: string
          payment_session_id?: string | null
          payment_status?: string | null
          paystation_invoice_number?: string | null
          paystation_payment_url?: string | null
          paystation_trx_id?: string | null
          phone?: string | null
          plan_id?: string
          plan_snapshot?: Json
          shop_id?: string | null
          shop_name?: string
          shop_slug?: string | null
          subscription_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
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
      shop_activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          shop_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          shop_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          shop_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_activity_log_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["shop_role"]
          shop_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["shop_role"]
          shop_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["shop_role"]
          shop_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_invitations_shop_id_fkey"
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
      shop_theme: {
        Row: {
          colors: Json
          created_at: string
          id: string
          mode: string
          preset: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          id?: string
          mode?: string
          preset?: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          colors?: Json
          created_at?: string
          id?: string
          mode?: string
          preset?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_theme_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          business_category: string | null
          created_at: string
          expires_at: string | null
          grace_period_ends_at: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          owner_id: string
          plan: Database["public"]["Enums"]["shop_plan"]
          settings: Json
          shop_type: Database["public"]["Enums"]["shop_type"]
          slug: string
          status: Database["public"]["Enums"]["shop_status"]
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          business_category?: string | null
          created_at?: string
          expires_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean
          owner_id: string
          plan?: Database["public"]["Enums"]["shop_plan"]
          settings?: Json
          shop_type?: Database["public"]["Enums"]["shop_type"]
          slug: string
          status?: Database["public"]["Enums"]["shop_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          business_category?: string | null
          created_at?: string
          expires_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          owner_id?: string
          plan?: Database["public"]["Enums"]["shop_plan"]
          settings?: Json
          shop_type?: Database["public"]["Enums"]["shop_type"]
          slug?: string
          status?: Database["public"]["Enums"]["shop_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_paid: number
          canceled_at: string | null
          created_at: string | null
          currency: string | null
          expires_at: string
          id: string
          payment_provider: string | null
          plan_id: string
          shop_id: string | null
          starts_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number
          canceled_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at: string
          id?: string
          payment_provider?: string | null
          plan_id: string
          shop_id?: string | null
          starts_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          canceled_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string
          id?: string
          payment_provider?: string | null
          plan_id?: string
          shop_id?: string | null
          starts_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
      whatsapp_connections: {
        Row: {
          access_token: string | null
          business_account_id: string | null
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          messaging_limit: string | null
          phone_number: string
          phone_number_id: string | null
          quality_rating: string | null
          shop_id: string | null
          updated_at: string
          webhook_verify_token: string
        }
        Insert: {
          access_token?: string | null
          business_account_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          messaging_limit?: string | null
          phone_number: string
          phone_number_id?: string | null
          quality_rating?: string | null
          shop_id?: string | null
          updated_at?: string
          webhook_verify_token?: string
        }
        Update: {
          access_token?: string | null
          business_account_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          messaging_limit?: string | null
          phone_number?: string
          phone_number_id?: string | null
          quality_rating?: string | null
          shop_id?: string | null
          updated_at?: string
          webhook_verify_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_plan_quota: {
        Args: { _resource_type: string; _shop_id: string }
        Returns: boolean
      }
      get_admin_shops_overview: {
        Args: {
          _limit?: number
          _offset?: number
          _search?: string
          _status_filter?: string
        }
        Returns: {
          created_at: string
          grace_period_ends_at: string
          id: string
          is_active: boolean
          landing_page_count: number
          logo_url: string
          name: string
          order_count: number
          owner_email: string
          owner_id: string
          owner_name: string
          plan: string
          product_count: number
          shop_type: string
          slug: string
          status: string
          team_member_count: number
          total_rows: number
        }[]
      }
      get_shop_quota_status: { Args: { _shop_id: string }; Returns: Json }
      get_user_shop_role: { Args: { _shop_id: string }; Returns: string }
      get_user_shops: {
        Args: never
        Returns: {
          business_category: string | null
          created_at: string
          expires_at: string | null
          grace_period_ends_at: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          owner_id: string
          plan: Database["public"]["Enums"]["shop_plan"]
          settings: Json
          shop_type: Database["public"]["Enums"]["shop_type"]
          slug: string
          status: Database["public"]["Enums"]["shop_status"]
          subscription_id: string | null
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
      is_shop_active: { Args: { _shop_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "super_admin" | "support"
      campaign_channel: "whatsapp" | "sms" | "email"
      campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "sent"
        | "paused"
        | "cancelled"
      delivery_mode: "flat" | "conditional" | "free" | "zoned"
      digital_delivery_type:
        | "download"
        | "email"
        | "license_key"
        | "access_link"
      email_delivery_status:
        | "pending"
        | "sent"
        | "delivered"
        | "failed"
        | "bounced"
      license_generator: "none" | "uuid" | "custom" | "external_api"
      order_status:
        | "new"
        | "confirmed"
        | "shipped"
        | "cancelled"
        | "pending"
        | "processing"
        | "delivered"
      order_type: "physical" | "digital" | "mixed"
      payment_provider:
        | "stripe"
        | "bkash"
        | "nagad"
        | "rocket"
        | "sslcommerz"
        | "paypal"
        | "manual"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      product_type: "physical" | "digital" | "bundle"
      recipient_status:
        | "pending"
        | "sent"
        | "delivered"
        | "read"
        | "clicked"
        | "failed"
        | "unsubscribed"
      shop_plan: "free" | "pro" | "enterprise"
      shop_role: "owner" | "admin" | "manager" | "editor" | "support" | "viewer"
      shop_status: "active" | "grace_period" | "suspended" | "cancelled"
      shop_type: "physical" | "digital"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      transaction_type: "charge" | "refund" | "partial_refund" | "chargeback"
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
      app_role: ["admin", "super_admin", "support"],
      campaign_channel: ["whatsapp", "sms", "email"],
      campaign_status: [
        "draft",
        "scheduled",
        "sending",
        "sent",
        "paused",
        "cancelled",
      ],
      delivery_mode: ["flat", "conditional", "free", "zoned"],
      digital_delivery_type: [
        "download",
        "email",
        "license_key",
        "access_link",
      ],
      email_delivery_status: [
        "pending",
        "sent",
        "delivered",
        "failed",
        "bounced",
      ],
      license_generator: ["none", "uuid", "custom", "external_api"],
      order_status: [
        "new",
        "confirmed",
        "shipped",
        "cancelled",
        "pending",
        "processing",
        "delivered",
      ],
      order_type: ["physical", "digital", "mixed"],
      payment_provider: [
        "stripe",
        "bkash",
        "nagad",
        "rocket",
        "sslcommerz",
        "paypal",
        "manual",
      ],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      product_type: ["physical", "digital", "bundle"],
      recipient_status: [
        "pending",
        "sent",
        "delivered",
        "read",
        "clicked",
        "failed",
        "unsubscribed",
      ],
      shop_plan: ["free", "pro", "enterprise"],
      shop_role: ["owner", "admin", "manager", "editor", "support", "viewer"],
      shop_status: ["active", "grace_period", "suspended", "cancelled"],
      shop_type: ["physical", "digital"],
      transaction_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      transaction_type: ["charge", "refund", "partial_refund", "chargeback"],
    },
  },
} as const
