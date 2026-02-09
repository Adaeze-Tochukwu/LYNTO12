// Converters between database format (snake_case) and frontend format (camelCase)

import type {
  User,
  Agency,
  Client,
  Carer,
  VisitEntry,
  Alert,
  CorrectionNote,
  PlatformAdmin,
  AgencyWithStats,
  ActivityLogEntry,
  Vitals,
} from '@/types'
import type {
  User as DbUser,
  Agency as DbAgency,
  Client as DbClient,
  VisitEntry as DbVisitEntry,
  Alert as DbAlert,
  CorrectionNote as DbCorrectionNote,
  PlatformAdmin as DbPlatformAdmin,
  AgencyStats as DbAgencyStats,
  ActivityLog as DbActivityLog,
} from './database.types'

// User converter
export function dbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name,
    role: dbUser.role,
    status: dbUser.status,
    agencyId: dbUser.agency_id,
    createdAt: dbUser.created_at,
  }
}

export function dbUserToCarer(dbUser: DbUser, assignedClientIds: string[]): Carer {
  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name,
    role: 'carer',
    status: dbUser.status,
    agencyId: dbUser.agency_id,
    createdAt: dbUser.created_at,
    assignedClientIds,
    deactivationReason: dbUser.deactivation_reason || undefined,
    deactivatedAt: dbUser.deactivated_at || undefined,
  }
}

// Agency converter
export function dbAgencyToAgency(dbAgency: DbAgency): Agency {
  return {
    id: dbAgency.id,
    name: dbAgency.name,
    createdAt: dbAgency.created_at,
    managerId: dbAgency.manager_id || '',
  }
}

// Client converter
export function dbClientToClient(dbClient: DbClient): Client {
  return {
    id: dbClient.id,
    displayName: dbClient.display_name,
    internalReference: dbClient.internal_reference || undefined,
    agencyId: dbClient.agency_id,
    status: dbClient.status,
    deactivationReason: dbClient.deactivation_reason || undefined,
    deactivationNote: dbClient.deactivation_note || undefined,
    deactivatedAt: dbClient.deactivated_at || undefined,
    createdAt: dbClient.created_at,
  }
}

// Visit Entry converter
export function dbVisitEntryToVisitEntry(
  dbVisit: DbVisitEntry,
  correctionNotes?: DbCorrectionNote[]
): VisitEntry {
  const vitals: Vitals = {}
  if (dbVisit.temperature !== null) vitals.temperature = dbVisit.temperature
  if (dbVisit.pulse !== null) vitals.pulse = dbVisit.pulse
  if (dbVisit.systolic_bp !== null) vitals.systolicBp = dbVisit.systolic_bp
  if (dbVisit.diastolic_bp !== null) vitals.diastolicBp = dbVisit.diastolic_bp
  if (dbVisit.oxygen_saturation !== null) vitals.oxygenSaturation = dbVisit.oxygen_saturation
  if (dbVisit.respiratory_rate !== null) vitals.respiratoryRate = dbVisit.respiratory_rate

  return {
    id: dbVisit.id,
    clientId: dbVisit.client_id,
    carerId: dbVisit.carer_id,
    agencyId: dbVisit.agency_id,
    selectedSymptomIds: dbVisit.selected_symptom_ids,
    vitals,
    note: dbVisit.note || '',
    score: dbVisit.score,
    riskLevel: dbVisit.risk_level,
    reasons: dbVisit.reasons,
    createdAt: dbVisit.created_at,
    correctionNotes: correctionNotes?.map(dbCorrectionNoteToCorrectionNote),
  }
}

// Correction Note converter
export function dbCorrectionNoteToCorrectionNote(dbNote: DbCorrectionNote): CorrectionNote {
  return {
    id: dbNote.id,
    text: dbNote.text,
    carerId: dbNote.carer_id,
    createdAt: dbNote.created_at,
  }
}

// Alert converter
export function dbAlertToAlert(dbAlert: DbAlert): Alert {
  return {
    id: dbAlert.id,
    visitEntryId: dbAlert.visit_entry_id,
    clientId: dbAlert.client_id,
    carerId: dbAlert.carer_id,
    agencyId: dbAlert.agency_id,
    riskLevel: dbAlert.risk_level as 'amber' | 'red',
    isReviewed: dbAlert.is_reviewed,
    reviewedBy: dbAlert.reviewed_by || undefined,
    reviewedAt: dbAlert.reviewed_at || undefined,
    actionTaken: dbAlert.action_taken || undefined,
    managerNote: dbAlert.manager_note || undefined,
    createdAt: dbAlert.created_at,
  }
}

// Platform Admin converter
export function dbPlatformAdminToPlatformAdmin(dbAdmin: DbPlatformAdmin): PlatformAdmin {
  return {
    id: dbAdmin.id,
    email: dbAdmin.email,
    fullName: dbAdmin.full_name,
    role: 'admin',
    adminRole: dbAdmin.admin_role,
    status: dbAdmin.status,
    createdAt: dbAdmin.created_at,
    lastLoginAt: dbAdmin.last_login_at || undefined,
    deactivatedAt: dbAdmin.deactivated_at || undefined,
    deactivationReason: dbAdmin.deactivation_reason || undefined,
  }
}

// Agency Stats converter (from agency_stats view)
export function dbAgencyStatsToAgencyWithStats(dbStats: DbAgencyStats): AgencyWithStats {
  return {
    id: dbStats.id,
    name: dbStats.name,
    createdAt: dbStats.created_at,
    managerId: '',
    status: dbStats.status,
    contactEmail: dbStats.contact_email || '',
    contactName: dbStats.contact_name || '',
    totalCarers: dbStats.total_carers,
    activeCarers: dbStats.active_carers,
    totalClients: dbStats.total_clients,
    activeClients: dbStats.active_clients,
    totalAlerts: dbStats.total_alerts,
    unreviewedAlerts: dbStats.unreviewed_alerts,
    lastActivityAt: dbStats.last_activity_at || undefined,
  }
}

// Activity Log converter
export function dbActivityLogToActivityLogEntry(dbLog: DbActivityLog): ActivityLogEntry {
  return {
    id: dbLog.id,
    eventType: dbLog.event_type,
    agencyId: dbLog.agency_id || undefined,
    agencyName: dbLog.agency_name || undefined,
    entityId: dbLog.entity_id || undefined,
    entityName: dbLog.entity_name || undefined,
    performedBy: dbLog.performed_by,
    performedByName: dbLog.performed_by_name,
    reason: dbLog.reason || undefined,
    timestamp: dbLog.timestamp,
  }
}
