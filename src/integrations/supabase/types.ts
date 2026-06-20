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
      admin_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
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
      lease_history_entries: {
        Row: {
          address: string | null
          city: string | null
          contract_url: string | null
          created_at: string
          date_from: string
          date_to: string | null
          id: string
          notes: string | null
          prev_landlord_name: string | null
          prev_landlord_phone: string | null
          property_kind: string
          references_available: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contract_url?: string | null
          created_at?: string
          date_from: string
          date_to?: string | null
          id?: string
          notes?: string | null
          prev_landlord_name?: string | null
          prev_landlord_phone?: string | null
          property_kind: string
          references_available?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contract_url?: string | null
          created_at?: string
          date_from?: string
          date_to?: string | null
          id?: string
          notes?: string | null
          prev_landlord_name?: string | null
          prev_landlord_phone?: string | null
          property_kind?: string
          references_available?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lease_ratings: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          ratee_id: string
          rater_id: string
          review: string | null
          stars_communication: number
          stars_quality: number
          stars_reliability: number
          target: Database["public"]["Enums"]["rating_target"]
          transaction_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          ratee_id: string
          rater_id: string
          review?: string | null
          stars_communication: number
          stars_quality: number
          stars_reliability: number
          target: Database["public"]["Enums"]["rating_target"]
          transaction_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          ratee_id?: string
          rater_id?: string
          review?: string | null
          stars_communication?: number
          stars_quality?: number
          stars_reliability?: number
          target?: Database["public"]["Enums"]["rating_target"]
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_ratings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_ratings_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "lease_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_transactions: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          chat_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          landlord_id: string
          listing_id: string | null
          passport_serial_snapshot: string | null
          passport_shared_at: string | null
          request_id: string | null
          state: Database["public"]["Enums"]["lease_state"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          chat_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          landlord_id: string
          listing_id?: string | null
          passport_serial_snapshot?: string | null
          passport_shared_at?: string | null
          request_id?: string | null
          state?: Database["public"]["Enums"]["lease_state"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          chat_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          landlord_id?: string
          listing_id?: string | null
          passport_serial_snapshot?: string | null
          passport_shared_at?: string | null
          request_id?: string | null
          state?: Database["public"]["Enums"]["lease_state"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_transactions_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "rental_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
        ]
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
          accepts_notarial_lease: boolean
          account_type: string | null
          avatar_url: string | null
          bank_statement_urls: string[] | null
          concierge_subscription: boolean
          concierge_subscription_until: string | null
          created_at: string
          data_anonymized: boolean | null
          date_of_birth: string | null
          display_name: string
          document_country_code: string | null
          document_number_hash: string | null
          employer_name: string | null
          employment_contract_indefinite: boolean | null
          employment_contract_until: string | null
          employment_contract_url: string | null
          employment_contract_urls: string[] | null
          employment_type: string | null
          facebook_verified_self: boolean | null
          first_name: string | null
          has_completed_internal_staysafe_lease: boolean
          has_pesel: boolean
          has_tenant_insurance: boolean
          home_city: string | null
          id: string
          identity_combo_hash: string | null
          identity_doc_url: string | null
          identity_doc_urls: string[] | null
          identity_source: string | null
          identity_verification_status: string | null
          income_verification_status: string | null
          instagram_account_created_at: string | null
          instagram_username: string | null
          instagram_verified_self: boolean | null
          is_student: boolean | null
          last_name: string | null
          linkedin_url: string | null
          linkedin_verified_self: boolean | null
          monthly_income_net: number | null
          passport_admin_notes: string | null
          passport_application_status: string | null
          passport_application_submitted_at: string | null
          passport_city: string | null
          passport_contract_valid: boolean
          passport_expires_at: string | null
          passport_generated_at: string | null
          passport_generated_by: string | null
          passport_income_verified: boolean
          passport_issued_at: string | null
          passport_name_verified: boolean
          passport_pdf_url: string | null
          passport_score: number | null
          passport_serial: string | null
          passport_social_verified: boolean
          personal_bio_lang: string | null
          personal_bio_original: string | null
          personal_bio_pl: string | null
          pesel_hash: string | null
          preferred_language: string
          serial_num: number | null
          social_facebook_url: string | null
          trusted_tenant_score: number
          verified_employer: boolean
          verified_facebook: boolean
          verified_identity: boolean
          verified_income: boolean
          verified_instagram: boolean
          verified_linkedin: boolean
          verified_past_contract: boolean
          welcome_message_sent_at: string | null
          willing_tenant_insurance: boolean
        }
        Insert: {
          accepts_notarial_lease?: boolean
          account_type?: string | null
          avatar_url?: string | null
          bank_statement_urls?: string[] | null
          concierge_subscription?: boolean
          concierge_subscription_until?: string | null
          created_at?: string
          data_anonymized?: boolean | null
          date_of_birth?: string | null
          display_name: string
          document_country_code?: string | null
          document_number_hash?: string | null
          employer_name?: string | null
          employment_contract_indefinite?: boolean | null
          employment_contract_until?: string | null
          employment_contract_url?: string | null
          employment_contract_urls?: string[] | null
          employment_type?: string | null
          facebook_verified_self?: boolean | null
          first_name?: string | null
          has_completed_internal_staysafe_lease?: boolean
          has_pesel?: boolean
          has_tenant_insurance?: boolean
          home_city?: string | null
          id: string
          identity_combo_hash?: string | null
          identity_doc_url?: string | null
          identity_doc_urls?: string[] | null
          identity_source?: string | null
          identity_verification_status?: string | null
          income_verification_status?: string | null
          instagram_account_created_at?: string | null
          instagram_username?: string | null
          instagram_verified_self?: boolean | null
          is_student?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          linkedin_verified_self?: boolean | null
          monthly_income_net?: number | null
          passport_admin_notes?: string | null
          passport_application_status?: string | null
          passport_application_submitted_at?: string | null
          passport_city?: string | null
          passport_contract_valid?: boolean
          passport_expires_at?: string | null
          passport_generated_at?: string | null
          passport_generated_by?: string | null
          passport_income_verified?: boolean
          passport_issued_at?: string | null
          passport_name_verified?: boolean
          passport_pdf_url?: string | null
          passport_score?: number | null
          passport_serial?: string | null
          passport_social_verified?: boolean
          personal_bio_lang?: string | null
          personal_bio_original?: string | null
          personal_bio_pl?: string | null
          pesel_hash?: string | null
          preferred_language?: string
          serial_num?: number | null
          social_facebook_url?: string | null
          trusted_tenant_score?: number
          verified_employer?: boolean
          verified_facebook?: boolean
          verified_identity?: boolean
          verified_income?: boolean
          verified_instagram?: boolean
          verified_linkedin?: boolean
          verified_past_contract?: boolean
          welcome_message_sent_at?: string | null
          willing_tenant_insurance?: boolean
        }
        Update: {
          accepts_notarial_lease?: boolean
          account_type?: string | null
          avatar_url?: string | null
          bank_statement_urls?: string[] | null
          concierge_subscription?: boolean
          concierge_subscription_until?: string | null
          created_at?: string
          data_anonymized?: boolean | null
          date_of_birth?: string | null
          display_name?: string
          document_country_code?: string | null
          document_number_hash?: string | null
          employer_name?: string | null
          employment_contract_indefinite?: boolean | null
          employment_contract_until?: string | null
          employment_contract_url?: string | null
          employment_contract_urls?: string[] | null
          employment_type?: string | null
          facebook_verified_self?: boolean | null
          first_name?: string | null
          has_completed_internal_staysafe_lease?: boolean
          has_pesel?: boolean
          has_tenant_insurance?: boolean
          home_city?: string | null
          id?: string
          identity_combo_hash?: string | null
          identity_doc_url?: string | null
          identity_doc_urls?: string[] | null
          identity_source?: string | null
          identity_verification_status?: string | null
          income_verification_status?: string | null
          instagram_account_created_at?: string | null
          instagram_username?: string | null
          instagram_verified_self?: boolean | null
          is_student?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          linkedin_verified_self?: boolean | null
          monthly_income_net?: number | null
          passport_admin_notes?: string | null
          passport_application_status?: string | null
          passport_application_submitted_at?: string | null
          passport_city?: string | null
          passport_contract_valid?: boolean
          passport_expires_at?: string | null
          passport_generated_at?: string | null
          passport_generated_by?: string | null
          passport_income_verified?: boolean
          passport_issued_at?: string | null
          passport_name_verified?: boolean
          passport_pdf_url?: string | null
          passport_score?: number | null
          passport_serial?: string | null
          passport_social_verified?: boolean
          personal_bio_lang?: string | null
          personal_bio_original?: string | null
          personal_bio_pl?: string | null
          pesel_hash?: string | null
          preferred_language?: string
          serial_num?: number | null
          social_facebook_url?: string | null
          trusted_tenant_score?: number
          verified_employer?: boolean
          verified_facebook?: boolean
          verified_identity?: boolean
          verified_income?: boolean
          verified_instagram?: boolean
          verified_linkedin?: boolean
          verified_past_contract?: boolean
          welcome_message_sent_at?: string | null
          willing_tenant_insurance?: boolean
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
          district: string | null
          ends_at: string
          floor: string | null
          has_basement: boolean | null
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
          plot_area_m2: number | null
          plot_type: Database["public"]["Enums"]["plot_type"] | null
          promoted: boolean
          property_type: Database["public"]["Enums"]["property_type"] | null
          sale_price: number | null
          starting_price: number
          status: Database["public"]["Enums"]["property_status"]
          street: string
          title: string
          usable_area_m2: number | null
          views_count: number
          winning_bid_id: string | null
          year_built: number | null
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
          district?: string | null
          ends_at: string
          floor?: string | null
          has_basement?: boolean | null
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
          plot_area_m2?: number | null
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          property_type?: Database["public"]["Enums"]["property_type"] | null
          sale_price?: number | null
          starting_price: number
          status?: Database["public"]["Enums"]["property_status"]
          street: string
          title: string
          usable_area_m2?: number | null
          views_count?: number
          winning_bid_id?: string | null
          year_built?: number | null
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
          district?: string | null
          ends_at?: string
          floor?: string | null
          has_basement?: boolean | null
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
          plot_area_m2?: number | null
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          property_type?: Database["public"]["Enums"]["property_type"] | null
          sale_price?: number | null
          starting_price?: number
          status?: Database["public"]["Enums"]["property_status"]
          street?: string
          title?: string
          usable_area_m2?: number | null
          views_count?: number
          winning_bid_id?: string | null
          year_built?: number | null
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
      rental_inquiries: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          listing_id: string
          message: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          listing_id: string
          message: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          listing_id?: string
          message?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_listings: {
        Row: {
          accepts_children: boolean
          accepts_pets: boolean
          accepts_students: boolean | null
          active_days: number | null
          apartment_subtype: string | null
          apt_no: string | null
          area_m2: number
          building_type: string | null
          city: string
          created_at: string
          description: string
          district: string | null
          expires_at: string
          floor_number: string | null
          has_balcony: boolean
          has_basement: boolean | null
          has_elevator: boolean
          has_energy_cert: boolean
          id: string
          images: string[]
          insurance_payer: string | null
          is_furnished: boolean
          kind: string
          kw_number: string | null
          landlord_id: string
          main_image_index: number
          max_adults: number | null
          max_children: number | null
          min_lease_months: number | null
          monthly_price: number
          notarial_required: boolean
          pets_caged_allowed: boolean
          pets_other_allowed: boolean
          plot_area_m2: number | null
          plot_type: Database["public"]["Enums"]["plot_type"] | null
          promoted: boolean
          property_type: Database["public"]["Enums"]["property_type"] | null
          rent_base: number | null
          requires_deposit: boolean
          requires_insurance: boolean
          requires_passport: boolean
          rooms: number
          status: string
          street: string
          title: string
          usable_area_m2: number | null
          utilities_fee: number | null
          views_count: number
          wants_energy_cert_discount: boolean
          year_built: number | null
        }
        Insert: {
          accepts_children?: boolean
          accepts_pets?: boolean
          accepts_students?: boolean | null
          active_days?: number | null
          apartment_subtype?: string | null
          apt_no?: string | null
          area_m2: number
          building_type?: string | null
          city: string
          created_at?: string
          description?: string
          district?: string | null
          expires_at?: string
          floor_number?: string | null
          has_balcony?: boolean
          has_basement?: boolean | null
          has_elevator?: boolean
          has_energy_cert?: boolean
          id?: string
          images?: string[]
          insurance_payer?: string | null
          is_furnished?: boolean
          kind?: string
          kw_number?: string | null
          landlord_id: string
          main_image_index?: number
          max_adults?: number | null
          max_children?: number | null
          min_lease_months?: number | null
          monthly_price: number
          notarial_required?: boolean
          pets_caged_allowed?: boolean
          pets_other_allowed?: boolean
          plot_area_m2?: number | null
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          property_type?: Database["public"]["Enums"]["property_type"] | null
          rent_base?: number | null
          requires_deposit?: boolean
          requires_insurance?: boolean
          requires_passport?: boolean
          rooms?: number
          status?: string
          street: string
          title: string
          usable_area_m2?: number | null
          utilities_fee?: number | null
          views_count?: number
          wants_energy_cert_discount?: boolean
          year_built?: number | null
        }
        Update: {
          accepts_children?: boolean
          accepts_pets?: boolean
          accepts_students?: boolean | null
          active_days?: number | null
          apartment_subtype?: string | null
          apt_no?: string | null
          area_m2?: number
          building_type?: string | null
          city?: string
          created_at?: string
          description?: string
          district?: string | null
          expires_at?: string
          floor_number?: string | null
          has_balcony?: boolean
          has_basement?: boolean | null
          has_elevator?: boolean
          has_energy_cert?: boolean
          id?: string
          images?: string[]
          insurance_payer?: string | null
          is_furnished?: boolean
          kind?: string
          kw_number?: string | null
          landlord_id?: string
          main_image_index?: number
          max_adults?: number | null
          max_children?: number | null
          min_lease_months?: number | null
          monthly_price?: number
          notarial_required?: boolean
          pets_caged_allowed?: boolean
          pets_other_allowed?: boolean
          plot_area_m2?: number | null
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          property_type?: Database["public"]["Enums"]["property_type"] | null
          rent_base?: number | null
          requires_deposit?: boolean
          requires_insurance?: boolean
          requires_passport?: boolean
          rooms?: number
          status?: string
          street?: string
          title?: string
          usable_area_m2?: number | null
          utilities_fee?: number | null
          views_count?: number
          wants_energy_cert_discount?: boolean
          year_built?: number | null
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
          listing_id: string | null
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
          listing_id?: string | null
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
          listing_id?: string | null
          monthly_price?: number
          property_address?: string | null
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
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
          apartment_subtype: string | null
          area_description: string | null
          budget_max: number | null
          building_type: string | null
          children_count: number
          city: string
          created_at: string
          district: string | null
          expires_at: string
          floor_preference: string | null
          has_children: boolean
          id: string
          is_student: boolean | null
          min_lease_months: number | null
          min_rooms: number | null
          notes: string | null
          personal_bio_lang: string | null
          personal_bio_original: string | null
          personal_bio_pl: string | null
          pets_caged: boolean
          pets_other: boolean
          property_type: string | null
          requires_furnished: boolean
          search_lat: number | null
          search_lng: number | null
          search_mode: string
          search_radius_km: number | null
          search_street: string | null
          status: string
          tenant_id: string
          wants_balcony: boolean
          wants_basement: boolean
          wants_elevator: boolean
        }
        Insert: {
          accepts_deposit?: boolean
          accepts_insurance?: boolean
          accepts_notarial_lease?: boolean
          accepts_tenant_report?: boolean
          active_days?: number
          adults_count?: number
          apartment_subtype?: string | null
          area_description?: string | null
          budget_max?: number | null
          building_type?: string | null
          children_count?: number
          city: string
          created_at?: string
          district?: string | null
          expires_at: string
          floor_preference?: string | null
          has_children?: boolean
          id?: string
          is_student?: boolean | null
          min_lease_months?: number | null
          min_rooms?: number | null
          notes?: string | null
          personal_bio_lang?: string | null
          personal_bio_original?: string | null
          personal_bio_pl?: string | null
          pets_caged?: boolean
          pets_other?: boolean
          property_type?: string | null
          requires_furnished?: boolean
          search_lat?: number | null
          search_lng?: number | null
          search_mode?: string
          search_radius_km?: number | null
          search_street?: string | null
          status?: string
          tenant_id: string
          wants_balcony?: boolean
          wants_basement?: boolean
          wants_elevator?: boolean
        }
        Update: {
          accepts_deposit?: boolean
          accepts_insurance?: boolean
          accepts_notarial_lease?: boolean
          accepts_tenant_report?: boolean
          active_days?: number
          adults_count?: number
          apartment_subtype?: string | null
          area_description?: string | null
          budget_max?: number | null
          building_type?: string | null
          children_count?: number
          city?: string
          created_at?: string
          district?: string | null
          expires_at?: string
          floor_preference?: string | null
          has_children?: boolean
          id?: string
          is_student?: boolean | null
          min_lease_months?: number | null
          min_rooms?: number | null
          notes?: string | null
          personal_bio_lang?: string | null
          personal_bio_original?: string | null
          personal_bio_pl?: string | null
          pets_caged?: boolean
          pets_other?: boolean
          property_type?: string | null
          requires_furnished?: boolean
          search_lat?: number | null
          search_lng?: number | null
          search_mode?: string
          search_radius_km?: number | null
          search_street?: string | null
          status?: string
          tenant_id?: string
          wants_balcony?: boolean
          wants_basement?: boolean
          wants_elevator?: boolean
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
      accept_tenant: { Args: { _transaction_id: string }; Returns: undefined }
      admin_reset_passport_application: {
        Args: { _user_id: string }
        Returns: undefined
      }
      cleanup_old_listings: { Args: never; Returns: undefined }
      delete_my_account: { Args: never; Returns: undefined }
      express_interest: {
        Args: { _listing_id: string; _request_id?: string }
        Returns: string
      }
      extend_rental_listing: { Args: { _id: string }; Returns: string }
      gen_passport_serial: { Args: never; Returns: string }
      get_user_stars: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_property_views: { Args: { _id: string }; Returns: undefined }
      increment_rental_views: { Args: { _id: string }; Returns: undefined }
      is_chat_participant: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_rental_chat_participant: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      kw_taken: { Args: { _kw: string }; Returns: boolean }
      listing_rating_summary: {
        Args: { _listing_id: string }
        Returns: {
          avg_overall: number
          total: number
        }[]
      }
      lookup_passport: {
        Args: { _serial: string }
        Returns: {
          display_name: string
          is_expired: boolean
          passport_expires_at: string
          trusted_tenant_score: number
          verified_identity: boolean
          verified_income: boolean
          verified_linkedin: boolean
          verified_past_contract: boolean
        }[]
      }
      ratings_revealed: { Args: { _transaction_id: string }; Returns: boolean }
      reject_bid: { Args: { _bid_id: string }; Returns: undefined }
      resume_property_listing: {
        Args: { _days: number; _id: string }
        Returns: string
      }
      user_rating_summary: {
        Args: {
          _target: Database["public"]["Enums"]["rating_target"]
          _user_id: string
        }
        Returns: {
          avg_communication: number
          avg_overall: number
          avg_quality: number
          avg_reliability: number
          total: number
        }[]
      }
    }
    Enums: {
      app_role: "buyer" | "seller" | "admin" | "passport_verifier"
      lease_state:
        | "matched"
        | "interested_passport_shared"
        | "chatting"
        | "accepted"
        | "completed"
        | "cancelled"
      market_type: "primary" | "secondary"
      ownership_type:
        | "cooperative_with_kw"
        | "cooperative_no_kw"
        | "separate_property"
      plot_type: "rolna" | "budowlana" | "przemyslowa" | "inna"
      property_kind: "live_valuation" | "sale_listing"
      property_status: "active" | "ended" | "sold" | "cancelled"
      property_type:
        | "mieszkanie"
        | "lokal_uslugowy"
        | "garaz"
        | "dzialka"
        | "dom"
      rating_target: "tenant" | "landlord" | "property"
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
      app_role: ["buyer", "seller", "admin", "passport_verifier"],
      lease_state: [
        "matched",
        "interested_passport_shared",
        "chatting",
        "accepted",
        "completed",
        "cancelled",
      ],
      market_type: ["primary", "secondary"],
      ownership_type: [
        "cooperative_with_kw",
        "cooperative_no_kw",
        "separate_property",
      ],
      plot_type: ["rolna", "budowlana", "przemyslowa", "inna"],
      property_kind: ["live_valuation", "sale_listing"],
      property_status: ["active", "ended", "sold", "cancelled"],
      property_type: [
        "mieszkanie",
        "lokal_uslugowy",
        "garaz",
        "dzialka",
        "dom",
      ],
      rating_target: ["tenant", "landlord", "property"],
    },
  },
} as const
