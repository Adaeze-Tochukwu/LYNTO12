// User types
export type UserRole = 'manager' | 'carer' | 'admin'
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended'
export type AdminRole = 'primary_admin' | 'admin' | 'readonly_admin'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  status: UserStatus
  agencyId: string
  createdAt: string
}

export interface Manager extends User {
  role: 'manager'
}

export interface Carer extends User {
  role: 'carer'
  assignedClientIds: string[]
  deactivationReason?: CarerDeactivationReason
  deactivatedAt?: string
}

export type CarerDeactivationReason =
  | 'left_organisation'
  | 'on_long_term_leave'
  | 'internal_decision'

// Agency
export interface Agency {
  id: string
  name: string
  createdAt: string
  managerId: string
}

// Client
export type ClientStatus = 'active' | 'inactive'

export type ClientDeactivationReason =
  | 'moved_to_another_provider'
  | 'deceased'
  | 'no_longer_receiving_service'
  | 'other'

export interface Client {
  id: string
  displayName: string
  internalReference?: string
  agencyId: string
  status: ClientStatus
  deactivationReason?: ClientDeactivationReason
  deactivationNote?: string
  deactivatedAt?: string
  createdAt: string
}

// Symptoms - organized by category
export interface SymptomCategory {
  id: string
  name: string
  symptoms: Symptom[]
}

export interface Symptom {
  id: string
  label: string
  points: number
}

// Vitals
export interface Vitals {
  temperature?: number
  pulse?: number
  systolicBp?: number
  diastolicBp?: number
  oxygenSaturation?: number
  respiratoryRate?: number
}

// Risk levels
export type RiskLevel = 'green' | 'amber' | 'red'

// Visit Entry
export interface VisitEntry {
  id: string
  clientId: string
  carerId: string
  agencyId: string
  selectedSymptomIds: string[]
  vitals: Vitals
  note: string
  score: number
  riskLevel: RiskLevel
  reasons: string[]
  createdAt: string
  correctionNotes?: CorrectionNote[]
}

export interface CorrectionNote {
  id: string
  text: string
  carerId: string
  createdAt: string
}

// Alert
export type AlertActionTaken =
  | 'monitor'
  | 'called_family'
  | 'informed_gp'
  | 'community_nurse'
  | 'emergency_escalation'

export interface Alert {
  id: string
  visitEntryId: string
  clientId: string
  carerId: string
  agencyId: string
  riskLevel: 'amber' | 'red'
  isReviewed: boolean
  reviewedBy?: string
  reviewedAt?: string
  actionTaken?: AlertActionTaken
  managerNote?: string
  createdAt: string
}

// Filter types for alerts dashboard
export type AlertFilter = 'unreviewed' | 'reviewed' | 'amber' | 'red' | 'all'

// Form state for multi-step visit entry
export interface VisitFormState {
  currentStep: number
  selectedSymptoms: Set<string>
  vitals: Vitals
  note: string
}

// Platform Admin types
export interface PlatformAdmin {
  id: string
  email: string
  fullName: string
  role: 'admin'
  adminRole: AdminRole
  status: UserStatus
  createdAt: string
  lastLoginAt?: string
  deactivatedAt?: string
  deactivationReason?: string
}

// Agency status for admin view
export type AgencyStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'rejected'

// Extended Agency for admin view
export interface AgencyWithStats extends Agency {
  status: AgencyStatus
  contactEmail: string
  contactName: string
  totalCarers: number
  activeCarers: number
  totalClients: number
  activeClients: number
  totalAlerts: number
  unreviewedAlerts: number
  lastActivityAt?: string
  notes?: string
  rejectionReason?: string
}

// Activity log types
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

export interface ActivityLogEntry {
  id: string
  eventType: ActivityEventType
  agencyId?: string
  agencyName?: string
  entityId?: string
  entityName?: string
  performedBy: string
  performedByName: string
  reason?: string
  timestamp: string
}
