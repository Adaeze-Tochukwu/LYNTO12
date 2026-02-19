import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  Client,
  Carer,
  VisitEntry,
  Alert,
  AlertActionTaken,
  Vitals,
  RiskLevel,
  ClientDeactivationReason,
  CarerDeactivationReason,
  CorrectionNote,
} from '@/types'
import { supabase, createFreshClient } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { getSymptomById } from '@/data/symptoms'
import {
  dbClientToClient,
  dbUserToCarer,
  dbVisitEntryToVisitEntry,
  dbCorrectionNoteToCorrectionNote,
  dbAlertToAlert,
  vitalsToDb,
} from '@/lib/converters'
import type { DbClient, DbUser, DbVisitEntry, DbCorrectionNote, DbAlert, DbCarerClientAssignment } from '@/lib/database.types'

interface AppContextType {
  // Data
  clients: Client[]
  carers: Carer[]
  visitEntries: VisitEntry[]
  alerts: Alert[]
  isLoading: boolean

  // Client actions
  addClient: (displayName: string, internalReference?: string) => Promise<Client>
  updateClientStatus: (
    clientId: string,
    status: 'active' | 'inactive',
    reason?: ClientDeactivationReason,
    note?: string
  ) => Promise<void>
  assignCarerToClient: (clientId: string, carerId: string) => Promise<void>
  unassignCarerFromClient: (clientId: string, carerId: string) => Promise<void>
  getClientById: (id: string) => Client | undefined
  getClientsForCarer: (carerId: string) => Client[]

  // Carer actions
  addCarer: (fullName: string, email: string) => Promise<Carer>
  resendInvite: (email: string) => Promise<void>
  deactivateCarer: (carerId: string, reason: CarerDeactivationReason) => Promise<void>
  getCarerById: (id: string) => Carer | undefined
  getActiveCarers: () => Carer[]

  // Visit entry actions
  createVisitEntry: (
    clientId: string,
    carerId: string,
    agencyId: string,
    selectedSymptomIds: string[],
    vitals: Vitals,
    note: string
  ) => Promise<VisitEntry>
  addCorrectionNote: (visitEntryId: string, carerId: string, text: string) => Promise<void>
  getVisitEntriesForClient: (clientId: string) => VisitEntry[]
  getVisitEntryById: (id: string) => VisitEntry | undefined

  // Alert actions
  getAlertsByFilter: (
    filter: 'unreviewed' | 'reviewed' | 'amber' | 'red' | 'all',
    agencyId: string
  ) => Alert[]
  reviewAlert: (
    alertId: string,
    managerId: string,
    actionTaken: AlertActionTaken,
    note?: string
  ) => Promise<void>
  getAlertById: (id: string) => Alert | undefined
  getUnreviewedCount: (agencyId: string) => number

