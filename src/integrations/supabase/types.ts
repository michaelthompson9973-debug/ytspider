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
      allowed_domains: {
        Row: {
          created_at: string
          domain: string
          enabled: boolean
          id: string
          is_wildcard: boolean
        }
        Insert: {
          created_at?: string
          domain: string
          enabled?: boolean
          id?: string
          is_wildcard?: boolean
        }
        Update: {
          created_at?: string
          domain?: string
          enabled?: boolean
          id?: string
          is_wildcard?: boolean
        }
        Relationships: []
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
          status?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
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
          slug: string
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
          slug: string
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
          slug?: string
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
          uploaded_by?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
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
          product_id: string | null
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number | null
          total: number | null
          unit_price: number | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
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
          product_id?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total?: number | null
          unit_price?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
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
          product_id?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total?: number | null
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
        ]
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
          updated_at?: string
          videos?: string[] | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin"
      delivery_mode: "flat" | "conditional" | "free" | "zoned"
      order_status: "new" | "confirmed" | "shipped" | "cancelled"
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
      order_status: ["new", "confirmed", "shipped", "cancelled"],
    },
  },
} as const
