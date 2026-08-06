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
      concierge_leads: {
        Row: {
          admin_notes: string | null
          assigned_at: string | null
          assignment_status: string
          client_type: string
          completed_at: string | null
          consent_accepted: boolean
          consent_timestamp: string | null
          contractor_id: string | null
          contractor_notes: string | null
          created_at: string
          email: string
          forwarded_at: string | null
          forwarded_by: string | null
          id: string
          phone: string
          service_key: string
          service_name: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_at?: string | null
          assignment_status?: string
          client_type?: string
          completed_at?: string | null
          consent_accepted?: boolean
          consent_timestamp?: string | null
          contractor_id?: string | null
          contractor_notes?: string | null
          created_at?: string
          email: string
          forwarded_at?: string | null
          forwarded_by?: string | null
          id?: string
          phone: string
          service_key: string
          service_name: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_at?: string | null
          assignment_status?: string
          client_type?: string
          completed_at?: string | null
          consent_accepted?: boolean
          consent_timestamp?: string | null
          contractor_id?: string | null
          contractor_notes?: string | null
          created_at?: string
          email?: string
          forwarded_at?: string | null
          forwarded_by?: string | null
          id?: string
          phone?: string
          service_key?: string
          service_name?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concierge_leads_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          active: boolean
          cities: string[]
          company_name: string
          created_at: string
          email: string | null
          id: string
          nationwide: boolean
          phone: string | null
          services: string[]
          sms_consent: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          cities?: string[]
          company_name: string
          created_at?: string
          email?: string | null
          id?: string
          nationwide?: boolean
          phone?: string | null
          services?: string[]
          sms_consent?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          cities?: string[]
          company_name?: string
          created_at?: string
          email?: string | null
          id?: string
          nationwide?: boolean
          phone?: string | null
          services?: string[]
          sms_consent?: boolean
          updated_at?: string
          user_id?: string
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
      lease_contract_drafts: {
        Row: {
          created_at: string
          data: Json
          landlord_signed_at: string | null
          last_edited_at: string
          last_editor_id: string | null
          tenant_signed_at: string | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          landlord_signed_at?: string | null
          last_edited_at?: string
          last_editor_id?: string | null
          tenant_signed_at?: string | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          landlord_signed_at?: string | null
          last_edited_at?: string
          last_editor_id?: string | null
          tenant_signed_at?: string | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_contract_drafts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "lease_transactions"
            referencedColumns: ["id"]
          },
        ]
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
          archived_at: string | null
          cancelled_at: string | null
          chat_id: string | null
          completed_at: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          extension_of_id: string | null
          id: string
          landlord_dates_confirmed_at: string | null
          landlord_finalized_at: string | null
          landlord_hidden_from_active_at: string | null
          landlord_id: string
          listing_id: string | null
          passport_serial_snapshot: string | null
          passport_shared_at: string | null
          payment_delay_reported_at: string | null
          pending_extension_end_date: string | null
          pending_extension_requested_at: string | null
          pending_extension_requested_by: string | null
          request_id: string | null
          state: Database["public"]["Enums"]["lease_state"]
          superseded_by_id: string | null
          system_notice_sent_at: string | null
          tenant_dates_confirmed_at: string | null
          tenant_finalized_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          archived_at?: string | null
          cancelled_at?: string | null
          chat_id?: string | null
          completed_at?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          extension_of_id?: string | null
          id?: string
          landlord_dates_confirmed_at?: string | null
          landlord_finalized_at?: string | null
          landlord_hidden_from_active_at?: string | null
          landlord_id: string
          listing_id?: string | null
          passport_serial_snapshot?: string | null
          passport_shared_at?: string | null
          payment_delay_reported_at?: string | null
          pending_extension_end_date?: string | null
          pending_extension_requested_at?: string | null
          pending_extension_requested_by?: string | null
          request_id?: string | null
          state?: Database["public"]["Enums"]["lease_state"]
          superseded_by_id?: string | null
          system_notice_sent_at?: string | null
          tenant_dates_confirmed_at?: string | null
          tenant_finalized_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          archived_at?: string | null
          cancelled_at?: string | null
          chat_id?: string | null
          completed_at?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          extension_of_id?: string | null
          id?: string
          landlord_dates_confirmed_at?: string | null
          landlord_finalized_at?: string | null
          landlord_hidden_from_active_at?: string | null
          landlord_id?: string
          listing_id?: string | null
          passport_serial_snapshot?: string | null
          passport_shared_at?: string | null
          payment_delay_reported_at?: string | null
          pending_extension_end_date?: string | null
          pending_extension_requested_at?: string | null
          pending_extension_requested_by?: string | null
          request_id?: string | null
          state?: Database["public"]["Enums"]["lease_state"]
          superseded_by_id?: string | null
          system_notice_sent_at?: string | null
          tenant_dates_confirmed_at?: string | null
          tenant_finalized_at?: string | null
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
            foreignKeyName: "lease_transactions_extension_of_id_fkey"
            columns: ["extension_of_id"]
            isOneToOne: false
            referencedRelation: "lease_transactions"
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
          {
            foreignKeyName: "lease_transactions_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "lease_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_reports: {
        Row: {
          acknowledged_at: string | null
          assigned_at: string | null
          category: string
          concierge_lead_id: string | null
          contractor_id: string | null
          created_at: string
          description: string
          id: string
          images: string[]
          landlord_id: string
          landlord_note: string | null
          listing_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string
          title: string
          transaction_id: string
          updated_at: string
          urgency: Database["public"]["Enums"]["maintenance_urgency"]
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_at?: string | null
          category: string
          concierge_lead_id?: string | null
          contractor_id?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[]
          landlord_id: string
          landlord_note?: string | null
          listing_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string
          title: string
          transaction_id: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["maintenance_urgency"]
        }
        Update: {
          acknowledged_at?: string | null
          assigned_at?: string | null
          category?: string
          concierge_lead_id?: string | null
          contractor_id?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          landlord_id?: string
          landlord_note?: string | null
          listing_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id?: string
          title?: string
          transaction_id?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["maintenance_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_reports_concierge_lead_id_fkey"
            columns: ["concierge_lead_id"]
            isOneToOne: false
            referencedRelation: "concierge_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reports_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reports_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "lease_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_settings: {
        Row: {
          enabled: boolean
          hard_enforce_budget: boolean
          hard_enforce_floor_exclusions: boolean
          hard_exclude_self: boolean
          hard_require_city: boolean
          hard_require_district: boolean
          hard_require_property_type: boolean
          id: boolean
          max_offers_per_request: number
          min_match_score: number
          soft_base_score: number
          soft_weight_balcony: number
          soft_weight_dishwasher: number
          soft_weight_elevator: number
          soft_weight_parking: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          hard_enforce_budget?: boolean
          hard_enforce_floor_exclusions?: boolean
          hard_exclude_self?: boolean
          hard_require_city?: boolean
          hard_require_district?: boolean
          hard_require_property_type?: boolean
          id?: boolean
          max_offers_per_request?: number
          min_match_score?: number
          soft_base_score?: number
          soft_weight_balcony?: number
          soft_weight_dishwasher?: number
          soft_weight_elevator?: number
          soft_weight_parking?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          hard_enforce_budget?: boolean
          hard_enforce_floor_exclusions?: boolean
          hard_exclude_self?: boolean
          hard_require_city?: boolean
          hard_require_district?: boolean
          hard_require_property_type?: boolean
          id?: boolean
          max_offers_per_request?: number
          min_match_score?: number
          soft_base_score?: number
          soft_weight_balcony?: number
          soft_weight_dishwasher?: number
          soft_weight_elevator?: number
          soft_weight_parking?: number
          updated_at?: string
          updated_by?: string | null
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
      payments: {
        Row: {
          amount: number
          checkout_url: string | null
          created_at: string
          currency: string
          description: string
          id: string
          kind: string
          metadata: Json
          mollie_payment_id: string | null
          paid_at: string | null
          status: string
          target_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          kind: string
          metadata?: Json
          mollie_payment_id?: string | null
          paid_at?: string | null
          status?: string
          target_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          kind?: string
          metadata?: Json
          mollie_payment_id?: string | null
          paid_at?: string | null
          status?: string
          target_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepts_notarial_lease: boolean
          accepts_one_month_deposit: boolean | null
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
          has_guarantor: boolean | null
          has_pesel: boolean
          has_tenant_insurance: boolean
          home_city: string | null
          id: string
          identity_change_allowed: boolean
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
          passport_count: number | null
          passport_expires_at: string | null
          passport_facebook_verified: boolean
          passport_generated_at: string | null
          passport_generated_by: string | null
          passport_income_verified: boolean
          passport_instagram_verified: boolean
          passport_issued_at: string | null
          passport_last_paid_at: string | null
          passport_linkedin_verified: boolean
          passport_name_verified: boolean
          passport_pdf_url: string | null
          passport_renewal_requested: boolean | null
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
          staysafe_completed_rentals_count: number | null
          student_status: string | null
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
          accepts_one_month_deposit?: boolean | null
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
          has_guarantor?: boolean | null
          has_pesel?: boolean
          has_tenant_insurance?: boolean
          home_city?: string | null
          id: string
          identity_change_allowed?: boolean
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
          passport_count?: number | null
          passport_expires_at?: string | null
          passport_facebook_verified?: boolean
          passport_generated_at?: string | null
          passport_generated_by?: string | null
          passport_income_verified?: boolean
          passport_instagram_verified?: boolean
          passport_issued_at?: string | null
          passport_last_paid_at?: string | null
          passport_linkedin_verified?: boolean
          passport_name_verified?: boolean
          passport_pdf_url?: string | null
          passport_renewal_requested?: boolean | null
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
          staysafe_completed_rentals_count?: number | null
          student_status?: string | null
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
          accepts_one_month_deposit?: boolean | null
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
          has_guarantor?: boolean | null
          has_pesel?: boolean
          has_tenant_insurance?: boolean
          home_city?: string | null
          id?: string
          identity_change_allowed?: boolean
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
          passport_count?: number | null
          passport_expires_at?: string | null
          passport_facebook_verified?: boolean
          passport_generated_at?: string | null
          passport_generated_by?: string | null
          passport_income_verified?: boolean
          passport_instagram_verified?: boolean
          passport_issued_at?: string | null
          passport_last_paid_at?: string | null
          passport_linkedin_verified?: boolean
          passport_name_verified?: boolean
          passport_pdf_url?: string | null
          passport_renewal_requested?: boolean | null
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
          staysafe_completed_rentals_count?: number | null
          student_status?: string | null
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
      property_manager_state: {
        Row: {
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rental_chats: {
        Row: {
          created_at: string
          id: string
          landlord_accepted_at: string | null
          landlord_id: string
          landlord_last_read_at: string
          landlord_party_accepted_at: string | null
          offer_id: string
          request_id: string
          tenant_accepted_at: string | null
          tenant_id: string
          tenant_last_read_at: string
          tenant_party_accepted_at: string | null
          tenant_passport_sent_at: string | null
          withdrawn_at: string | null
          withdrawn_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_accepted_at?: string | null
          landlord_id: string
          landlord_last_read_at?: string
          landlord_party_accepted_at?: string | null
          offer_id: string
          request_id: string
          tenant_accepted_at?: string | null
          tenant_id: string
          tenant_last_read_at?: string
          tenant_party_accepted_at?: string | null
          tenant_passport_sent_at?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          landlord_accepted_at?: string | null
          landlord_id?: string
          landlord_last_read_at?: string
          landlord_party_accepted_at?: string | null
          offer_id?: string
          request_id?: string
          tenant_accepted_at?: string | null
          tenant_id?: string
          tenant_last_read_at?: string
          tenant_party_accepted_at?: string | null
          tenant_passport_sent_at?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
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
          admin_fee: number
          allows_furniture_additions: boolean
          allows_modifications: boolean
          apartment_subtype: string | null
          apt_no: string | null
          area_m2: number
          building_type: string | null
          city: string
          created_at: string
          description: string
          district: string | null
          expires_at: string
          extra_features: Json
          floor_number: string | null
          geo_lat: number | null
          geo_lng: number | null
          has_balcony: boolean
          has_basement: boolean | null
          has_dishwasher: boolean
          has_elevator: boolean
          has_energy_cert: boolean
          has_parking_space: boolean
          has_washing_machine: boolean
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
          owner_lives_in: boolean
          pets_caged_allowed: boolean
          pets_other_allowed: boolean
          plot_area_m2: number | null
          plot_type: Database["public"]["Enums"]["plot_type"] | null
          promoted: boolean
          promoted_until: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          rent_base: number | null
          requires_deposit: boolean
          requires_insurance: boolean
          requires_passport: boolean
          room_label: string | null
          room_lock: string | null
          rooms: number
          separate_wc: boolean
          shared_balcony: boolean
          shared_basement: boolean
          shared_garden: boolean
          shared_kitchen: boolean
          shared_living_room: boolean
          status: string
          street: string
          title: string
          usable_area_m2: number | null
          utilities_advance: number
          utilities_by_usage: boolean
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
          admin_fee?: number
          allows_furniture_additions?: boolean
          allows_modifications?: boolean
          apartment_subtype?: string | null
          apt_no?: string | null
          area_m2: number
          building_type?: string | null
          city: string
          created_at?: string
          description?: string
          district?: string | null
          expires_at?: string
          extra_features?: Json
          floor_number?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          has_balcony?: boolean
          has_basement?: boolean | null
          has_dishwasher?: boolean
          has_elevator?: boolean
          has_energy_cert?: boolean
          has_parking_space?: boolean
          has_washing_machine?: boolean
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
          owner_lives_in?: boolean
          pets_caged_allowed?: boolean
          pets_other_allowed?: boolean
          plot_area_m2?: number | null
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          promoted_until?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          rent_base?: number | null
          requires_deposit?: boolean
          requires_insurance?: boolean
          requires_passport?: boolean
          room_label?: string | null
          room_lock?: string | null
          rooms?: number
          separate_wc?: boolean
          shared_balcony?: boolean
          shared_basement?: boolean
          shared_garden?: boolean
          shared_kitchen?: boolean
          shared_living_room?: boolean
          status?: string
          street: string
          title: string
          usable_area_m2?: number | null
          utilities_advance?: number
          utilities_by_usage?: boolean
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
          admin_fee?: number
          allows_furniture_additions?: boolean
          allows_modifications?: boolean
          apartment_subtype?: string | null
          apt_no?: string | null
          area_m2?: number
          building_type?: string | null
          city?: string
          created_at?: string
          description?: string
          district?: string | null
          expires_at?: string
          extra_features?: Json
          floor_number?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          has_balcony?: boolean
          has_basement?: boolean | null
          has_dishwasher?: boolean
          has_elevator?: boolean
          has_energy_cert?: boolean
          has_parking_space?: boolean
          has_washing_machine?: boolean
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
          owner_lives_in?: boolean
          pets_caged_allowed?: boolean
          pets_other_allowed?: boolean
          plot_area_m2?: number | null
          plot_type?: Database["public"]["Enums"]["plot_type"] | null
          promoted?: boolean
          promoted_until?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          rent_base?: number | null
          requires_deposit?: boolean
          requires_insurance?: boolean
          requires_passport?: boolean
          room_label?: string | null
          room_lock?: string | null
          rooms?: number
          separate_wc?: boolean
          shared_balcony?: boolean
          shared_basement?: boolean
          shared_garden?: boolean
          shared_kitchen?: boolean
          shared_living_room?: boolean
          status?: string
          street?: string
          title?: string
          usable_area_m2?: number | null
          utilities_advance?: number
          utilities_by_usage?: boolean
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
          is_system: boolean
          metadata: Json | null
          sender_id: string | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          is_system?: boolean
          metadata?: Json | null
          sender_id?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          is_system?: boolean
          metadata?: Json | null
          sender_id?: string | null
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
          match_score: number
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
          match_score?: number
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
          match_score?: number
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
          accepts_live_in_owner: boolean | null
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
          last_sms_sent_at: string | null
          min_lease_months: number | null
          min_rooms: number | null
          notes: string | null
          offers_staysafe_passport: boolean
          personal_bio_lang: string | null
          personal_bio_original: string | null
          personal_bio_pl: string | null
          pets_caged: boolean
          pets_other: boolean
          property_type: string | null
          requires_furnished: boolean
          room_lock: string | null
          search_lat: number | null
          search_lng: number | null
          search_mode: string
          search_radius_km: number | null
          search_street: string | null
          shared_balcony: boolean
          shared_basement: boolean
          shared_garden: boolean
          shared_kitchen: boolean
          shared_living_room: boolean
          sms_consent: boolean
          sms_notifications: boolean
          sms_paid_at: string | null
          sms_phone: string | null
          status: string
          tenant_id: string
          wants_balcony: boolean
          wants_basement: boolean
          wants_dishwasher: boolean
          wants_elevator: boolean
          wants_minor_modifications: boolean
          wants_own_furniture: boolean
          wants_parking_space: boolean
          wants_separate_wc: boolean
          wants_washing_machine: boolean
        }
        Insert: {
          accepts_deposit?: boolean
          accepts_insurance?: boolean
          accepts_live_in_owner?: boolean | null
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
          last_sms_sent_at?: string | null
          min_lease_months?: number | null
          min_rooms?: number | null
          notes?: string | null
          offers_staysafe_passport?: boolean
          personal_bio_lang?: string | null
          personal_bio_original?: string | null
          personal_bio_pl?: string | null
          pets_caged?: boolean
          pets_other?: boolean
          property_type?: string | null
          requires_furnished?: boolean
          room_lock?: string | null
          search_lat?: number | null
          search_lng?: number | null
          search_mode?: string
          search_radius_km?: number | null
          search_street?: string | null
          shared_balcony?: boolean
          shared_basement?: boolean
          shared_garden?: boolean
          shared_kitchen?: boolean
          shared_living_room?: boolean
          sms_consent?: boolean
          sms_notifications?: boolean
          sms_paid_at?: string | null
          sms_phone?: string | null
          status?: string
          tenant_id: string
          wants_balcony?: boolean
          wants_basement?: boolean
          wants_dishwasher?: boolean
          wants_elevator?: boolean
          wants_minor_modifications?: boolean
          wants_own_furniture?: boolean
          wants_parking_space?: boolean
          wants_separate_wc?: boolean
          wants_washing_machine?: boolean
        }
        Update: {
          accepts_deposit?: boolean
          accepts_insurance?: boolean
          accepts_live_in_owner?: boolean | null
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
          last_sms_sent_at?: string | null
          min_lease_months?: number | null
          min_rooms?: number | null
          notes?: string | null
          offers_staysafe_passport?: boolean
          personal_bio_lang?: string | null
          personal_bio_original?: string | null
          personal_bio_pl?: string | null
          pets_caged?: boolean
          pets_other?: boolean
          property_type?: string | null
          requires_furnished?: boolean
          room_lock?: string | null
          search_lat?: number | null
          search_lng?: number | null
          search_mode?: string
          search_radius_km?: number | null
          search_street?: string | null
          shared_balcony?: boolean
          shared_basement?: boolean
          shared_garden?: boolean
          shared_kitchen?: boolean
          shared_living_room?: boolean
          sms_consent?: boolean
          sms_notifications?: boolean
          sms_paid_at?: string | null
          sms_phone?: string | null
          status?: string
          tenant_id?: string
          wants_balcony?: boolean
          wants_basement?: boolean
          wants_dishwasher?: boolean
          wants_elevator?: boolean
          wants_minor_modifications?: boolean
          wants_own_furniture?: boolean
          wants_parking_space?: boolean
          wants_separate_wc?: boolean
          wants_washing_machine?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_note: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          consent_status: boolean
          contract_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          feedback: string | null
          id: string
          kind: Database["public"]["Enums"]["review_kind"]
          landlord_communication: number | null
          landlord_fairness: number | null
          landlord_problem_solving: number | null
          listing_id: string | null
          property_accuracy: number | null
          property_cleanliness: number | null
          property_location: number | null
          property_neighbors: number | null
          property_technical_condition: number | null
          reviewee_id: string
          reviewer_id: string
          status: Database["public"]["Enums"]["review_status"]
          tags: string[]
          tenant_cleanliness: number | null
          tenant_communication: number | null
          tenant_neighbors: number | null
          tenant_payments: number | null
          updated_at: string
        }
        Insert: {
          consent_status?: boolean
          contract_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          feedback?: string | null
          id?: string
          kind: Database["public"]["Enums"]["review_kind"]
          landlord_communication?: number | null
          landlord_fairness?: number | null
          landlord_problem_solving?: number | null
          listing_id?: string | null
          property_accuracy?: number | null
          property_cleanliness?: number | null
          property_location?: number | null
          property_neighbors?: number | null
          property_technical_condition?: number | null
          reviewee_id: string
          reviewer_id: string
          status?: Database["public"]["Enums"]["review_status"]
          tags?: string[]
          tenant_cleanliness?: number | null
          tenant_communication?: number | null
          tenant_neighbors?: number | null
          tenant_payments?: number | null
          updated_at?: string
        }
        Update: {
          consent_status?: boolean
          contract_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          feedback?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["review_kind"]
          landlord_communication?: number | null
          landlord_fairness?: number | null
          landlord_problem_solving?: number | null
          listing_id?: string | null
          property_accuracy?: number | null
          property_cleanliness?: number | null
          property_location?: number | null
          property_neighbors?: number | null
          property_technical_condition?: number | null
          reviewee_id?: string
          reviewer_id?: string
          status?: Database["public"]["Enums"]["review_status"]
          tags?: string[]
          tenant_cleanliness?: number | null
          tenant_communication?: number | null
          tenant_neighbors?: number | null
          tenant_payments?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "lease_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
        ]
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
      sms_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          kind: string
          message: string
          phone: string
          status: string
          target_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          message: string
          phone: string
          status?: string
          target_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          message?: string
          phone?: string
          status?: string
          target_id?: string | null
          user_id?: string | null
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
      trust_score_weights: {
        Row: {
          cap_no_staysafe: number
          deposit: number
          external_history_first: number
          external_history_next: number
          external_history_reference: number
          external_history_scan: number
          facebook: number
          finance_cap: number
          global_cap: number
          guarantor: number
          history_cap: number
          id: string
          identity: number
          income_high: number
          income_low: number
          income_mid: number
          instagram: number
          linkedin: number
          occasional_lease: number
          singleton: boolean
          social_cap: number
          staysafe_cap: number
          staysafe_first_rental: number
          staysafe_second_rental: number
          student: number
          tenant_insurance: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cap_no_staysafe?: number
          deposit?: number
          external_history_first?: number
          external_history_next?: number
          external_history_reference?: number
          external_history_scan?: number
          facebook?: number
          finance_cap?: number
          global_cap?: number
          guarantor?: number
          history_cap?: number
          id?: string
          identity?: number
          income_high?: number
          income_low?: number
          income_mid?: number
          instagram?: number
          linkedin?: number
          occasional_lease?: number
          singleton?: boolean
          social_cap?: number
          staysafe_cap?: number
          staysafe_first_rental?: number
          staysafe_second_rental?: number
          student?: number
          tenant_insurance?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cap_no_staysafe?: number
          deposit?: number
          external_history_first?: number
          external_history_next?: number
          external_history_reference?: number
          external_history_scan?: number
          facebook?: number
          finance_cap?: number
          global_cap?: number
          guarantor?: number
          history_cap?: number
          id?: string
          identity?: number
          income_high?: number
          income_low?: number
          income_mid?: number
          instagram?: number
          linkedin?: number
          occasional_lease?: number
          singleton?: boolean
          social_cap?: number
          staysafe_cap?: number
          staysafe_first_rental?: number
          staysafe_second_rental?: number
          student?: number
          tenant_insurance?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
      admin_delete_review: {
        Args: { _reason: string; _review_id: string }
        Returns: undefined
      }
      admin_reset_passport_application: {
        Args: { _user_id: string }
        Returns: undefined
      }
      cancel_payment_delay: {
        Args: { _transaction_id: string }
        Returns: undefined
      }
      cleanup_old_listings: { Args: never; Returns: undefined }
      compute_match_score: {
        Args: {
          _has_balcony: boolean
          _has_dishwasher: boolean
          _has_elevator: boolean
          _has_parking: boolean
          _wants_balcony: boolean
          _wants_dishwasher: boolean
          _wants_elevator: boolean
          _wants_parking: boolean
        }
        Returns: number
      }
      confirm_contract_dates: {
        Args: {
          _end_date: string
          _start_date: string
          _transaction_id: string
        }
        Returns: string
      }
      create_maintenance_report: {
        Args: {
          _category: string
          _description: string
          _images: string[]
          _title: string
          _transaction_id: string
          _urgency: Database["public"]["Enums"]["maintenance_urgency"]
        }
        Returns: string
      }
      delete_my_account: { Args: never; Returns: undefined }
      expire_rental_promotions: { Args: never; Returns: undefined }
      express_interest: {
        Args: { _listing_id: string; _request_id?: string }
        Returns: string
      }
      extend_rental_listing: { Args: { _id: string }; Returns: string }
      finalize_lease: { Args: { _transaction_id: string }; Returns: string }
      gen_passport_serial: { Args: never; Returns: string }
      get_shared_passport: {
        Args: { _transaction_id: string }
        Returns: {
          accepts_notarial_lease: boolean
          avatar_url: string
          display_name: string
          has_tenant_insurance: boolean
          home_city: string
          instagram_username: string
          lease_count: number
          linkedin_url: string
          passport_city: string
          passport_contract_valid: boolean
          passport_expires_at: string
          passport_income_verified: boolean
          passport_issued_at: string
          passport_name_verified: boolean
          passport_score: number
          passport_serial: string
          passport_social_verified: boolean
          personal_bio_pl: string
          social_facebook_url: string
          willing_tenant_insurance: boolean
        }[]
      }
      get_shared_passport_by_chat: {
        Args: { _chat_id: string }
        Returns: {
          accepts_notarial_lease: boolean
          avatar_url: string
          display_name: string
          has_tenant_insurance: boolean
          home_city: string
          instagram_username: string
          lease_count: number
          linkedin_url: string
          passport_city: string
          passport_contract_valid: boolean
          passport_expires_at: string
          passport_income_verified: boolean
          passport_issued_at: string
          passport_name_verified: boolean
          passport_score: number
          passport_serial: string
          passport_social_verified: boolean
          personal_bio_pl: string
          social_facebook_url: string
          willing_tenant_insurance: boolean
        }[]
      }
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
      landlord_hide_lease: {
        Args: { _transaction_id: string }
        Returns: undefined
      }
      listing_rating_summary: {
        Args: { _listing_id: string }
        Returns: {
          avg_overall: number
          total: number
        }[]
      }
      listing_review_summary: {
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
      post_chat_system_message: {
        Args: { _chat_id: string; _content: string }
        Returns: undefined
      }
      post_passport_shared_system_message: {
        Args: { _transaction_id: string }
        Returns: undefined
      }
      promote_rental_listing: {
        Args: { _days: number; _id: string }
        Returns: string
      }
      public_user_reviews: {
        Args: {
          _kind: Database["public"]["Enums"]["review_kind"]
          _user_id: string
        }
        Returns: {
          created_at: string
          feedback: string
          id: string
          kind: Database["public"]["Enums"]["review_kind"]
          landlord_communication: number
          landlord_fairness: number
          landlord_problem_solving: number
          listing_id: string
          overall: number
          reviewer_avatar_url: string
          reviewer_display_name: string
          reviewer_id: string
          tags: string[]
          tenant_cleanliness: number
          tenant_communication: number
          tenant_neighbors: number
          tenant_payments: number
        }[]
      }
      ratings_revealed: { Args: { _transaction_id: string }; Returns: boolean }
      reject_bid: { Args: { _bid_id: string }; Returns: undefined }
      rental_match_score: {
        Args: { _listing_id: string; _request_id: string }
        Returns: number
      }
      report_payment_delay: {
        Args: { _transaction_id: string }
        Returns: undefined
      }
      request_lease_extension: {
        Args: { _new_end_date: string; _transaction_id: string }
        Returns: undefined
      }
      respond_lease_extension: {
        Args: { _accept: boolean; _transaction_id: string }
        Returns: undefined
      }
      resume_property_listing: {
        Args: { _days: number; _id: string }
        Returns: string
      }
      review_pair_revealed: { Args: { _contract_id: string }; Returns: boolean }
      sign_lease_with_dates: {
        Args: {
          _end_date: string
          _start_date: string
          _transaction_id: string
        }
        Returns: string
      }
      update_maintenance_status: {
        Args: {
          _landlord_note: string
          _report_id: string
          _status: Database["public"]["Enums"]["maintenance_status"]
        }
        Returns: undefined
      }
      upsert_contract_draft: {
        Args: { _data: Json; _transaction_id: string }
        Returns: undefined
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
      user_review_summary: {
        Args: {
          _kind: Database["public"]["Enums"]["review_kind"]
          _user_id: string
        }
        Returns: {
          avg_overall: number
          total: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "buyer"
        | "seller"
        | "admin"
        | "passport_verifier"
        | "contractor"
      lease_state:
        | "matched"
        | "interested_passport_shared"
        | "chatting"
        | "accepted"
        | "completed"
        | "cancelled"
      maintenance_status:
        | "reported"
        | "acknowledged"
        | "in_progress"
        | "resolved"
        | "rejected"
      maintenance_urgency: "low" | "medium" | "high" | "critical"
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
      report_status: "new" | "in_progress" | "resolved" | "rejected"
      report_target:
        | "rental_listing"
        | "rental_request"
        | "user"
        | "message"
        | "passport"
        | "property"
      review_kind: "landlord" | "property" | "tenant"
      review_status: "active" | "deleted"
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
      app_role: ["buyer", "seller", "admin", "passport_verifier", "contractor"],
      lease_state: [
        "matched",
        "interested_passport_shared",
        "chatting",
        "accepted",
        "completed",
        "cancelled",
      ],
      maintenance_status: [
        "reported",
        "acknowledged",
        "in_progress",
        "resolved",
        "rejected",
      ],
      maintenance_urgency: ["low", "medium", "high", "critical"],
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
      report_status: ["new", "in_progress", "resolved", "rejected"],
      report_target: [
        "rental_listing",
        "rental_request",
        "user",
        "message",
        "passport",
        "property",
      ],
      review_kind: ["landlord", "property", "tenant"],
      review_status: ["active", "deleted"],
    },
  },
} as const
