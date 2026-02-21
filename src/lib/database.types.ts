// Database row types matching the Supabase schema (snake_case)

export interface DbAgency {
  id: string
  name: string
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'rejected'
  contact_email: string | null
  contact_name: string | null
  notes: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface DbPlatformAdmin {
  id: string
  email: string
  full_name: string
  admin_role: 'primary_admin' | 'admin' | 'readonly_admin'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  last_login_at: string | null
  deactivated_at: string | null
  deactivation_reason: string | null
  created_at: string
  updated_at: string
}

export interface DbUser {
  id: string
  email: string
  full_name: string
  role: 'manager' | 'carer'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  agency_id: string
  deactivation_reason: 'left_organisation' | 'on_long_term_leave' | 'internal_decision' | null
  deactivated_at: string | null
  created_at: string
  updated_at: string
}

export interface DbClient {
  id: string
  display_name: string
  internal_reference: string | null
  agency_id: string
  status: 'active' | 'inactive'
  deactivation_reason: 'moved_to_another_provider' | 'deceased' | 'no_longer_receiving_service' | 'other' | null
  deactivation_note: string | null
  deactivated_at: string | null
  created_at: string
  updated_at: string
}

export interface DbCarerClientAssignment {
  id: string
  carer_id: string
  client_id: string
  agency_id: string
  created_at: string
}

export interface DbVisitEntry {
  id: string
  client_id: string
  carer_id: string
  agency_id: string
  selected_symptom_ids: string[]
  vitals: Record<string, number | undefined>
  note: string
  score: number
  risk_level: 'green' | 'amber' | 'red'
  reasons: string[]
  created_at: string
}

export interface DbCorrectionNote {
  id: string
  visit_entry_id: string
  carer_id: string
  text: string
  created_at: string
}

export interface DbAlert {
  id: string
  visit_entry_id: string
  client_id: string
  carer_id: string
  agency_id: string
  risk_level: 'amber' | 'red'
  is_reviewed: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  action_taken: 'monitor' | 'called_family' | 'informed_gp' | 'community_nurse' | 'emergency_escalation' | null
  manager_note: string | null
  created_at: string
}

export interface DbActivityLog {
  id: string
  event_type: string
  agency_id: string | null
  agency_name: string | null
  entity_id: string | null
  entity_name: string | null
  performed_by: string
  performed_by_name: string
  reason: string | null
  timestamp: string
}

// Agency stats view row
export interface DbAgencyStats {
  id: string
  name: string
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'rejected'
  contact_email: string | null
  contact_name: string | null
  notes: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  manager_id: string | null
  total_carers: number
  active_carers: number
  total_clients: number
  active_clients: number
  total_alerts: number
  unreviewed_alerts: number
  last_activity_at: string | null
}
