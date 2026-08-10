export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          aggregate_score: number
          guest_id: string | null
          default_seat_target: number
          link_validity_days: number
          observed_score: number
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          aggregate_score?: number
          guest_id?: string | null
          default_seat_target?: number
          link_validity_days?: number
          observed_score?: number
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
          aggregate_score?: number
          guest_id?: string | null
          default_seat_target?: number
          link_validity_days?: number
          observed_score?: number
        }
      }
      guest_sessions: {
        Row: {
          id: string
          guest_id: string
          org_id: string | null
          created_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          guest_id: string
          org_id?: string | null
          created_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          guest_id?: string
          org_id?: string | null
          created_at?: string
          last_seen_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          organization_id: string
          name: string
          target_seats: number
          aggregate_score: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          target_seats?: number
          aggregate_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          target_seats?: number
          aggregate_score?: number
          created_at?: string
        }
      }
      assessment_invites: {
        Row: {
          id: string
          team_id: string
          token: string
          title: string
          status: 'pending' | 'active' | 'completed' | 'expired'
          selected_scenario_id?: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          team_id: string
          token: string
          title?: string
          status?: 'pending' | 'active' | 'completed' | 'expired'
          selected_scenario_id?: string | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          token?: string
          title?: string
          status?: 'pending' | 'active' | 'completed' | 'expired'
          selected_scenario_id?: string | null
          created_at?: string
          expires_at?: string
        }
      }
      assessment_responses: {
        Row: {
          id: string
          team_id: string
          invite_id: string | null
          respondent_name: string
          respondent_role: string
          respondent_department: string | null
          tool_usage_score: number | null
          workflow_automation_score: number | null
          data_literacy_score: number | null
          output_evaluation_score: number | null
          leadership_buyin_score: number | null
          tech_coding_score: number | null
          tech_ml_concepts_score: number | null
          tech_infrastructure_score: number | null
          tech_observability_score: number | null
          tech_applied_practice_score: number | null
          tech_deployment_score: number | null
          tech_total_score: number | null
          individual_score: number
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          invite_id?: string | null
          respondent_name: string
          respondent_role: string
          respondent_department?: string | null
          tool_usage_score?: number | null
          workflow_automation_score?: number | null
          data_literacy_score?: number | null
          output_evaluation_score?: number | null
          leadership_buyin_score?: number | null
          tech_coding_score?: number | null
          tech_ml_concepts_score?: number | null
          tech_infrastructure_score?: number | null
          tech_observability_score?: number | null
          tech_applied_practice_score?: number | null
          tech_deployment_score?: number | null
          tech_total_score?: number | null
          individual_score: number
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          invite_id?: string | null
          respondent_name?: string
          respondent_role?: string
          respondent_department?: string | null
          tool_usage_score?: number | null
          workflow_automation_score?: number | null
          data_literacy_score?: number | null
          output_evaluation_score?: number | null
          leadership_buyin_score?: number | null
          tech_coding_score?: number | null
          tech_ml_concepts_score?: number | null
          tech_infrastructure_score?: number | null
          tech_observability_score?: number | null
          tech_applied_practice_score?: number | null
          tech_deployment_score?: number | null
          tech_total_score?: number | null
          individual_score?: number
          created_at?: string
        }
      }
      recommendation_rules: {
        Row: {
          id: string
          pillar: string
          threshold_max: number
          title: string
          description: string
          action_label: string
          action_url: string | null
        }
        Insert: {
          id?: string
          pillar: string
          threshold_max: number
          title: string
          description: string
          action_label?: string
          action_url?: string | null
        }
        Update: {
          id?: string
          pillar?: string
          threshold_max?: number
          title?: string
          description?: string
          action_label?: string
          action_url?: string | null
        }
      }
      assessment_templates: {
        Row: {
          id: string
          organization_id: string
          department_type: string
          schema_payload: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          department_type?: string
          schema_payload: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          department_type?: string
          schema_payload?: Json
          created_at?: string
          updated_at?: string
        }
      }
      mcp_integrations: {
        Row: {
          id: string
          organization_id: string
          provider: string
          status: 'connected' | 'disconnected' | 'syncing' | 'error'
          config: Json
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          provider: string
          status?: 'connected' | 'disconnected' | 'syncing' | 'error'
          config?: Json
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          provider?: string
          status?: 'connected' | 'disconnected' | 'syncing' | 'error'
          config?: Json
          last_synced_at?: string | null
          created_at?: string
        }
      }
      observed_telemetry: {
        Row: {
          id: string
          organization_id: string
          team_id: string | null
          provider: string
          metric_name: string
          observed_value: number
          normalized_score: number
          synced_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          team_id?: string | null
          provider: string
          metric_name: string
          observed_value: number
          normalized_score: number
          synced_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          team_id?: string | null
          provider?: string
          metric_name?: string
          observed_value?: number
          normalized_score?: number
          synced_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