  // Refresh
  refreshData: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, agency, isAuthenticated, isAdmin } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [carers, setCarers] = useState<Carer[]>([])
  const [visitEntries, setVisitEntries] = useState<VisitEntry[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!isAuthenticated || isAdmin || !user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Load clients
      const { data: clientRows } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (clientRows) {
        setClients(clientRows.map((r: DbClient) => dbClientToClient(r)))
      }

      // Load carers (users with role='carer') and their assignments
      const { data: carerRows } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'carer')
        .order('created_at', { ascending: false })

      const { data: assignmentRows } = await supabase
        .from('carer_client_assignments')
        .select('*')

      if (carerRows) {
        const assignments = (assignmentRows || []) as DbCarerClientAssignment[]
        setCarers(
          carerRows.map((r: DbUser) => {
            const carerAssignments = assignments
              .filter((a) => a.carer_id === r.id)
              .map((a) => a.client_id)
            return dbUserToCarer(r, carerAssignments)
          })
        )
      }

      // Load visit entries with correction notes
      const { data: visitRows } = await supabase
        .from('visit_entries')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: noteRows } = await supabase
        .from('correction_notes')
        .select('*')
        .order('created_at', { ascending: true })

      if (visitRows) {
        const notes = (noteRows || []) as DbCorrectionNote[]
        setVisitEntries(
          visitRows.map((r: DbVisitEntry) => {
            const entryNotes = notes
              .filter((n) => n.visit_entry_id === r.id)
              .map(dbCorrectionNoteToCorrectionNote)
            return dbVisitEntryToVisitEntry(r, entryNotes.length > 0 ? entryNotes : undefined)
          })
        )
      }

      // Load alerts
      const { data: alertRows } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (alertRows) {
        setAlerts(alertRows.map((r: DbAlert) => dbAlertToAlert(r)))
      }
    } catch (err) {
      console.error('Error loading app data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, isAdmin, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Risk calculation (same logic as before)
  const calculateRisk = (
    selectedSymptomIds: string[],
    vitals: Vitals
  ): { score: number; riskLevel: RiskLevel; reasons: string[] } => {
    let score = 0
    const reasons: string[] = []

    for (const symptomId of selectedSymptomIds) {
      const symptom = getSymptomById(symptomId)
      if (symptom) {
        score += symptom.points
        reasons.push(symptom.label)
      }
    }

    if (vitals.temperature !== undefined) {
      if (vitals.temperature >= 38) {
        score += 2
        reasons.push(`High temperature (${vitals.temperature}°C)`)
      } else if (vitals.temperature < 36) {
        score += 1
        reasons.push(`Low temperature (${vitals.temperature}°C)`)
      }
    }
    if (vitals.pulse !== undefined) {
      if (vitals.pulse > 100 || vitals.pulse < 50) {
        score += 1
        reasons.push(`Abnormal pulse (${vitals.pulse} bpm)`)
      }
    }
    if (vitals.oxygenSaturation !== undefined && vitals.oxygenSaturation < 95) {
      score += 2
      reasons.push(`Low oxygen saturation (${vitals.oxygenSaturation}%)`)
    }
    if (vitals.respiratoryRate !== undefined) {
      if (vitals.respiratoryRate > 20 || vitals.respiratoryRate < 12) {
        score += 1
        reasons.push(`Abnormal respiratory rate (${vitals.respiratoryRate}/min)`)
      }
    }
    if (vitals.systolicBp !== undefined && vitals.diastolicBp !== undefined) {
      if (vitals.systolicBp > 140 || vitals.systolicBp < 90) {
        score += 1
        reasons.push(`Abnormal blood pressure (${vitals.systolicBp}/${vitals.diastolicBp})`)
      }
    }

    let riskLevel: RiskLevel = 'green'
    if (score >= 5) riskLevel = 'red'
    else if (score >= 3) riskLevel = 'amber'

    return { score, riskLevel, reasons }
  }

  // Client actions
  const addClient = useCallback(
    async (displayName: string, internalReference?: string): Promise<Client> => {
      const agencyId = agency?.id || user?.agencyId
      if (!agencyId) throw new Error('No agency found')

      const { data, error } = await supabase
        .from('clients')
        .insert({
          display_name: displayName,
          internal_reference: internalReference || null,
          agency_id: agencyId,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error

      const newClient = dbClientToClient(data as DbClient)
      setClients((prev) => [newClient, ...prev])

      // Log activity
      await supabase.from('activity_log').insert({
        event_type: 'client_created',
        agency_id: agencyId,
        agency_name: agency?.name || '',
        entity_id: newClient.id,
        entity_name: displayName,
        performed_by: user!.id,
        performed_by_name: user!.fullName,
      })

      return newClient
    },
    [agency, user]
  )

  const updateClientStatus = useCallback(
    async (
      clientId: string,
      status: 'active' | 'inactive',
      reason?: ClientDeactivationReason,
      note?: string
    ): Promise<void> => {
      const updates: Record<string, unknown> = { status }
      if (status === 'inactive') {
        updates.deactivation_reason = reason || null
        updates.deactivation_note = note || null
        updates.deactivated_at = new Date().toISOString()
      } else {
        updates.deactivation_reason = null
        updates.deactivation_note = null
        updates.deactivated_at = null
      }

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)

      if (error) throw error

      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                status,
                deactivationReason: status === 'inactive' ? reason : undefined,
                deactivationNote: status === 'inactive' ? note : undefined,
                deactivatedAt: status === 'inactive' ? new Date().toISOString() : undefined,
              }
            : c
        )
      )

      // Log activity
      const client = clients.find((c) => c.id === clientId)
      if (user && client) {
        await supabase.from('activity_log').insert({
          event_type: status === 'inactive' ? 'client_deactivated' : 'client_reactivated',
          agency_id: agency?.id,
          agency_name: agency?.name || '',
          entity_id: clientId,
          entity_name: client.displayName,
          performed_by: user.id,
          performed_by_name: user.fullName,
          reason: reason || undefined,
        })
      }
    },
    [agency, user, clients]
  )

  const assignCarerToClient = useCallback(
    async (clientId: string, carerId: string): Promise<void> => {
      const agencyId = agency?.id || user?.agencyId
      if (!agencyId) throw new Error('No agency found')

      const { error } = await supabase
        .from('carer_client_assignments')
        .insert({
          carer_id: carerId,
          client_id: clientId,
          agency_id: agencyId,
        })

      if (error) throw error

      setCarers((prev) =>
        prev.map((c) =>
          c.id === carerId && !c.assignedClientIds.includes(clientId)
            ? { ...c, assignedClientIds: [...c.assignedClientIds, clientId] }
            : c
        )
      )
    },
    [agency, user]
  )

  const unassignCarerFromClient = useCallback(
    async (clientId: string, carerId: string): Promise<void> => {
      const { error } = await supabase
        .from('carer_client_assignments')
        .delete()
        .eq('carer_id', carerId)
        .eq('client_id', clientId)

      if (error) throw error

      setCarers((prev) =>
        prev.map((c) =>
          c.id === carerId
            ? { ...c, assignedClientIds: c.assignedClientIds.filter((id) => id !== clientId) }
            : c
        )
      )
    },
    []
  )

  const getClientById = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  )

  const getClientsForCarer = useCallback(
    (carerId: string) => {
      const carer = carers.find((c) => c.id === carerId)
      if (!carer) return []
      return clients.filter(
        (c) => carer.assignedClientIds.includes(c.id) && c.status === 'active'
      )
    },
    [carers, clients]
  )

  // Carer actions
  const addCarer = useCallback(
    async (fullName: string, email: string): Promise<Carer> => {
      const agencyId = agency?.id || user?.agencyId
      if (!agencyId) throw new Error('No agency found')

      // 1. Create auth user with random password (fresh client to avoid session conflict)
      const freshClient = createFreshClient()
      const tempPassword = crypto.randomUUID()

      const { data: signUpData, error: signUpError } = await freshClient.auth.signUp({
        email,
        password: tempPassword,
      })

      if (signUpError || !signUpData.user) {
        throw new Error(signUpError?.message || 'Failed to create user')
      }

      // 2. Create users row
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: signUpData.user.id,
          email,
          full_name: fullName,
          role: 'carer',
          status: 'pending',
          agency_id: agencyId,
        })

      if (insertError) throw insertError

      // 3. Send password reset email (this is the "set password" email)
      await freshClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-password`,
      })

      // 4. Log activity
      await supabase.from('activity_log').insert({
        event_type: 'carer_created',
        agency_id: agencyId,
        agency_name: agency?.name || '',
        entity_id: signUpData.user.id,
        entity_name: fullName,
        performed_by: user!.id,
        performed_by_name: user!.fullName,
      })

      // 5. Update local state
      const newCarer: Carer = {
        id: signUpData.user.id,
        email,
        fullName,
        role: 'carer',
        status: 'pending',
        agencyId,
        createdAt: new Date().toISOString(),
        assignedClientIds: [],
      }
      setCarers((prev) => [newCarer, ...prev])
      return newCarer
    },
    [agency, user]
  )

  const resendInvite = useCallback(
    async (email: string): Promise<void> => {
      const freshClient = createFreshClient()
      const { error } = await freshClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-password`,
      })
      if (error) throw error
    },
    []
  )

  const deactivateCarer = useCallback(
    async (carerId: string, reason: CarerDeactivationReason): Promise<void> => {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'inactive',
          deactivation_reason: reason,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', carerId)

      if (error) throw error

      setCarers((prev) =>
        prev.map((c) =>
          c.id === carerId
            ? {
                ...c,
                status: 'inactive' as const,
                deactivationReason: reason,
                deactivatedAt: new Date().toISOString(),
              }
            : c
        )
      )

      // Log activity
      const carer = carers.find((c) => c.id === carerId)
      if (user && carer) {
        await supabase.from('activity_log').insert({
          event_type: 'carer_deactivated',
          agency_id: agency?.id,
          agency_name: agency?.name || '',
          entity_id: carerId,
          entity_name: carer.fullName,
          performed_by: user.id,
          performed_by_name: user.fullName,
          reason,
        })
      }
    },
    [agency, user, carers]
  )

  const getCarerById = useCallback(
    (id: string) => carers.find((c) => c.id === id),
    [carers]
  )

  const getActiveCarers = useCallback(
    () => carers.filter((c) => c.status === 'active'),
    [carers]
  )

  // Visit entry actions
  const createVisitEntry = useCallback(
    async (
      clientId: string,
      carerId: string,
      agencyId: string,
      selectedSymptomIds: string[],
      vitals: Vitals,
      note: string
    ): Promise<VisitEntry> => {
      const { score, riskLevel, reasons } = calculateRisk(selectedSymptomIds, vitals)

      const { data, error } = await supabase
        .from('visit_entries')
        .insert({
          client_id: clientId,
          carer_id: carerId,
          agency_id: agencyId,
          selected_symptom_ids: selectedSymptomIds,
          vitals: vitalsToDb(vitals),
          note,
          score,
          risk_level: riskLevel,
          reasons,
        })
        .select()
        .single()

      if (error) throw error

      const newEntry = dbVisitEntryToVisitEntry(data as DbVisitEntry)
      setVisitEntries((prev) => [newEntry, ...prev])

      // Alert is auto-created by DB trigger, so refresh alerts
      if (riskLevel === 'amber' || riskLevel === 'red') {
        const { data: alertRows } = await supabase
          .from('alerts')
          .select('*')
          .eq('visit_entry_id', newEntry.id)
          .single()

        if (alertRows) {
          const newAlert = dbAlertToAlert(alertRows as DbAlert)
          setAlerts((prev) => [newAlert, ...prev])
        }
      }

      return newEntry
    },
    []
  )

  const addCorrectionNote = useCallback(
    async (visitEntryId: string, carerId: string, text: string): Promise<void> => {
      const { data, error } = await supabase
        .from('correction_notes')
        .insert({
          visit_entry_id: visitEntryId,
          carer_id: carerId,
          text,
        })
        .select()
        .single()

      if (error) throw error

      const newNote: CorrectionNote = dbCorrectionNoteToCorrectionNote(data as DbCorrectionNote)

      setVisitEntries((prev) =>
        prev.map((v) =>
          v.id === visitEntryId
            ? { ...v, correctionNotes: [...(v.correctionNotes || []), newNote] }
            : v
        )
      )
    },
    []
  )

  const getVisitEntriesForClient = useCallback(
    (clientId: string) =>
      visitEntries
        .filter((v) => v.clientId === clientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [visitEntries]
  )

  const getVisitEntryById = useCallback(
    (id: string) => visitEntries.find((v) => v.id === id),
    [visitEntries]
  )

  // Alert actions
  const getAlertsByFilter = useCallback(
    (filter: 'unreviewed' | 'reviewed' | 'amber' | 'red' | 'all', agencyId: string) => {
      const agencyAlerts = alerts
        .filter((a) => a.agencyId === agencyId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      switch (filter) {
        case 'unreviewed':
          return agencyAlerts.filter((a) => !a.isReviewed)
        case 'reviewed':
          return agencyAlerts.filter((a) => a.isReviewed)
        case 'amber':
          return agencyAlerts.filter((a) => a.riskLevel === 'amber')
        case 'red':
          return agencyAlerts.filter((a) => a.riskLevel === 'red')
        case 'all':
        default:
          return agencyAlerts
      }
    },
    [alerts]
  )

  const reviewAlert = useCallback(
    async (
      alertId: string,
      managerId: string,
      actionTaken: AlertActionTaken,
      note?: string
    ): Promise<void> => {
      const { error } = await supabase
        .from('alerts')
        .update({
          is_reviewed: true,
          reviewed_by: managerId,
          reviewed_at: new Date().toISOString(),
          action_taken: actionTaken,
          manager_note: note || null,
        })
        .eq('id', alertId)

      if (error) throw error

      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                isReviewed: true,
                reviewedBy: managerId,
                reviewedAt: new Date().toISOString(),
                actionTaken,
                managerNote: note,
              }
            : a
        )
      )
    },
    []
  )

  const getAlertById = useCallback(
    (id: string) => alerts.find((a) => a.id === id),
    [alerts]
  )

  const getUnreviewedCount = useCallback(
    (agencyId: string) =>
      alerts.filter((a) => a.agencyId === agencyId && !a.isReviewed).length,
    [alerts]
  )

  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  const value: AppContextType = {
    clients,
    carers,
    visitEntries,
    alerts,
    isLoading,
    addClient,
    updateClientStatus,
    assignCarerToClient,
    unassignCarerFromClient,
    getClientById,
    getClientsForCarer,
    addCarer,
    resendInvite,
    deactivateCarer,
    getCarerById,
    getActiveCarers,
    createVisitEntry,
    addCorrectionNote,
    getVisitEntriesForClient,
    getVisitEntryById,
    getAlertsByFilter,
    reviewAlert,
    getAlertById,
    getUnreviewedCount,
    refreshData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
