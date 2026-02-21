// Converters: DB row (snake_case) → Frontend type (camelCase)

import type {
  Agency,
  AgencyWithStats,
  PlatformAdmin,
  User,
  Manager,
  Carer,
  Client,
  VisitEntry,
  CorrectionNote,
  Alert,
  ActivityLogEntry,
  Vitals,
} from '@/types'
import type {
  DbAgencyStats,
  DbPlatformAdmin,
  DbUser,
  DbClient,
  DbVisitEntry,
  DbCorrectionNote,
  DbAlert,
  DbActivityLog,
  DbAgency,
} from './database.types'

export function dbAgencyToAgency(row: DbAgency): Agency {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    managerId: '', // Will be set separately if needed
  }
}

export function dbAgencyStatsToAgencyWithStats(row: DbAgencyStats): AgencyWithStats {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    managerId: row.manager_id || '',
    status: row.status,
    contactEmail: row.contact_email || '',
    contactName: row.contact_name || '',
    totalCarers: Number(row.total_carers) || 0,
    activeCarers: Number(row.active_carers) || 0,
    totalClients: Number(row.total_clients) || 0,
    activeClients: Number(row.active_clients) || 0,
    totalAlerts: Number(row.total_alerts) || 0,
    unreviewedAlerts: Number(row.unreviewed_alerts) || 0,
    lastActivityAt: row.last_activity_at || undefined,
    notes: row.notes || undefined,
    rejectionReason: row.rejection_reason || undefined,
  }
}

export function dbPlatformAdminToPlatformAdmin(row: DbPlatformAdmin): PlatformAdmin {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: 'admin',
    adminRole: row.admin_role,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined,
    deactivatedAt: row.deactivated_at || undefined,
    deactivationReason: row.deactivation_reason || undefined,
  }
}

export function dbUserToUser(row: DbUser): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    agencyId: row.agency_id,
    createdAt: row.created_at,
  }
}

export function dbUserToManager(row: DbUser): Manager {
  return {
    ...dbUserToUser(row),
    role: 'manager' as const,
  }
}

export function dbUserToCarer(row: DbUser, assignedClientIds: string[]): Carer {
  return {
    ...dbUserToUser(row),
    role: 'carer' as const,
    assignedClientIds,
    deactivationReason: row.deactivation_reason || undefined,
    deactivatedAt: row.deactivated_at || undefined,
  }
}

export function dbClientToClient(row: DbClient): Client {
  return {
    id: row.id,
    displayName: row.display_name,
    internalReference: row.internal_reference || undefined,
    agencyId: row.agency_id,
    status: row.status,
    deactivationReason: row.deactivation_reason || undefined,
    deactivationNote: row.deactivation_note || undefined,
    deactivatedAt: row.deactivated_at || undefined,
    createdAt: row.created_at,
  }
}

export function dbVisitEntryToVisitEntry(
  row: DbVisitEntry,
  correctionNotes?: CorrectionNote[]
): VisitEntry {
  const vitals: Vitals = {}
  if (row.vitals) {
    const v = row.vitals as Record<string, number | undefined>
    vitals.temperature = v.temperature
    vitals.pulse = v.pulse
    vitals.systolicBp = v.systolic_bp ?? v.systolicBp
    vitals.diastolicBp = v.diastolic_bp ?? v.diastolicBp
    vitals.oxygenSaturation = v.oxygen_saturation ?? v.oxygenSaturation
    vitals.respiratoryRate = v.respiratory_rate ?? v.respiratoryRate
  }

  return {
    id: row.id,
    clientId: row.client_id,
    carerId: row.carer_id,
    agencyId: row.agency_id,
    selectedSymptomIds: row.selected_symptom_ids || [],
    vitals,
    note: row.note,
    score: row.score,
    riskLevel: row.risk_level,
    reasons: row.reasons || [],
    createdAt: row.created_at,
    correctionNotes,
  }
}

export function dbCorrectionNoteToCorrectionNote(row: DbCorrectionNote): CorrectionNote {
  return {
    id: row.id,
    text: row.text,
    carerId: row.carer_id,
    createdAt: row.created_at,
  }
}

export function dbAlertToAlert(row: DbAlert): Alert {
  return {
    id: row.id,
    visitEntryId: row.visit_entry_id,
    clientId: row.client_id,
    carerId: row.carer_id,
    agencyId: row.agency_id,
    riskLevel: row.risk_level,
    isReviewed: row.is_reviewed,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    actionTaken: row.action_taken || undefined,
    managerNote: row.manager_note || undefined,
    createdAt: row.created_at,
  }
}

export function dbActivityLogToActivityLogEntry(row: DbActivityLog): ActivityLogEntry {
  return {
    id: row.id,
    eventType: row.event_type as ActivityLogEntry['eventType'],
    agencyId: row.agency_id || undefined,
    agencyName: row.agency_name || undefined,
    entityId: row.entity_id || undefined,
    entityName: row.entity_name || undefined,
    performedBy: row.performed_by,
    performedByName: row.performed_by_name,
    reason: row.reason || undefined,
    timestamp: row.timestamp,
  }
}

// Helper: convert frontend Vitals to DB format (snake_case for JSONB)
export function vitalsToDb(vitals: Vitals): Record<string, number | undefined> {
  return {
    temperature: vitals.temperature,
    pulse: vitals.pulse,
    systolic_bp: vitals.systolicBp,
    diastolic_bp: vitals.diastolicBp,
    oxygen_saturation: vitals.oxygenSaturation,
    respiratory_rate: vitals.respiratoryRate,
  }
}
