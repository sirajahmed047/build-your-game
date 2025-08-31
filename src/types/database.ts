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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      choice_aggregates: {
        Row: {
          choice_slug: string
          genre: string
          impressions: number | null
          option_id: string
          selections: number | null
        }
        Insert: {
          choice_slug: string
          genre: string
          impressions?: number | null
          option_id: string
          selections?: number | null
        }
        Update: {
          choice_slug?: string
          genre?: string
          impressions?: number | null
          option_id?: string
          selections?: number | null
        }
        Relationships: []
      }
      cost_tracking: {
        Row: {
          created_at: string | null
          estimated_cost: number
          genre: string
          id: string
          request_type: string
          session_id: string | null
          tokens_used: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_cost: number
          genre: string
          id?: string
          request_type: string
          session_id?: string | null
          tokens_used: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_cost?: number
          genre?: string
          id?: string
          request_type?: string
          session_id?: string | null
          tokens_used?: number
          user_id?: string | null
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          created_at: string | null
          end_time: string
          error_message: string | null
          id: string
          job_name: string
          row_count: number | null
          start_time: string
          status: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          error_message?: string | null
          id?: string
          job_name: string
          row_count?: number | null
          start_time: string
          status: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          error_message?: string | null
          id?: string
          job_name?: string
          row_count?: number | null
          start_time?: string
          status?: string
        }
        Relationships: []
      }
      ending_catalog: {
        Row: {
          description: string | null
          ending_tag: string
          genre: string
          title: string | null
        }
        Insert: {
          description?: string | null
          ending_tag: string
          genre: string
          title?: string | null
        }
        Update: {
          description?: string | null
          ending_tag?: string
          genre?: string
          title?: string | null
        }
        Relationships: []
      }
      global_rate_limits: {
        Row: {
          created_at: string | null
          hour: string
          requests_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hour: string
          requests_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hour?: string
          requests_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          date: string
          id: string
          identifier: string
          is_guest: boolean | null
          requests_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          identifier: string
          is_guest?: boolean | null
          requests_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          identifier?: string
          is_guest?: boolean | null
          requests_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      story_runs: {
        Row: {
          challenge: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          ending_rarity: string | null
          ending_tag: string | null
          ending_title: string | null
          genre: string
          id: string
          length: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          challenge: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          ending_rarity?: string | null
          ending_tag?: string | null
          ending_title?: string | null
          genre: string
          id?: string
          length: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          challenge?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          ending_rarity?: string | null
          ending_tag?: string | null
          ending_title?: string | null
          genre?: string
          id?: string
          length?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      story_steps: {
        Row: {
          choice_slug: string | null
          choices: Json
          created_at: string | null
          decision_key_hash: string | null
          game_state: Json | null
          id: string
          selected_choice_id: string | null
          step_number: number
          story_run_id: string
          story_text: string
          trait_empathy: number | null
          trait_risk: number | null
          traits_snapshot: Json | null
        }
        Insert: {
          choice_slug?: string | null
          choices: Json
          created_at?: string | null
          decision_key_hash?: string | null
          game_state?: Json | null
          id?: string
          selected_choice_id?: string | null
          step_number: number
          story_run_id: string
          story_text: string
          trait_empathy?: number | null
          trait_risk?: number | null
          traits_snapshot?: Json | null
        }
        Update: {
          choice_slug?: string | null
          choices?: Json
          created_at?: string | null
          decision_key_hash?: string | null
          game_state?: Json | null
          id?: string
          selected_choice_id?: string | null
          step_number?: number
          story_run_id?: string
          story_text?: string
          trait_empathy?: number | null
          trait_risk?: number | null
          traits_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "story_steps_story_run_id_fkey"
            columns: ["story_run_id"]
            isOneToOne: false
            referencedRelation: "story_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      token_usage_logs: {
        Row: {
          created_at: string | null
          genre: string
          id: string
          request_type: string
          session_id: string | null
          tokens_used: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          genre: string
          id?: string
          request_type: string
          session_id?: string | null
          tokens_used: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          genre?: string
          id?: string
          request_type?: string
          session_id?: string | null
          tokens_used?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          personality_traits: Json | null
          subscription_tier: string | null
          total_choices: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          personality_traits?: Json | null
          subscription_tier?: string | null
          total_choices?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          personality_traits?: Json | null
          subscription_tier?: string | null
          total_choices?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_events: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          event_type: string
          event_data: Json | null
          page_url: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_type: string
          event_data?: Json | null
          page_url?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_type?: string
          event_data?: Json | null
          page_url?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string | null
          session_id: string
          started_at: string | null
          last_activity_at: string | null
          ended_at: string | null
          total_duration_seconds: number | null
          page_views: number | null
          events_count: number | null
          device_type: string | null
          browser: string | null
          os: string | null
          country: string | null
          referrer: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id: string
          started_at?: string | null
          last_activity_at?: string | null
          ended_at?: string | null
          total_duration_seconds?: number | null
          page_views?: number | null
          events_count?: number | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          country?: string | null
          referrer?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string
          started_at?: string | null
          last_activity_at?: string | null
          ended_at?: string | null
          total_duration_seconds?: number | null
          page_views?: number | null
          events_count?: number | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          country?: string | null
          referrer?: string | null
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          date: string
          total_users: number | null
          new_users: number | null
          returning_users: number | null
          guest_users: number | null
          total_sessions: number | null
          total_story_starts: number | null
          total_story_completions: number | null
          total_choices_made: number | null
          avg_session_duration_seconds: number | null
          bounce_rate: number | null
          conversion_rate: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          date: string
          total_users?: number | null
          new_users?: number | null
          returning_users?: number | null
          guest_users?: number | null
          total_sessions?: number | null
          total_story_starts?: number | null
          total_story_completions?: number | null
          total_choices_made?: number | null
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          date?: string
          total_users?: number | null
          new_users?: number | null
          returning_users?: number | null
          guest_users?: number | null
          total_sessions?: number | null
          total_story_starts?: number | null
          total_story_completions?: number | null
          total_choices_made?: number | null
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      retention_cohorts: {
        Row: {
          cohort_date: string
          period_number: number
          users_count: number | null
          retention_rate: number | null
        }
        Insert: {
          cohort_date: string
          period_number: number
          users_count?: number | null
          retention_rate?: number | null
        }
        Update: {
          cohort_date?: string
          period_number?: number
          users_count?: number | null
          retention_rate?: number | null
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          feature_name: string
          usage_count: number | null
          first_used_at: string | null
          last_used_at: string | null
          total_time_spent_seconds: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          feature_name: string
          usage_count?: number | null
          first_used_at?: string | null
          last_used_at?: string | null
          total_time_spent_seconds?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          feature_name?: string
          usage_count?: number | null
          first_used_at?: string | null
          last_used_at?: string | null
          total_time_spent_seconds?: number | null
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          from_tier: string | null
          to_tier: string | null
          revenue_amount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          from_tier?: string | null
          to_tier?: string | null
          revenue_amount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          from_tier?: string | null
          to_tier?: string | null
          revenue_amount?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      choice_statistics: {
        Row: {
          choice_slug: string | null
          genre: string | null
          impressions: number | null
          option_id: string | null
          percentage: number | null
          rarity_level: string | null
          selections: number | null
        }
        Insert: {
          choice_slug?: string | null
          genre?: string | null
          impressions?: number | null
          option_id?: string | null
          percentage?: never
          rarity_level?: never
          selections?: number | null
        }
        Update: {
          choice_slug?: string | null
          genre?: string | null
          impressions?: number | null
          option_id?: string | null
          percentage?: never
          rarity_level?: never
          selections?: number | null
        }
        Relationships: []
      }
      choice_statistics_cached: {
        Row: {
          choice_slug: string | null
          genre: string | null
          impressions: number | null
          option_id: string | null
          percentage: number | null
          rarity_level: string | null
          selections: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_cron_job_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_choice_statistics_job_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_duration_seconds: number
          current_row_count: number
          error_count_24h: number
          last_error: string
          last_success: string
          success_count_24h: number
        }[]
      }
      get_ending_statistics: {
        Args: { p_ending_tag?: string }
        Returns: {
          description: string
          discovery_rate: number
          ending_tag: string
          genre: string
          title: string
          total_discoveries: number
          unique_discoverers: number
        }[]
      }
      get_rate_limit_status: {
        Args: { user_identifier: string }
        Returns: {
          daily_limit: number
          is_premium: boolean
          remaining_requests: number
          requests_today: number
        }[]
      }
      increment_choice_impressions: {
        Args: { p_choice_slug: string; p_genre: string; p_option_id: string }
        Returns: undefined
      }
      increment_choice_selections: {
        Args: { p_choice_slug: string; p_genre: string; p_option_id: string }
        Returns: undefined
      }
      increment_user_choice_count: {
        Args: { user_id: string }
        Returns: undefined
      }
      refresh_choice_statistics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_choice_statistics_with_monitoring: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_config: {
        Args: {
          is_local?: boolean
          setting_name: string
          setting_value: string
        }
        Returns: string
      }
      track_user_event: {
        Args: {
          p_user_id: string | null
          p_session_id: string
          p_event_type: string
          p_event_data?: Json
          p_page_url?: string | null
          p_user_agent?: string | null
        }
        Returns: string
      }
      start_user_session: {
        Args: {
          p_user_id: string | null
          p_session_id: string
          p_device_type?: string | null
          p_browser?: string | null
          p_os?: string | null
          p_country?: string | null
          p_referrer?: string | null
        }
        Returns: string
      }
      end_user_session: {
        Args: {
          p_session_id: string
        }
        Returns: undefined
      }
      calculate_daily_metrics: {
        Args: {
          target_date?: string
        }
        Returns: undefined
      }
      calculate_retention_cohorts: {
        Args: {
          cohort_start_date?: string
        }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
