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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          bidder_id: string
          created_at: string
          id: string
          property_id: string
          status: string
        }
        Insert: {
          amount: number
          bidder_id: string
          created_at?: string
          id?: string
          property_id: string
          status?: string
        }
        Update: {
          amount?: number
          bidder_id?: string
          created_at?: string
          id?: string
          property_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          bid_id: string | null
          buyer_id: string
          buyer_last_read_at: string
          created_at: string
          id: string
          inquiry_id: string | null
          property_id: string
          seller_id: string
          seller_last_read_at: string
        }
        Insert: {
          bid_id?: string | null
          buyer_id: string
          buyer_last_read_at?: string
          created_at?: string
          id?: string
          inquiry_id?: string | null
          property_id: string
          seller_id: string
          seller_last_read_at?: string
        }
        Update: {
          bid_id?: string | null
          buyer_id?: string
          buyer_last_read_at?: string
          created_at?: string
          id?: string
          inquiry_id?: string | null
          property_id?: string
          seller_id?: string
          seller_last_read_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          voivodeship: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          voivodeship?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          voivodeship?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          city_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          apt_no: string | null
          area_m2: number
          bid_count: number
          building_no: string | null
          city: string
          created_at: string
          current_price: number
          description: string
          ends_at: string
          floor: string | null
          heating_type: string | null
          id: string
          image_url: string | null
          images: string[]
          kind: Database["public"]["Enums"]["property_kind"]
          kw_number: string | null
          main_image_index: number
          market_type: Database["public"]["Enums"]["market_type"] | null
          monthly_rent_amount: number | null
          offer_type: string | null
          owner_id: string
          ownership_type: Database["public"]["Enums"]["ownership_type"] | null
          plot_type: Database["public"]["Enums"]["plot_type"] | null
          promoted: boolean
          property_type: Database["public"]["Enums"]["property_type"] | null
          sale_price: number | null
          starting_price: number
          status: Database["public"]["Enums"]["property_status"]
          street: string
          title: string
          winning_bid_id: string | null
        }
        Insert: {
          apt_no?: string | null
          area_m2: number
          bid_count?: number
          building_no?: string | null
          city: string
          created_at?: string
          current_price?: number
          description: string
          ends_at: string
          floor?: string | null
          heating_type?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          kind?: Database["public"]["Enums"]["property_kind"]
          kw_number?: string | null
          main_image_index?: number
          market_type?: Database["public"]["Enums"]["market_type"] | null
          monthly_rent_amount?: number | null
          offer_type?: string | null
          owner_id: string
          ownership_type?: Database["public"]["Enums"]["ownership_type"] | null
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          property_type?: Database["public"]["Enums"]["property_type"] | null
          sale_price?: number | null
          starting_price: number
          status?: Database["public"]["Enums"]["property_status"]
          street: string
          title: string
          winning_bid_id?: string | null
        }
        Update: {
          apt_no?: string | null
          area_m2?: number
          bid_count?: number
          building_no?: string | null
          city?: string
          created_at?: string
          current_price?: number
          description?: string
          ends_at?: string
          floor?: string | null
          heating_type?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          kind?: Database["public"]["Enums"]["property_kind"]
          kw_number?: string | null
          main_image_index?: number
          market_type?: Database["public"]["Enums"]["market_type"] | null
          monthly_rent_amount?: number | null
          offer_type?: string | null
          owner_id?: string
          ownership_type?: Database["public"]["Enums"]["ownership_type"] | null
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          property_type?: Database["public"]["Enums"]["property_type"] | null
          sale_price?: number | null
          starting_price?: number
          status?: Database["public"]["Enums"]["property_status"]
          street?: string
          title?: string
          winning_bid_id?: string | null
        }
        Relationships: []
      }
      rental_chats: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          landlord_last_read_at: string
          offer_id: string
          request_id: string
          tenant_id: string
          tenant_last_read_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          landlord_last_read_at?: string
          offer_id: string
          request_id: string
          tenant_id: string
          tenant_last_read_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          landlord_last_read_at?: string
          offer_id?: string
          request_id?: string
          tenant_id?: string
          tenant_last_read_at?: string
        }
        Relationships: []
      }
      rental_listings: {
        Row: {
          accepts_children: boolean
          accepts_pets: boolean
          apt_no: string | null
          area_m2: number
          city: string
          created_at: string
          description: string
          expires_at: string
          has_energy_cert: boolean
          id: string
          images: string[]
          insurance_payer: string | null
          kind: string
          kw_number: string | null
          landlord_id: string
          main_image_index: number
          min_lease_months: number | null
          monthly_price: number
          notarial_required: boolean
          plot_type: Database["public"]["Enums"]["plot_type"] | null
          promoted: boolean
          property_type: Database["public"]["Enums"]["property_type"] | null
          rent_base: number | null
          requires_deposit: boolean
          requires_insurance: boolean
          rooms: number
          status: string
          street: string
          title: string
          utilities_fee: number | null
          wants_energy_cert_discount: boolean
        }
        Insert: {
          accepts_children?: boolean
          accepts_pets?: boolean
          apt_no?: string | null
          area_m2: number
          city: string
          created_at?: string
          description?: string
          expires_at?: string
          has_energy_cert?: boolean
          id?: string
          images?: string[]
          insurance_payer?: string | null
          kind?: string
          kw_number?: string | null
          landlord_id: string
          main_image_index?: number
          min_lease_months?: number | null
          monthly_price: number
          notarial_required?: boolean
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          property_type?: Database["public"]["Enums"]["property_type"] | null
          rent_base?: number | null
          requires_deposit?: boolean
          requires_insurance?: boolean
          rooms?: number
          status?: string
          street: string
          title: string
          utilities_fee?: number | null
          wants_energy_cert_discount?: boolean
        }
        Update: {
          accepts_children?: boolean
          accepts_pets?: boolean
          apt_no?: string | null
          area_m2?: number
          city?: string
          created_at?: string
          description?: string
          expires_at?: string
          has_energy_cert?: boolean
          id?: string
          images?: string[]
          insurance_payer?: string | null
          kind?: string
          kw_number?: string | null
          landlord_id?: string
          main_image_index?: number
          min_lease_months?: number | null
          monthly_price?: number
          notarial_required?: boolean
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          property_type?: Database["public"]["Enums"]["property_type"] | null
          rent_base?: number | null
          requires_deposit?: boolean
          requires_insurance?: boolean
          rooms?: number
          status?: string
          street?: string
          title?: string
          utilities_fee?: number | null
          wants_energy_cert_discount?: boolean
        }
        Relationships: []
      }
      rental_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "rental_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_offers: {
        Row: {
          created_at: string
          description: string
          id: string
          landlord_id: string
          monthly_price: number
          property_address: string | null
          request_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          landlord_id: string
          monthly_price: number
          property_address?: string | null
          request_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          landlord_id?: string
          monthly_price?: number
          property_address?: string | null
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_requests: {
        Row: {
          accepts_deposit: boolean
          accepts_insurance: boolean
          accepts_notarial_lease: boolean
          accepts_tenant_report: boolean
          active_days: number
          adults_count: number
          area_description: string | null
          budget_max: number | null
          city: string
          created_at: string
          district: string | null
          expires_at: string
          has_children: boolean
          id: string
          notes: string | null
          pets_caged: boolean
          pets_other: boolean
          requires_furnished: boolean
          status: string
          tenant_id: string
        }
        Insert: {
          accepts_deposit?: boolean
          accepts_insurance?: boolean
          accepts_notarial_lease?: boolean
          accepts_tenant_report?: boolean
          active_days?: number
          adults_count?: number
          area_description?: string | null
          budget_max?: number | null
          city: string
          created_at?: string
          district?: string | null
          expires_at: string
          has_children?: boolean
          id?: string
          notes?: string | null
          pets_caged?: boolean
          pets_other?: boolean
          requires_furnished?: boolean
          status?: string
          tenant_id: string
        }
        Update: {
          accepts_deposit?: boolean
          accepts_insurance?: boolean
          accepts_notarial_lease?: boolean
          accepts_tenant_report?: boolean
          active_days?: number
          adults_count?: number
          area_description?: string | null
          budget_max?: number | null
          city?: string
          created_at?: string
          district?: string | null
          expires_at?: string
          has_children?: boolean
          id?: string
          notes?: string | null
          pets_caged?: boolean
          pets_other?: boolean
          requires_furnished?: boolean
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      sale_inquiries: {
        Row: {
          buyer_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          message: string
          property_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          message: string
          property_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          message?: string
          property_id?: string
          seller_id?: string
        }
        Relationships: []
      }
      streets: {
        Row: {
          city_id: string
          created_at: string
          district_id: string | null
          id: string
          name: string
        }
        Insert: {
          city_id: string
          created_at?: string
          district_id?: string | null
          id?: string
          name: string
        }
        Update: {
          city_id?: string
          created_at?: string
          district_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "streets_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streets_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: string
          granted: boolean
          granted_at: string
          id: string
          user_id: string
        }
        Insert: {
          consent_type: string
          granted?: boolean
          granted_at?: string
          id?: string
          user_id: string
        }
        Update: {
          consent_type?: string
          granted?: boolean
          granted_at?: string
          id?: string
          user_id?: string
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
      accept_bid: { Args: { _bid_id: string }; Returns: string }
      accept_rental_offer: { Args: { _offer_id: string }; Returns: string }
      extend_rental_listing: { Args: { _id: string }; Returns: string }
      get_user_stars: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_rental_chat_participant: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      kw_taken: { Args: { _kw: string }; Returns: boolean }
      reject_bid: { Args: { _bid_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "buyer" | "seller" | "admin"
      market_type: "primary" | "secondary"
      ownership_type:
        | "cooperative_with_kw"
        | "cooperative_no_kw"
        | "separate_property"
      plot_type: "rolna" | "budowlana" | "przemyslowa" | "inna"
      property_kind: "live_valuation" | "sale_listing"
      property_status: "active" | "ended" | "sold" | "cancelled"
      property_type: "mieszkanie" | "lokal_uslugowy" | "garaz" | "dzialka"
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
      app_role: ["buyer", "seller", "admin"],
      market_type: ["primary", "secondary"],
      ownership_type: [
        "cooperative_with_kw",
        "cooperative_no_kw",
        "separate_property",
      ],
      plot_type: ["rolna", "budowlana", "przemyslowa", "inna"],
      property_kind: ["live_valuation", "sale_listing"],
      property_status: ["active", "ended", "sold", "cancelled"],
      property_type: ["mieszkanie", "lokal_uslugowy", "garaz", "dzialka"],
    },
  },
} as const
