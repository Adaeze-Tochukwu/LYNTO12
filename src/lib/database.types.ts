// Database types for Supabase
// These match the schema defined in supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'manager' | 'carer' | 'admin'
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended'
export type AdminRole = 'primary_admin' | 'admin' | 'readonly_admin'
export type AgencyStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type ClientStatus = 'active' | 'inactive'
export type RiskLevel = 'green' | 'amber' | 'red'
export type AlertAction = 'monitor' | 'called_family' | 'informed_gp' | 'community_nurse' | 'emergency_escalation'
export type CarerDeactivationReason = 'left_organisation' | 'on_long_term_leave' | 'internal_decision'
export type ClientDeactivationReason = 'moved_to_another_provider' | 'deceased' | 'no_longer_receiving_service' | 'other'
export type ActivityEventType =
  | 'agency_created'
  | 'agency_status_changed'
  | 'carer_created'
  | 'carer_deactivated'
  | 'carer_reactivated'
  | 'client_created'
  | 'client_deactivated'
  | 'client_reactivated'
  | 'admin_created'
  | 'admin_deactivated'
  | 'admin_reactivated'
  | 'admin_login'
  | 'admin_logout'

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string
          name: string
          status: AgencyStatus
          contact_email: string | null
          contact_name: string | null
          notes: string | null
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: AgencyStatus
          contact_email?: string | null
          contact_name?: string | null
          notes?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: AgencyStatus
          contact_email?: string | null
          contact_name?: string | null
          notes?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          full_name: string
          role: UserRole
          status: UserStatus
          agency_id: string
          deactivation_reason: CarerDeactivationReason | null
          deactivated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          email: string
          full_name: string
          role: UserRole
          status?: UserStatus
          agency_id: string
          deactivation_reason?: CarerDeactivationReason | null
          deactivated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          email?: string
          full_name?: string
          role?: UserRole
          status?: UserStatus
          agency_id?: string
          deactivation_reason?: CarerDeactivationReason | null
          deactivated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          full_name: string
          admin_role: AdminRole
          status: UserStatus
          deactivation_reason: string | null
          deactivated_at: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          email: string
          full_name: string
          admin_role?: AdminRole
          status?: UserStatus
          deactivation_reason?: string | null
          deactivated_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          email?: string
          full_name?: string
          admin_role?: AdminRole
          status?: UserStatus
          deactivation_reason?: string | null
          deactivated_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          display_name: string
          internal_reference: string | null
          agency_id: string
          status: ClientStatus
          deactivation_reason: ClientDeactivationReason | null
          deactivation_note: string | null
          deactivated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_name: string
          internal_reference?: string | null
          agency_id: string
          status?: ClientStatus
          deactivation_reason?: ClientDeactivationReason | null
          deactivation_note?: string | null
          deactivated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          internal_reference?: string | null
          agency_id?: string
          status?: ClientStatus
          deactivation_reason?: ClientDeactivationReason | null
          deactivation_note?: string | null
          deactivated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      carer_client_assignments: {
        Row: {
          id: string
          carer_id: string
          client_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          carer_id: string
          client_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          carer_id?: string
          client_id?: string
          assigned_at?: string
        }
        Relationships: []
      }
      visit_entries: {
        Row: {
          id: string
          client_id: string
          carer_id: string
          agency_id: string
          selected_symptom_ids: string[]
          temperature: number | null
          pulse: number | null
          systolic_bp: number | null
          diastolic_bp: number | null
          oxygen_saturation: number | null
          respiratory_rate: number | null
          note: string | null
          score: number
          risk_level: RiskLevel
          reasons: string[]
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          carer_id: string
          agency_id: string
          selected_symptom_ids?: string[]
          temperature?: number | null
          pulse?: number | null
          systolic_bp?: number | null
          diastolic_bp?: number | null
          oxygen_saturation?: number | null
          respiratory_rate?: number | null
          note?: string | null
          score?: number
          risk_level?: RiskLevel
          reasons?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          carer_id?: string
          agency_id?: string
          selected_symptom_ids?: string[]
          temperature?: number | null
          pulse?: number | null
          systolic_bp?: number | null
          diastolic_bp?: number | null
          oxygen_saturation?: number | null
          respiratory_rate?: number | null
          note?: string | null
          score?: number
          risk_level?: RiskLevel
          reasons?: string[]
          created_at?: string
        }
        Relationships: []
      }
      correction_notes: {
        Row: {
          id: string
          visit_entry_id: string
          carer_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          visit_entry_id: string
          carer_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          visit_entry_id?: string
          carer_id?: string
          text?: string
          created_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          id: string
          visit_entry_id: string
          client_id: string
          carer_id: string
          agency_id: string
          risk_level: RiskLevel
          is_reviewed: boolean
          reviewed_by: string | null
          reviewed_at: string | null
          action_taken: AlertAction | null
          manager_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          visit_entry_id: string
          client_id: string
          carer_id: string
          agency_id: string
          risk_level: RiskLevel
          is_reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          action_taken?: AlertAction | null
          manager_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          visit_entry_id?: string
          client_id?: string
          carer_id?: string
          agency_id?: string
          risk_level?: RiskLevel
          is_reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          action_taken?: AlertAction | null
          manager_note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          event_type: ActivityEventType
          agency_id: string | null
          agency_name: string | null
          entity_id: string | null
          entity_name: string | null
          performed_by: string
          performed_by_name: string
          reason: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          event_type: ActivityEventType
          agency_id?: string | null
          agency_name?: string | null
          entity_id?: string | null
          entity_name?: string | null
          performed_by: string
          performed_by_name: string
          reason?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          event_type?: ActivityEventType
          agency_id?: string | null
          agency_name?: string | null
          entity_id?: string | null
          entity_name?: string | null
          performed_by?: string
          performed_by_name?: string
          reason?: string | null
          timestamp?: string
        }
        Relationships: []
      }
    }
    Views: {
      agency_stats: {
        Row: {
          id: string
          name: string
          status: AgencyStatus
          contact_email: string | null
          contact_name: string | null
          created_at: string
          total_carers: number
          active_carers: number
          total_clients: number
          active_clients: number
          total_alerts: number
          unreviewed_alerts: number
          last_activity_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      admin_role: AdminRole
      agency_status: AgencyStatus
      client_status: ClientStatus
      risk_level: RiskLevel
      alert_action: AlertAction
      carer_deactivation_reason: CarerDeactivationReason
      client_deactivation_reason: ClientDeactivationReason
      activity_event_type: ActivityEventType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Agency = Database['public']['Tables']['agencies']['Row']
export type AgencyInsert = Database['public']['Tables']['agencies']['Insert']
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type PlatformAdmin = Database['public']['Tables']['platform_admins']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type VisitEntry = Database['public']['Tables']['visit_entries']['Row']
export type VisitEntryInsert = Database['public']['Tables']['visit_entries']['Insert']
export type Alert = Database['public']['Tables']['alerts']['Row']
export type AlertUpdate = Database['public']['Tables']['alerts']['Update']
export type CorrectionNote = Database['public']['Tables']['correction_notes']['Row']
export type CarerClientAssignment = Database['public']['Tables']['carer_client_assignments']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']
export type AgencyStats = Database['public']['Views']['agency_stats']['Row']
