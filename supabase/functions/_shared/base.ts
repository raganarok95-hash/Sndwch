// SND//WCH — TIPOS DE LA BASE, GENERADOS. NO SE EDITAN A MANO.
//
// Salen del esquema REAL de la base (Supabase: generate_typescript_types), no de lo que el
// código cree que hay. Una columna que no existe —`scheduled_for`, que dejó el tope por hora
// sin aplicarse desde el día uno porque su error se lo tragaba un catch— deja de compilar.
//
// Regenerar después de cada migración (con la herramienta de Supabase generate_typescript_types)
// y actualizar la línea de abajo con la versión de la última migración aplicada.
// `npm run check:tipos-base` falla si hay una migración más nueva que esta.
// generado-contra-migracion: 20260924211810
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
      ad_spend: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: number
          note: string | null
          platform: string
          spend_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: never
          note?: string | null
          platform?: string
          spend_date: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: never
          note?: string | null
          platform?: string
          spend_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_accounts: {
        Row: {
          created_at: string | null
          last_login_at: string | null
          name: string
          phone: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          last_login_at?: string | null
          name: string
          phone: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          last_login_at?: string | null
          name?: string
          phone?: string
          role?: string | null
        }
        Relationships: []
      }
      admin_action_log: {
        Row: {
          action: string
          actor_phone: string
          created_at: string
          detail: Json | null
          id: number
          target: string | null
        }
        Insert: {
          action: string
          actor_phone: string
          created_at?: string
          detail?: Json | null
          id?: never
          target?: string | null
        }
        Update: {
          action?: string
          actor_phone?: string
          created_at?: string
          detail?: Json | null
          id?: never
          target?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          business_launched: boolean
          id: boolean
          paused_until: string | null
          promos_killed_at: string | null
          promos_killed_by: string | null
          updated_at: string
        }
        Insert: {
          business_launched?: boolean
          id?: boolean
          paused_until?: string | null
          promos_killed_at?: string | null
          promos_killed_by?: string | null
          updated_at?: string
        }
        Update: {
          business_launched?: boolean
          id?: boolean
          paused_until?: string | null
          promos_killed_at?: string | null
          promos_killed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_snapshots: {
        Row: {
          customer_phone: string
          items: Json
          reminded_at: string | null
          updated_at: string
        }
        Insert: {
          customer_phone: string
          items?: Json
          reminded_at?: string | null
          updated_at?: string
        }
        Update: {
          customer_phone?: string
          items?: Json
          reminded_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          active: boolean
          badge: string | null
          base: string
          cheese_optional: boolean
          created_at: string
          created_by: string | null
          fixed_cheese: string | null
          id: number
          image_path: string | null
          item_id: string
          name: string
          pitch: string
          price_15: number
          price_30: number
          protein_id: string
          sauces: Json
          subtitle: string
          tops: Json
        }
        Insert: {
          active?: boolean
          badge?: string | null
          base: string
          cheese_optional?: boolean
          created_at?: string
          created_by?: string | null
          fixed_cheese?: string | null
          id?: never
          image_path?: string | null
          item_id: string
          name: string
          pitch?: string
          price_15: number
          price_30: number
          protein_id: string
          sauces?: Json
          subtitle?: string
          tops?: Json
        }
        Update: {
          active?: boolean
          badge?: string | null
          base?: string
          cheese_optional?: boolean
          created_at?: string
          created_by?: string | null
          fixed_cheese?: string | null
          id?: never
          image_path?: string | null
          item_id?: string
          name?: string
          pitch?: string
          price_15?: number
          price_30?: number
          protein_id?: string
          sauces?: Json
          subtitle?: string
          tops?: Json
        }
        Relationships: []
      }
      catalog_prices: {
        Row: {
          category: string
          code: string
          updated_at: string
          values: Json
        }
        Insert: {
          category: string
          code: string
          updated_at?: string
          values: Json
        }
        Update: {
          category?: string
          code?: string
          updated_at?: string
          values?: Json
        }
        Relationships: []
      }
      complaints: {
        Row: {
          alerted_deadline: boolean
          alerted_deadline_final: boolean
          claim_code: string
          claimed_amount: number | null
          consumer_address: string
          consumer_dni: string
          consumer_email: string
          consumer_name: string
          consumer_phone: string
          consumer_request: string
          created_at: string
          detail: string
          guardian_name: string | null
          id: number
          is_minor: boolean
          kind: string
          order_ref: string | null
          provider_response: string | null
          responded_at: string | null
          responded_by: string | null
          status: string
        }
        Insert: {
          alerted_deadline?: boolean
          alerted_deadline_final?: boolean
          claim_code: string
          claimed_amount?: number | null
          consumer_address: string
          consumer_dni: string
          consumer_email: string
          consumer_name: string
          consumer_phone: string
          consumer_request: string
          created_at?: string
          detail: string
          guardian_name?: string | null
          id?: never
          is_minor?: boolean
          kind: string
          order_ref?: string | null
          provider_response?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Update: {
          alerted_deadline?: boolean
          alerted_deadline_final?: boolean
          claim_code?: string
          claimed_amount?: number | null
          consumer_address?: string
          consumer_dni?: string
          consumer_email?: string
          consumer_name?: string
          consumer_phone?: string
          consumer_request?: string
          created_at?: string
          detail?: string
          guardian_name?: string | null
          id?: never
          is_minor?: boolean
          kind?: string
          order_ref?: string | null
          provider_response?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Relationships: []
      }
      content_uploads: {
        Row: {
          error_message: string | null
          id: string
          linked_calendar_id: string | null
          mime: string
          notes: string | null
          status: string
          storage_path: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          linked_calendar_id?: string | null
          mime: string
          notes?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          linked_calendar_id?: string | null
          mime?: string
          notes?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_uploads_linked_calendar_id_fkey"
            columns: ["linked_calendar_id"]
            isOneToOne: false
            referencedRelation: "marketing_calendar"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          created_at: string
          customer_phone: string
          delta: number
          id: number
          reason: string
          related_phone: string | null
        }
        Insert: {
          created_at?: string
          customer_phone: string
          delta: number
          id?: never
          reason: string
          related_phone?: string | null
        }
        Update: {
          created_at?: string
          customer_phone?: string
          delta?: number
          id?: never
          reason?: string
          related_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_customer_phone_fkey"
            columns: ["customer_phone"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["phone"]
          },
        ]
      }
      cron_heartbeats: {
        Row: {
          action: string
          alerted_at: string | null
          error_runs: number
          last_error: string | null
          last_error_at: string | null
          last_ok_at: string | null
          ok_runs: number
        }
        Insert: {
          action: string
          alerted_at?: string | null
          error_runs?: number
          last_error?: string | null
          last_error_at?: string | null
          last_ok_at?: string | null
          ok_runs?: number
        }
        Update: {
          action?: string
          alerted_at?: string | null
          error_runs?: number
          last_error?: string | null
          last_error_at?: string | null
          last_ok_at?: string | null
          ok_runs?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          acquisition_source: string | null
          ad_tracking_opt_out: boolean
          address_count: number | null
          birthday: string | null
          birthday_pts_year: number | null
          challenge_claimed_month: string | null
          created_at: string | null
          credit_balance: number
          discovery_claimed_month: string | null
          dni: string | null
          email: string | null
          failed_login_count: number
          google_id: string | null
          last_address: string | null
          last_winback_sent: string | null
          locked_until: string | null
          monthly_recap_ym: number
          name: string
          notif_prefs: Json
          pending_points: number | null
          phone: string
          pin: string
          points: number | null
          preferred_payment: string | null
          referral_bonus_granted: boolean
          referral_code: string | null
          referral_milestone_granted: number
          referred_by: string | null
          reset_token: string | null
          reset_token_expires: string | null
          session_version: number
          total_orders: number | null
          total_redeemed: number | null
          total_referrals: number | null
        }
        Insert: {
          acquisition_source?: string | null
          ad_tracking_opt_out?: boolean
          address_count?: number | null
          birthday?: string | null
          birthday_pts_year?: number | null
          challenge_claimed_month?: string | null
          created_at?: string | null
          credit_balance?: number
          discovery_claimed_month?: string | null
          dni?: string | null
          email?: string | null
          failed_login_count?: number
          google_id?: string | null
          last_address?: string | null
          last_winback_sent?: string | null
          locked_until?: string | null
          monthly_recap_ym?: number
          name: string
          notif_prefs?: Json
          pending_points?: number | null
          phone: string
          pin: string
          points?: number | null
          preferred_payment?: string | null
          referral_bonus_granted?: boolean
          referral_code?: string | null
          referral_milestone_granted?: number
          referred_by?: string | null
          reset_token?: string | null
          reset_token_expires?: string | null
          session_version?: number
          total_orders?: number | null
          total_redeemed?: number | null
          total_referrals?: number | null
        }
        Update: {
          acquisition_source?: string | null
          ad_tracking_opt_out?: boolean
          address_count?: number | null
          birthday?: string | null
          birthday_pts_year?: number | null
          challenge_claimed_month?: string | null
          created_at?: string | null
          credit_balance?: number
          discovery_claimed_month?: string | null
          dni?: string | null
          email?: string | null
          failed_login_count?: number
          google_id?: string | null
          last_address?: string | null
          last_winback_sent?: string | null
          locked_until?: string | null
          monthly_recap_ym?: number
          name?: string
          notif_prefs?: Json
          pending_points?: number | null
          phone?: string
          pin?: string
          points?: number | null
          preferred_payment?: string | null
          referral_bonus_granted?: boolean
          referral_code?: string | null
          referral_milestone_granted?: number
          referred_by?: string | null
          reset_token?: string | null
          reset_token_expires?: string | null
          session_version?: number
          total_orders?: number | null
          total_redeemed?: number | null
          total_referrals?: number | null
        }
        Relationships: []
      }
      debug_logs: {
        Row: {
          created_at: string | null
          detail: Json | null
          id: number
          source: string | null
        }
        Insert: {
          created_at?: string | null
          detail?: Json | null
          id?: never
          source?: string | null
        }
        Update: {
          created_at?: string | null
          detail?: Json | null
          id?: never
          source?: string | null
        }
        Relationships: []
      }
      deleted_account_identities: {
        Row: {
          deleted_at: string
          dni: string | null
          phone: string
        }
        Insert: {
          deleted_at?: string
          dni?: string | null
          phone: string
        }
        Update: {
          deleted_at?: string
          dni?: string | null
          phone?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          build: Json
          created_at: string
          customer_phone: string
          id: number
          items: Json | null
          name: string
        }
        Insert: {
          build: Json
          created_at?: string
          customer_phone: string
          id?: never
          items?: Json | null
          name: string
        }
        Update: {
          build?: Json
          created_at?: string
          customer_phone?: string
          id?: never
          items?: Json | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_customer_phone_fkey"
            columns: ["customer_phone"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["phone"]
          },
        ]
      }
      group_order_items: {
        Row: {
          contributor_name: string
          created_at: string
          group_order_id: string
          id: string
          item: Json
        }
        Insert: {
          contributor_name: string
          created_at?: string
          group_order_id: string
          id?: string
          item: Json
        }
        Update: {
          contributor_name?: string
          created_at?: string
          group_order_id?: string
          id?: string
          item?: Json
        }
        Relationships: [
          {
            foreignKeyName: "group_order_items_group_order_id_fkey"
            columns: ["group_order_id"]
            isOneToOne: false
            referencedRelation: "group_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      group_orders: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          organizer_name: string
          organizer_phone: string
          split_deadline: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          organizer_name: string
          organizer_phone: string
          split_deadline?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          organizer_name?: string
          organizer_phone?: string
          split_deadline?: string | null
          status?: string
        }
        Relationships: []
      }
      ingredient_purchases: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          notes: string | null
          product_code: string
          purchased_at: string
          qty: number
          supplier: string | null
          total_paid: number
          unit: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          notes?: string | null
          product_code: string
          purchased_at?: string
          qty: number
          supplier?: string | null
          total_paid: number
          unit: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          notes?: string | null
          product_code?: string
          purchased_at?: string
          qty?: number
          supplier?: string | null
          total_paid?: number
          unit?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          batch_cooked_at: string | null
          in_stock: boolean
          low_stock_threshold: number
          product_code: string
          product_name: string | null
          shelf_life_days: number
          stock_qty: number | null
          updated_at: string | null
        }
        Insert: {
          batch_cooked_at?: string | null
          in_stock?: boolean
          low_stock_threshold?: number
          product_code: string
          product_name?: string | null
          shelf_life_days?: number
          stock_qty?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_cooked_at?: string | null
          in_stock?: boolean
          low_stock_threshold?: number
          product_code?: string
          product_name?: string | null
          shelf_life_days?: number
          stock_qty?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          failed_count: number
          locked_until: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          failed_count?: number
          locked_until?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          failed_count?: number
          locked_until?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_codes: {
        Row: {
          attempts: number
          code_hash: string
          email: string
          expires_at: string
          sent_at: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          email: string
          expires_at: string
          sent_at?: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          email?: string
          expires_at?: string
          sent_at?: string
        }
        Relationships: []
      }
      marketing_calendar: {
        Row: {
          campaign_tag: string | null
          caption_text: string | null
          channel: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          media_type: string
          photo_idea: string | null
          posted_at: string | null
          published_ref: string | null
          scheduled_date: string
          status: string
          title: string
          updated_at: string
          video_idea: string | null
          video_url: string | null
          whatsapp_text: string | null
        }
        Insert: {
          campaign_tag?: string | null
          caption_text?: string | null
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          media_type?: string
          photo_idea?: string | null
          posted_at?: string | null
          published_ref?: string | null
          scheduled_date: string
          status?: string
          title: string
          updated_at?: string
          video_idea?: string | null
          video_url?: string | null
          whatsapp_text?: string | null
        }
        Update: {
          campaign_tag?: string | null
          caption_text?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          media_type?: string
          photo_idea?: string | null
          posted_at?: string | null
          published_ref?: string | null
          scheduled_date?: string
          status?: string
          title?: string
          updated_at?: string
          video_idea?: string | null
          video_url?: string | null
          whatsapp_text?: string | null
        }
        Relationships: []
      }
      marketing_touches: {
        Row: {
          campaign_type: string
          channel: string
          customer_phone: string
          id: number
          sent_at: string
        }
        Insert: {
          campaign_type: string
          channel?: string
          customer_phone: string
          id?: never
          sent_at?: string
        }
        Update: {
          campaign_type?: string
          channel?: string
          customer_phone?: string
          id?: never
          sent_at?: string
        }
        Relationships: []
      }
      order_problems: {
        Row: {
          alerted: boolean
          created_at: string
          customer_phone: string
          detalle: string | null
          id: number
          motivo: string
          order_id: string
          ref: string
          resolution: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          respond_by: string
        }
        Insert: {
          alerted?: boolean
          created_at?: string
          customer_phone: string
          detalle?: string | null
          id?: never
          motivo: string
          order_id: string
          ref: string
          resolution?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          respond_by: string
        }
        Update: {
          alerted?: boolean
          created_at?: string
          customer_phone?: string
          detalle?: string | null
          id?: never
          motivo?: string
          order_id?: string
          ref?: string
          resolution?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          respond_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_problems_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          alerted_eta_missed: boolean
          alerted_scheduled_reminder: boolean
          alerted_stuck: boolean
          alerted_stuck_progress: boolean
          cancel_reason: string | null
          contact_phone: string | null
          created_at: string
          customer_address: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          customer_rank: string | null
          date: string | null
          delivered_at: string | null
          delivery_fee: number
          delivery_km: number | null
          delivery_time: string | null
          delivery_token: string | null
          delivery_zone: string | null
          eta_minutes: number | null
          group_code: string | null
          id: string
          items: Json
          lat: number | null
          lon: number | null
          notes: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          promised_from: string | null
          promised_to: string | null
          receipt_hash: string | null
          receipt_ocr: Json | null
          receipt_op_number: string | null
          receipt_path: string | null
          recurring_id: string | null
          redeemed_reward: string | null
          redeemed_reward_pts: number | null
          ref: string
          reminded_customer_scheduled: boolean
          status: string | null
          status_changed_at: string | null
          summary: string | null
          total: number
        }
        Insert: {
          alerted_eta_missed?: boolean
          alerted_scheduled_reminder?: boolean
          alerted_stuck?: boolean
          alerted_stuck_progress?: boolean
          cancel_reason?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_address: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_rank?: string | null
          date?: string | null
          delivered_at?: string | null
          delivery_fee?: number
          delivery_km?: number | null
          delivery_time?: string | null
          delivery_token?: string | null
          delivery_zone?: string | null
          eta_minutes?: number | null
          group_code?: string | null
          id?: string
          items?: Json
          lat?: number | null
          lon?: number | null
          notes?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          promised_from?: string | null
          promised_to?: string | null
          receipt_hash?: string | null
          receipt_ocr?: Json | null
          receipt_op_number?: string | null
          receipt_path?: string | null
          recurring_id?: string | null
          redeemed_reward?: string | null
          redeemed_reward_pts?: number | null
          ref: string
          reminded_customer_scheduled?: boolean
          status?: string | null
          status_changed_at?: string | null
          summary?: string | null
          total: number
        }
        Update: {
          alerted_eta_missed?: boolean
          alerted_scheduled_reminder?: boolean
          alerted_stuck?: boolean
          alerted_stuck_progress?: boolean
          cancel_reason?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_address?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_rank?: string | null
          date?: string | null
          delivered_at?: string | null
          delivery_fee?: number
          delivery_km?: number | null
          delivery_time?: string | null
          delivery_token?: string | null
          delivery_zone?: string | null
          eta_minutes?: number | null
          group_code?: string | null
          id?: string
          items?: Json
          lat?: number | null
          lon?: number | null
          notes?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          promised_from?: string | null
          promised_to?: string | null
          receipt_hash?: string | null
          receipt_ocr?: Json | null
          receipt_op_number?: string | null
          receipt_path?: string | null
          recurring_id?: string | null
          redeemed_reward?: string | null
          redeemed_reward_pts?: number | null
          ref?: string
          reminded_customer_scheduled?: boolean
          status?: string | null
          status_changed_at?: string | null
          summary?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_phone_fkey"
            columns: ["customer_phone"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["phone"]
          },
          {
            foreignKeyName: "orders_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_charges: {
        Row: {
          alerted_orphan_charge: boolean
          charge_id: string | null
          charged_at: string | null
          contact_phone: string
          created_at: string
          customer_address: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          decline_reason: string | null
          declined_at: string | null
          delivery_fee: number
          delivery_km: number | null
          delivery_zone: string | null
          expected_total: number
          expires_at: string
          id: string
          lat: number | null
          lon: number | null
          notes: string | null
          promo_code_id: string | null
          promo_discount: number
          recurring_id: string | null
          ref: string
          reserved_codes: string[]
          reserved_qtys: number[]
          reward_id: string | null
          sanitized_items: Json
          scheduled_for: string | null
          status: string
          summary: string | null
        }
        Insert: {
          alerted_orphan_charge?: boolean
          charge_id?: string | null
          charged_at?: string | null
          contact_phone: string
          created_at?: string
          customer_address: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          delivery_fee?: number
          delivery_km?: number | null
          delivery_zone?: string | null
          expected_total: number
          expires_at: string
          id?: string
          lat?: number | null
          lon?: number | null
          notes?: string | null
          promo_code_id?: string | null
          promo_discount?: number
          recurring_id?: string | null
          ref: string
          reserved_codes?: string[]
          reserved_qtys?: number[]
          reward_id?: string | null
          sanitized_items: Json
          scheduled_for?: string | null
          status?: string
          summary?: string | null
        }
        Update: {
          alerted_orphan_charge?: boolean
          charge_id?: string | null
          charged_at?: string | null
          contact_phone?: string
          created_at?: string
          customer_address?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          delivery_fee?: number
          delivery_km?: number | null
          delivery_zone?: string | null
          expected_total?: number
          expires_at?: string
          id?: string
          lat?: number | null
          lon?: number | null
          notes?: string | null
          promo_code_id?: string | null
          promo_discount?: number
          recurring_id?: string | null
          ref?: string
          reserved_codes?: string[]
          reserved_qtys?: number[]
          reward_id?: string | null
          sanitized_items?: Json
          scheduled_for?: string | null
          status?: string
          summary?: string | null
        }
        Relationships: []
      }
      pending_weekly_plans: {
        Row: {
          amount_paid: number
          buyer_name: string
          buyer_phone: string
          charge_id: string | null
          charged_at: string | null
          created_at: string
          credit_amount: number
          decline_reason: string | null
          declined_at: string | null
          expires_at: string
          id: string
          ref: string
          status: string
        }
        Insert: {
          amount_paid: number
          buyer_name: string
          buyer_phone: string
          charge_id?: string | null
          charged_at?: string | null
          created_at?: string
          credit_amount: number
          decline_reason?: string | null
          declined_at?: string | null
          expires_at: string
          id?: string
          ref: string
          status?: string
        }
        Update: {
          amount_paid?: number
          buyer_name?: string
          buyer_phone?: string
          charge_id?: string | null
          charged_at?: string | null
          created_at?: string
          credit_amount?: number
          decline_reason?: string | null
          declined_at?: string | null
          expires_at?: string
          id?: string
          ref?: string
          status?: string
        }
        Relationships: []
      }
      production_recipes: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: number
          ingredients: Json
          name: string
          notes: string | null
          portion_grams: number | null
          recipe_code: string
          steps: Json
          yield_portions: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: number
          ingredients?: Json
          name: string
          notes?: string | null
          portion_grams?: number | null
          recipe_code: string
          steps?: Json
          yield_portions: number
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: number
          ingredients?: Json
          name?: string
          notes?: string | null
          portion_grams?: number | null
          recipe_code?: string
          steps?: Json
          yield_portions?: number
        }
        Relationships: []
      }
      promo_code_redemptions: {
        Row: {
          code: string
          created_at: string
          discount_applied: number
          id: number
          order_ref: string
          phone: string
          promo_code_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_applied: number
          id?: never
          order_ref: string
          phone: string
          promo_code_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_applied?: number
          id?: never
          order_ref?: string
          phone?: string
          promo_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean
          campaign_tag: string | null
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          id: string
          max_discount: number | null
          max_uses: number | null
          min_order_total: number
          uses_count: number
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          active?: boolean
          campaign_tag?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: string
          id?: string
          max_discount?: number | null
          max_uses?: number | null
          min_order_total?: number
          uses_count?: number
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          active?: boolean
          campaign_tag?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          id?: string
          max_discount?: number | null
          max_uses?: number | null
          min_order_total?: number
          uses_count?: number
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          customer_phone: string
          endpoint: string
          id: string
          p256dh: string
        }
        Insert: {
          auth: string
          created_at?: string
          customer_phone: string
          endpoint: string
          id?: string
          p256dh: string
        }
        Update: {
          auth?: string
          created_at?: string
          customer_phone?: string
          endpoint?: string
          id?: string
          p256dh?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          customer_phone: string | null
          id: number
          order_ref: string
          stars: number
          testimonial_consent: boolean
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_phone?: string | null
          id?: never
          order_ref: string
          stars: number
          testimonial_consent?: boolean
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_phone?: string | null
          id?: never
          order_ref?: string
          stars?: number
          testimonial_consent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ratings_customer_phone_fkey"
            columns: ["customer_phone"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["phone"]
          },
        ]
      }
      recurring_orders: {
        Row: {
          active: boolean
          address_id: number | null
          created_at: string
          customer_phone: string
          id: string
          items: Json
          label: string | null
          last_notified_at: string | null
          skip_on: string | null
          slot: string
          weekday: number
        }
        Insert: {
          active?: boolean
          address_id?: number | null
          created_at?: string
          customer_phone: string
          id?: string
          items: Json
          label?: string | null
          last_notified_at?: string | null
          skip_on?: string | null
          slot: string
          weekday: number
        }
        Update: {
          active?: boolean
          address_id?: number | null
          created_at?: string
          customer_phone?: string
          id?: string
          items?: Json
          label?: string | null
          last_notified_at?: string | null
          skip_on?: string | null
          slot?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "saved_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      restock_notify_requests: {
        Row: {
          created_at: string
          customer_phone: string
          id: string
          sig_id: string
        }
        Insert: {
          created_at?: string
          customer_phone: string
          id?: string
          sig_id: string
        }
        Update: {
          created_at?: string
          customer_phone?: string
          id?: string
          sig_id?: string
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address: string
          created_at: string | null
          customer_phone: string | null
          id: number
          label: string | null
          lat: number | null
          lon: number | null
          reference: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          customer_phone?: string | null
          id?: number
          label?: string | null
          lat?: number | null
          lon?: number | null
          reference?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          customer_phone?: string | null
          id?: number
          label?: string | null
          lat?: number | null
          lon?: number | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_addresses_customer_phone_fkey"
            columns: ["customer_phone"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["phone"]
          },
        ]
      }
      secret_signature: {
        Row: {
          base: string
          blurb: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          hints: Json
          id: number
          image_path: string | null
          min_orders: number
          name: string
          price_15: number
          price_30: number
          protein_id: string
          sauces: Json
          tops: Json
          vault_only_ids: Json
        }
        Insert: {
          base: string
          blurb?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          hints?: Json
          id?: never
          image_path?: string | null
          min_orders?: number
          name: string
          price_15: number
          price_30: number
          protein_id: string
          sauces?: Json
          tops?: Json
          vault_only_ids?: Json
        }
        Update: {
          base?: string
          blurb?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          hints?: Json
          id?: never
          image_path?: string | null
          min_orders?: number
          name?: string
          price_15?: number
          price_30?: number
          protein_id?: string
          sauces?: Json
          tops?: Json
          vault_only_ids?: Json
        }
        Relationships: []
      }
      store_hours: {
        Row: {
          close_hour: number | null
          closed: boolean
          open_hour: number | null
          updated_at: string
          weekday: number
        }
        Insert: {
          close_hour?: number | null
          closed?: boolean
          open_hour?: number | null
          updated_at?: string
          weekday: number
        }
        Update: {
          close_hour?: number | null
          closed?: boolean
          open_hour?: number | null
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          confirmed: boolean | null
          created_at: string | null
          customer_phone: string
          date: string | null
          description: string | null
          id: string
          order_ref: string | null
          points: number
          type: string
        }
        Insert: {
          confirmed?: boolean | null
          created_at?: string | null
          customer_phone: string
          date?: string | null
          description?: string | null
          id?: string
          order_ref?: string | null
          points: number
          type: string
        }
        Update: {
          confirmed?: boolean | null
          created_at?: string | null
          customer_phone?: string
          date?: string | null
          description?: string | null
          id?: string
          order_ref?: string | null
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_phone_fkey"
            columns: ["customer_phone"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["phone"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          created_at: string
          id: string
          name: string | null
          phone: string
          source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          phone: string
          source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          phone?: string
          source?: string | null
        }
        Relationships: []
      }
      zone_waitlist: {
        Row: {
          created_at: string
          customer_phone: string
          district: string
          id: number
          lat: number | null
          lon: number | null
          notified_at: string | null
        }
        Insert: {
          created_at?: string
          customer_phone: string
          district: string
          id?: never
          lat?: number | null
          lon?: number | null
          notified_at?: string | null
        }
        Update: {
          created_at?: string
          customer_phone?: string
          district?: string
          id?: never
          lat?: number | null
          lon?: number | null
          notified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_gifted_credit: {
        Args: { p_amount: number; p_to_phone: string }
        Returns: undefined
      }
      adjust_credit_balance: {
        Args: { p_delta: number; p_phone: string }
        Returns: number
      }
      admin_adjust_credit: {
        Args: { p_delta: number; p_phone: string }
        Returns: {
          acquisition_source: string | null
          ad_tracking_opt_out: boolean
          address_count: number | null
          birthday: string | null
          birthday_pts_year: number | null
          challenge_claimed_month: string | null
          created_at: string | null
          credit_balance: number
          discovery_claimed_month: string | null
          dni: string | null
          email: string | null
          failed_login_count: number
          google_id: string | null
          last_address: string | null
          last_winback_sent: string | null
          locked_until: string | null
          monthly_recap_ym: number
          name: string
          notif_prefs: Json
          pending_points: number | null
          phone: string
          pin: string
          points: number | null
          preferred_payment: string | null
          referral_bonus_granted: boolean
          referral_code: string | null
          referral_milestone_granted: number
          referred_by: string | null
          reset_token: string | null
          reset_token_expires: string | null
          session_version: number
          total_orders: number | null
          total_redeemed: number | null
          total_referrals: number | null
        }
        SetofOptions: {
          from: "*"
          to: "customers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      aplicar_pedido_a_la_cuenta: {
        Args: { p_cuenta: Json; p_rangos?: Json; p_ref: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_minutes: number }
        Returns: boolean
      }
      claim_discovery_challenge: {
        Args: { p_bonus: number; p_month: string; p_phone: string }
        Returns: {
          acquisition_source: string | null
          ad_tracking_opt_out: boolean
          address_count: number | null
          birthday: string | null
          birthday_pts_year: number | null
          challenge_claimed_month: string | null
          created_at: string | null
          credit_balance: number
          discovery_claimed_month: string | null
          dni: string | null
          email: string | null
          failed_login_count: number
          google_id: string | null
          last_address: string | null
          last_winback_sent: string | null
          locked_until: string | null
          monthly_recap_ym: number
          name: string
          notif_prefs: Json
          pending_points: number | null
          phone: string
          pin: string
          points: number | null
          preferred_payment: string | null
          referral_bonus_granted: boolean
          referral_code: string | null
          referral_milestone_granted: number
          referred_by: string | null
          reset_token: string | null
          reset_token_expires: string | null
          session_version: number
          total_orders: number | null
          total_redeemed: number | null
          total_referrals: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "customers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_monthly_challenge: {
        Args: { p_bonus: number; p_month: string; p_phone: string }
        Returns: {
          acquisition_source: string | null
          ad_tracking_opt_out: boolean
          address_count: number | null
          birthday: string | null
          birthday_pts_year: number | null
          challenge_claimed_month: string | null
          created_at: string | null
          credit_balance: number
          discovery_claimed_month: string | null
          dni: string | null
          email: string | null
          failed_login_count: number
          google_id: string | null
          last_address: string | null
          last_winback_sent: string | null
          locked_until: string | null
          monthly_recap_ym: number
          name: string
          notif_prefs: Json
          pending_points: number | null
          phone: string
          pin: string
          points: number | null
          preferred_payment: string | null
          referral_bonus_granted: boolean
          referral_code: string | null
          referral_milestone_granted: number
          referred_by: string | null
          reset_token: string | null
          reset_token_expires: string | null
          session_version: number
          total_orders: number | null
          total_redeemed: number | null
          total_referrals: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "customers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      confirm_weekly_plan_credit: {
        Args: { p_plan_id: string }
        Returns: {
          amount_paid: number
          buyer_name: string
          buyer_phone: string
          charge_id: string | null
          charged_at: string | null
          created_at: string
          credit_amount: number
          decline_reason: string | null
          declined_at: string | null
          expires_at: string
          id: string
          ref: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "pending_weekly_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirmar_pago_manual: {
        Args: { p_cuenta?: Json; p_order_id: string; p_rangos?: Json }
        Returns: Json
      }
      crear_pedido: {
        Args: { p_cuenta?: Json; p_pedido: Json; p_rangos?: Json }
        Returns: Json
      }
      dashboard_aggregates: {
        Args: { p_month_start: string; p_week_start: string }
        Returns: Json
      }
      db_size_bytes: { Args: never; Returns: number }
      dead_cron_jobs: {
        Args: { p_min_misses?: number }
        Returns: {
          action: string
          alerted_at: string
          fired_since: number
          jobname: string
          last_error: string
          last_ok_at: string
        }[]
      }
      error_spike: {
        Args: { p_factor?: number; p_min_errors?: number }
        Returns: {
          baseline_per_hour: number
          last_hour: number
        }[]
      }
      finalize_order_customer_update: {
        Args: {
          p_credit_delta: number
          p_last_address: string
          p_phone: string
          p_points_delta: number
          p_referral_bonus?: number
          p_referrer_bonus?: number
          p_referrer_phone?: string
          p_total_orders_delta: number
          p_total_redeemed_delta: number
        }
        Returns: {
          acquisition_source: string | null
          ad_tracking_opt_out: boolean
          address_count: number | null
          birthday: string | null
          birthday_pts_year: number | null
          challenge_claimed_month: string | null
          created_at: string | null
          credit_balance: number
          discovery_claimed_month: string | null
          dni: string | null
          email: string | null
          failed_login_count: number
          google_id: string | null
          last_address: string | null
          last_winback_sent: string | null
          locked_until: string | null
          monthly_recap_ym: number
          name: string
          notif_prefs: Json
          pending_points: number | null
          phone: string
          pin: string
          points: number | null
          preferred_payment: string | null
          referral_bonus_granted: boolean
          referral_code: string | null
          referral_milestone_granted: number
          referred_by: string | null
          reset_token: string | null
          reset_token_expires: string | null
          session_version: number
          total_orders: number | null
          total_redeemed: number | null
          total_referrals: number | null
        }
        SetofOptions: {
          from: "*"
          to: "customers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      gift_credit: {
        Args: { p_amount: number; p_from: string; p_to: string }
        Returns: undefined
      }
      grant_referral_milestone: {
        Args: { p_phone: string; p_points: number; p_tier: number }
        Returns: Json
      }
      hash_pin: { Args: { plain: string }; Returns: string }
      increment_customer_points: {
        Args: { p_delta: number; p_phone: string }
        Returns: number
      }
      issue_login_code: {
        Args: {
          p_code: string
          p_cooldown_seconds: number
          p_email: string
          p_ttl_minutes: number
        }
        Returns: boolean
      }
      login_lockout_remaining_minutes: {
        Args: { p_phone: string }
        Returns: number
      }
      mark_cron_alerted: { Args: { p_action: string }; Returns: undefined }
      record_cron_heartbeat: {
        Args: { p_action: string; p_error?: string; p_ok: boolean }
        Returns: undefined
      }
      redeem_points_for_gift_credit: {
        Args: {
          p_credit_amount: number
          p_from: string
          p_points: number
          p_to: string
        }
        Returns: undefined
      }
      redeem_promo_code: {
        Args: {
          p_discount: number
          p_order_ref: string
          p_phone: string
          p_promo_id: string
        }
        Returns: undefined
      }
      register_login_failure: {
        Args: {
          p_lockout_minutes: number
          p_max_attempts: number
          p_phone: string
        }
        Returns: undefined
      }
      release_promo_redemption: {
        Args: { p_order_ref: string; p_phone: string; p_promo_id: string }
        Returns: undefined
      }
      reponer_tanda: { Args: { p_items: Json }; Returns: Json }
      reserve_inventory: {
        Args: { p_codes: string[]; p_qtys: number[] }
        Returns: undefined
      }
      reset_login_attempts: { Args: { p_phone: string }; Returns: undefined }
      restock_inventory: {
        Args: { p_codes: string[]; p_qtys: number[] }
        Returns: undefined
      }
      retention_report: {
        Args: {
          p_card_fee_pct?: number
          p_cohort_months?: number
          p_ingredient_cost_pct?: number
        }
        Returns: Json
      }
      reverse_referral_bonus: {
        Args: {
          p_bonus: number
          p_referred_phone: string
          p_referrer_bonus?: number
          p_referrer_phone: string
        }
        Returns: undefined
      }
      table_sizes: {
        Args: { p_limit?: number }
        Returns: {
          row_estimate: number
          table_name: string
          total_bytes: number
        }[]
      }
      verify_cron_secret: { Args: { p_secret: string }; Returns: boolean }
      verify_login_code: {
        Args: { p_code: string; p_email: string; p_max_attempts: number }
        Returns: boolean
      }
      verify_pin: { Args: { p_phone: string; plain: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
