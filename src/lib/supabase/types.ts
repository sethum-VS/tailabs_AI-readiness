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
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          aggregate_score?: number
          guest_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
          aggregate_score?: number
          guest_id?: string | null
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
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          team_id: string
          token: string
          title?: string
          status?: 'pending' | 'active' | 'completed' | 'expired'
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          token?: string
          title?: string
          status?: 'pending' | 'active' | 'completed' | 'expired'
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
          tool_usage_score: number
          workflow_automation_score: number
          data_literacy_score: number
          output_evaluation_score: number
          leadership_buyin_score: number
          individual_score: number
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          invite_id?: string | null
          respondent_name: string
          respondent_role: string
          tool_usage_score: number
          workflow_automation_score: number
          data_literacy_score: number
          output_evaluation_score: number
          leadership_buyin_score: number
          individual_score: number
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          invite_id?: string | null
          respondent_name?: string
          respondent_role?: string
          tool_usage_score?: number
          workflow_automation_score?: number
          data_literacy_score?: number
          output_evaluation_score?: number
          leadership_buyin_score?: number
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
