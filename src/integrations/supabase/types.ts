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
      achievements_catalog: {
        Row: {
          badge_group: string
          created_at: string
          description: string | null
          icon: string | null
          key: string
          rarity: string
          title: string
          xp_reward: number
        }
        Insert: {
          badge_group?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          key: string
          rarity?: string
          title: string
          xp_reward?: number
        }
        Update: {
          badge_group?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          key?: string
          rarity?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      activation_codes: {
        Row: {
          cakto_event: string
          cakto_order_id: string
          claimed_at: string | null
          claimed_by: string | null
          code: string
          created_at: string | null
          customer_email: string
          expires_at: string | null
          id: string
          ref_id: string
          tipo: string
        }
        Insert: {
          cakto_event: string
          cakto_order_id: string
          claimed_at?: string | null
          claimed_by?: string | null
          code: string
          created_at?: string | null
          customer_email: string
          expires_at?: string | null
          id?: string
          ref_id: string
          tipo: string
        }
        Update: {
          cakto_event?: string
          cakto_order_id?: string
          claimed_at?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string | null
          customer_email?: string
          expires_at?: string | null
          id?: string
          ref_id?: string
          tipo?: string
        }
        Relationships: []
      }
      cakto_events: {
        Row: {
          cakto_email: string | null
          cakto_order_id: string | null
          erro: string | null
          evento: string
          id: string
          payload: Json | null
          processado_em: string | null
          status: string | null
        }
        Insert: {
          cakto_email?: string | null
          cakto_order_id?: string | null
          erro?: string | null
          evento: string
          id?: string
          payload?: Json | null
          processado_em?: string | null
          status?: string | null
        }
        Update: {
          cakto_email?: string | null
          cakto_order_id?: string | null
          erro?: string | null
          evento?: string
          id?: string
          payload?: Json | null
          processado_em?: string | null
          status?: string | null
        }
        Relationships: []
      }
      cakto_product_map: {
        Row: {
          ativo: boolean | null
          cakto_product_id: string
          cakto_product_nome: string | null
          created_at: string | null
          id: string
          ref_id: string
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          cakto_product_id: string
          cakto_product_nome?: string | null
          created_at?: string | null
          id?: string
          ref_id: string
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          cakto_product_id?: string
          cakto_product_nome?: string | null
          created_at?: string | null
          id?: string
          ref_id?: string
          tipo?: string
        }
        Relationships: []
      }
      casatrade_balance_history: {
        Row: {
          casatrade_user_id: string | null
          deposito_detectado: boolean | null
          id: string
          registrado_em: string
          saldo_real: number | null
          saque_detectado: boolean | null
          tipo_variacao: string | null
          user_id: string | null
          valor_variacao: number | null
        }
        Insert: {
          casatrade_user_id?: string | null
          deposito_detectado?: boolean | null
          id?: string
          registrado_em?: string
          saldo_real?: number | null
          saque_detectado?: boolean | null
          tipo_variacao?: string | null
          user_id?: string | null
          valor_variacao?: number | null
        }
        Update: {
          casatrade_user_id?: string | null
          deposito_detectado?: boolean | null
          id?: string
          registrado_em?: string
          saldo_real?: number | null
          saque_detectado?: boolean | null
          tipo_variacao?: string | null
          user_id?: string | null
          valor_variacao?: number | null
        }
        Relationships: []
      }
      casatrade_data: {
        Row: {
          casatrade_user_id: string | null
          current_balance: number | null
          deposit_count: number | null
          email: string | null
          ftd_amount: number | null
          ftd_date: string | null
          id: string
          imported_at: string
          postback_evento: string | null
          postback_recebido_em: string | null
          total_deposited: number | null
          updated_at: string
        }
        Insert: {
          casatrade_user_id?: string | null
          current_balance?: number | null
          deposit_count?: number | null
          email?: string | null
          ftd_amount?: number | null
          ftd_date?: string | null
          id?: string
          imported_at?: string
          postback_evento?: string | null
          postback_recebido_em?: string | null
          total_deposited?: number | null
          updated_at?: string
        }
        Update: {
          casatrade_user_id?: string | null
          current_balance?: number | null
          deposit_count?: number | null
          email?: string | null
          ftd_amount?: number | null
          ftd_date?: string | null
          id?: string
          imported_at?: string
          postback_evento?: string | null
          postback_recebido_em?: string | null
          total_deposited?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      casatrade_postback_events: {
        Row: {
          amount: number | null
          event: string
          event_id: string
          processed_at: string
          trader_id: string | null
        }
        Insert: {
          amount?: number | null
          event: string
          event_id: string
          processed_at?: string
          trader_id?: string | null
        }
        Update: {
          amount?: number | null
          event?: string
          event_id?: string
          processed_at?: string
          trader_id?: string | null
        }
        Relationships: []
      }
      course_plan_access: {
        Row: {
          course_id: string
          plan_id: string
        }
        Insert: {
          course_id: string
          plan_id: string
        }
        Update: {
          course_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_plan_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_plan_access_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          module: string | null
          ordem: number | null
          panda_video_id: string
          published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          ordem?: number | null
          panda_video_id: string
          published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          ordem?: number | null
          panda_video_id?: string
          published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          course_id: string
          id: string
          user_id: string
          watched_at: string
        }
        Insert: {
          course_id: string
          id?: string
          user_id: string
          watched_at?: string
        }
        Update: {
          course_id?: string
          id?: string
          user_id?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_submissions: {
        Row: {
          admin_notes: string | null
          checkout_url: string | null
          comissao_pct: number | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          preco_sugerido: number | null
          preview_trades: number | null
          preview_winrate: number | null
          status: string
          strategy_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          checkout_url?: string | null
          comissao_pct?: number | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          preco_sugerido?: number | null
          preview_trades?: number | null
          preview_winrate?: number | null
          status?: string
          strategy_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          checkout_url?: string | null
          comissao_pct?: number | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          preco_sugerido?: number | null
          preview_trades?: number | null
          preview_winrate?: number | null
          status?: string
          strategy_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_submissions_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "user_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      missions_catalog: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          requirement_type: string
          requirement_value: number
          sort_order: number
          title: string
          type: string
          xp_reward: number
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id: string
          requirement_type: string
          requirement_value?: number
          sort_order?: number
          title: string
          type?: string
          xp_reward?: number
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          requirement_type?: string
          requirement_value?: number
          sort_order?: number
          title?: string
          type?: string
          xp_reward?: number
        }
        Relationships: []
      }
      plans: {
        Row: {
          ativo: boolean
          created_at: string | null
          id: string
          is_recorrente: boolean
          is_vitalicio: boolean
          max_estrategias: number
          nome: string
          slug: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          id?: string
          is_recorrente?: boolean
          is_vitalicio?: boolean
          max_estrategias?: number
          nome: string
          slug: string
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          id?: string
          is_recorrente?: boolean
          is_vitalicio?: boolean
          max_estrategias?: number
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          genero: string | null
          id: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          genero?: string | null
          id: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          genero?: string | null
          id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      rank_history: {
        Row: {
          id: string
          rank_position: number
          recorded_date: string
          score: number
          user_id: string
        }
        Insert: {
          id?: string
          rank_position: number
          recorded_date?: string
          score?: number
          user_id: string
        }
        Update: {
          id?: string
          rank_position?: number
          recorded_date?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          ended_at: string | null
          hall_of_fame_user_id: string | null
          id: string
          mvp1_user_id: string | null
          mvp2_user_id: string | null
          mvp3_user_id: string | null
          started_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          hall_of_fame_user_id?: string | null
          id: string
          mvp1_user_id?: string | null
          mvp2_user_id?: string | null
          mvp3_user_id?: string | null
          started_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          hall_of_fame_user_id?: string | null
          id?: string
          mvp1_user_id?: string | null
          mvp2_user_id?: string | null
          mvp3_user_id?: string | null
          started_at?: string
        }
        Relationships: []
      }
      trade_events: {
        Row: {
          asset: string | null
          casatrade_user_id: string | null
          direction: string | null
          happened_at: string
          id: string
          pnl: number | null
          raw_payload: Json | null
          result: string | null
          strategy_id: string | null
          user_id: string
        }
        Insert: {
          asset?: string | null
          casatrade_user_id?: string | null
          direction?: string | null
          happened_at?: string
          id?: string
          pnl?: number | null
          raw_payload?: Json | null
          result?: string | null
          strategy_id?: string | null
          user_id: string
        }
        Update: {
          asset?: string | null
          casatrade_user_id?: string | null
          direction?: string | null
          happened_at?: string
          id?: string
          pnl?: number | null
          raw_payload?: Json | null
          result?: string | null
          strategy_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_events_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "user_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      upsells: {
        Row: {
          ativo: boolean | null
          checkout_url: string | null
          created_at: string | null
          descricao: string | null
          id: string
          is_recorrente: boolean | null
          nome: string
          preco_label: string | null
          tipo: string
          valor: number | null
        }
        Insert: {
          ativo?: boolean | null
          checkout_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_recorrente?: boolean | null
          nome: string
          preco_label?: string | null
          tipo: string
          valor?: number | null
        }
        Update: {
          ativo?: boolean | null
          checkout_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_recorrente?: boolean | null
          nome?: string
          preco_label?: string | null
          tipo?: string
          valor?: number | null
        }
        Relationships: []
      }
      user_access: {
        Row: {
          access_expires_at: string | null
          created_at: string
          granted_by: string | null
          notes: string | null
          plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          created_at?: string
          granted_by?: string | null
          notes?: string | null
          plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          created_at?: string
          granted_by?: string | null
          notes?: string | null
          plan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          earned_at: string
          equipped: boolean
          id: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          earned_at?: string
          equipped?: boolean
          id?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          earned_at?: string
          equipped?: boolean
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credentials: {
        Row: {
          casatrade_email: string
          casatrade_password: string
          casatrade_ssid: string | null
          casatrade_token: string | null
          casatrade_user_id: number | null
          created_at: string | null
          id: string
        }
        Insert: {
          casatrade_email: string
          casatrade_password: string
          casatrade_ssid?: string | null
          casatrade_token?: string | null
          casatrade_user_id?: number | null
          created_at?: string | null
          id: string
        }
        Update: {
          casatrade_email?: string
          casatrade_password?: string
          casatrade_ssid?: string | null
          casatrade_token?: string | null
          casatrade_user_id?: number | null
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      user_demo_state: {
        Row: {
          scenario: string | null
          sessions_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          scenario?: string | null
          sessions_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          scenario?: string | null
          sessions_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          completed_at: string | null
          id: string
          mission_id: string
          progress: number
          reset_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          mission_id: string
          progress?: number
          reset_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          mission_id?: string
          progress?: number
          reset_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_operations: {
        Row: {
          ai_model: string | null
          close_ts: number | null
          created_at: string | null
          direction: string | null
          expiracao_seg: number | null
          id: string
          invest: number | null
          open_ts: number | null
          payout: number | null
          pnl: number | null
          result: string | null
          session_id: number | null
          strategy_id: string | null
          symbol: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          close_ts?: number | null
          created_at?: string | null
          direction?: string | null
          expiracao_seg?: number | null
          id?: string
          invest?: number | null
          open_ts?: number | null
          payout?: number | null
          pnl?: number | null
          result?: string | null
          session_id?: number | null
          strategy_id?: string | null
          symbol?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          close_ts?: number | null
          created_at?: string | null
          direction?: string | null
          expiracao_seg?: number | null
          id?: string
          invest?: number | null
          open_ts?: number | null
          payout?: number | null
          pnl?: number | null
          result?: string | null
          session_id?: number | null
          strategy_id?: string | null
          symbol?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_operations_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "user_strategies"
            referencedColumns: ["id"]
          },
        ]
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
      user_strategies: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cakto_order_id: string | null
          cakto_subscription_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_lifetime: boolean | null
          plan_id: string
          starts_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cakto_order_id?: string | null
          cakto_subscription_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_lifetime?: boolean | null
          plan_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cakto_order_id?: string | null
          cakto_subscription_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_lifetime?: boolean | null
          plan_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_upsells: {
        Row: {
          cakto_order_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          status: string
          upsell_id: string
          user_id: string
        }
        Insert: {
          cakto_order_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          status?: string
          upsell_id: string
          user_id: string
        }
        Update: {
          cakto_order_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          status?: string
          upsell_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_upsells_upsell_id_fkey"
            columns: ["upsell_id"]
            isOneToOne: false
            referencedRelation: "upsells"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp: {
        Row: {
          created_at: string
          current_rank: string
          display_name: string | null
          id: string
          last_login_date: string | null
          level: number
          score: number
          season_id: string
          season_xp: number
          streak_days: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_rank?: string
          display_name?: string | null
          id?: string
          last_login_date?: string | null
          level?: number
          score?: number
          season_id?: string
          season_xp?: number
          streak_days?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_rank?: string
          display_name?: string | null
          id?: string
          last_login_date?: string | null
          level?: number
          score?: number
          season_id?: string
          season_xp?: number
          streak_days?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_crm_report: {
        Args: never
        Returns: {
          access_expires_at: string
          aulas_assistidas: number
          birth_date: string
          casatrade_user_id: string
          created_at: string
          current_balance: number
          current_rank: string
          deposit_count: number
          display_name: string
          email: string
          ftd_amount: number
          ftd_date: string
          genero: string
          last_sign_in_at: string
          plan: string
          streak_days: number
          total_deposited: number
          total_xp: number
          user_id: string
          whatsapp: string
          ws_deposit_count: number
          ws_ftd_amount: number
          ws_ftd_date: string
          ws_total_deposited: number
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          last_sign_in_at: string
          user_id: string
        }[]
      }
      admin_ops_cross_check: {
        Args: never
        Returns: {
          direction: string
          op_user_id: string
          status: string
          symbol: string
          te_happened_at: string
          te_pnl: number
          te_result: string
          uo_open_at: string
          uo_pnl: number
          uo_result: string
        }[]
      }
      admin_upsert_casatrade: { Args: { rows: Json }; Returns: number }
      admin_user_stats: {
        Args: never
        Returns: {
          active_7d: number
          total_users: number
        }[]
      }
      award_score: {
        Args: { p_delta: number; p_source: string; p_user_id: string }
        Returns: {
          new_rank: string
          new_score: number
        }[]
      }
      award_xp: {
        Args: {
          p_amount: number
          p_description: string
          p_source: string
          p_user_id: string
        }
        Returns: {
          new_level: number
          new_rank: string
          new_season_xp: number
          new_total_xp: number
        }[]
      }
      calculate_level: { Args: { p_xp: number }; Returns: number }
      calculate_rank: { Args: { p_score: number }; Returns: string }
      claim_activation_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      get_activation_code_by_order: {
        Args: { p_order_id: string }
        Returns: string
      }
      get_user_courses: {
        Args: { p_user_id: string }
        Returns: {
          description: string
          id: string
          ordem: number
          panda_video_id: string
          thumbnail_url: string
          title: string
        }[]
      }
      get_user_id_by_email: { Args: { p_email: string }; Returns: string }
      get_user_plan: {
        Args: { p_user_id: string }
        Returns: {
          expires_at: string
          is_recorrente: boolean
          is_vitalicio: boolean
          max_estrategias: number
          plan_nome: string
          plan_slug: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_casatrade_deposit: {
        Args: {
          p_amount: number
          p_event: string
          p_event_id: string
          p_received_at: string
          p_trader_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
