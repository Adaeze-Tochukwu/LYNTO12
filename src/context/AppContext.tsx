import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { getSymptomById } from '@/data/symptoms'
import {
  dbClientToClient,
  dbUserToCarer,
  dbVisitEntryToVisitEntry,
  dbAlertToAlert,
  dbCorrectionNoteToCorrectionNote,
} from '@/lib/converters'
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
} from '@/types'

interface AppContextType {
  // Data
  clients: Client[]
  carers: Carer[]
  visitEntries: VisitEntry[]
  alerts: Alert[]
  isLoading: boolean

  // Refresh data
  refreshData: () => Promise<void>

  // Client actions
  addClient: (displayName: string, internalReference?: string) => Promise<Client | null>
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
  addCarer: (fullName: string, email: string) => Promise<Carer | null>
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
  ) => Promise<VisitEntry | null>
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
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { agency } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [carers, setCarers] = useState<Carer[]>([])
  const [visitEntries, setVisitEntries] = useState<VisitEntry[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all data for the agency
  const refreshData = useCallback(async () => {
    if (!agency) {
      setClients([])
      setCarers([])
      setVisitEntries([])
      setAlerts([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })

      if (clientsData) {
        setClients(clientsData.map(dbClientToClient))
      }

      // Fetch carers with their assignments
      const { data: carersData } = await supabase
        .from('users')
        .select('*')
        .eq('agency_id', agency.id)
        .eq('role', 'carer')
        .order('created_at', { ascending: false })

      if (carersData) {
        // Fetch assignments for each carer
        const carersWithAssignments = await Promise.all(
          carersData.map(async (carer) => {
            const { data: assignments } = await supabase
              .from('carer_client_assignments')
              .select('client_id')
              .eq('carer_id', carer.id)

            const assignedClientIds = assignments?.map((a) => a.client_id) || []
            return dbUserToCarer(carer, assignedClientIds)
          })
        )
        setCarers(carersWithAssignments)
      }

      // Fetch visit entries with correction notes
      const { data: visitsData } = await supabase
        .from('visit_entries')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })

      if (visitsData) {
        // Fetch correction notes for each visit
        const visitsWithNotes = await Promise.all(
          visitsData.map(async (visit) => {
            const { data: notes } = await supabase
              .from('correction_notes')
              .select('*')
              .eq('visit_entry_id', visit.id)
              .order('created_at', { ascending: true })

            return dbVisitEntryToVisitEntry(visit, notes || undefined)
          })
        )
        setVisitEntries(visitsWithNotes)
      }

      // Fetch alerts
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })

      if (alertsData) {
        setAlerts(alertsData.map(dbAlertToAlert))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [agency])

  // Fetch data when agency changes
  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Client actions
  const addClient = useCallback(
    async (displayName: string, internalReference?: string): Promise<Client | null> => {
      if (!agency) return null

      const { data, error } = await supabase
        .from('clients')
        .insert({
          display_name: displayName,
          internal_reference: internalReference,
          agency_id: agency.id,
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding client:', error)
        return null
      }

      const newClient = dbClientToClient(data)
      setClients((prev) => [newClient, ...prev])
      return newClient
    },
    [agency]
  )

  const updateClientStatus = useCallback(
    async (
      clientId: string,
      status: 'active' | 'inactive',
      reason?: ClientDeactivationReason,
      note?: string
    ) => {
      const { error } = await supabase
        .from('clients')
        .update({
          status,
          deactivation_reason: status === 'inactive' ? reason : null,
          deactivation_note: status === 'inactive' ? note : null,
          deactivated_at: status === 'inactive' ? new Date().toISOString() : null,
        })
        .eq('id', clientId)

      if (error) {
        console.error('Error updating client:', error)
        return
      }

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
    },
    []
  )

  const assignCarerToClient = useCallback(async (clientId: string, carerId: string) => {
    const { error } = await supabase.from('carer_client_assignments').insert({
      carer_id: carerId,
      client_id: clientId,
    })

    if (error) {
      console.error('Error assigning carer:', error)
      return
    }

    setCarers((prev) =>
      prev.map((c) =>
        c.id === carerId && !c.assignedClientIds.includes(clientId)
          ? { ...c, assignedClientIds: [...c.assignedClientIds, clientId] }
          : c
      )
    )
  }, [])

  const unassignCarerFromClient = useCallback(async (clientId: string, carerId: string) => {
    const { error } = await supabase
      .from('carer_client_assignments')
      .delete()
      .eq('carer_id', carerId)
      .eq('client_id', clientId)

    if (error) {
      console.error('Error unassigning carer:', error)
      return
    }

    setCarers((prev) =>
      prev.map((c) =>
        c.id === carerId
          ? { ...c, assignedClientIds: c.assignedClientIds.filter((id) => id !== clientId) }
          : c
      )
    )
  }, [])

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
    async (fullName: string, email: string): Promise<Carer | null> => {
      if (!agency) return null

      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          full_name: fullName,
          role: 'carer',
          status: 'pending',
          agency_id: agency.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding carer:', error)
        return null
      }

      const newCarer = dbUserToCarer(data, [])
      setCarers((prev) => [newCarer, ...prev])
      return newCarer
    },
    [agency]
  )

  const deactivateCarer = useCallback(
    async (carerId: string, reason: CarerDeactivationReason) => {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'inactive',
          deactivation_reason: reason,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', carerId)

      if (error) {
        console.error('Error deactivating carer:', error)
        return
      }

      setCarers((prev) =>
        prev.map((c) =>
          c.id === carerId
            ? {
                ...c,
                status: 'inactive',
                deactivationReason: reason,
                deactivatedAt: new Date().toISOString(),
              }
            : c
        )
      )
    },
    []
  )

  const getCarerById = useCallback(
    (id: string) => carers.find((c) => c.id === id),
    [carers]
  )

  const getActiveCarers = useCallback(
    () => carers.filter((c) => c.status === 'active'),
    [carers]
  )

  // Risk calculation
  const calculateRisk = (
    selectedSymptomIds: string[],
    vitals: Vitals
  ): { score: number; riskLevel: RiskLevel; reasons: string[] } => {
    let score = 0
    const reasons: string[] = []

    // Calculate from symptoms
    for (const symptomId of selectedSymptomIds) {
      const symptom = getSymptomById(symptomId)
      if (symptom) {
        score += symptom.points
        reasons.push(symptom.label)
      }
    }

    // Calculate from vitals (abnormal values)
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

    // Determine risk level
    let riskLevel: RiskLevel = 'green'
    if (score >= 5) {
      riskLevel = 'red'
    } else if (score >= 3) {
      riskLevel = 'amber'
    }

    return { score, riskLevel, reasons }
  }

  // Visit entry actions
  const createVisitEntry = useCallback(
    async (
      clientId: string,
      carerId: string,
      agencyId: string,
      selectedSymptomIds: string[],
      vitals: Vitals,
      note: string
    ): Promise<VisitEntry | null> => {
      const { score, riskLevel, reasons } = calculateRisk(selectedSymptomIds, vitals)

      const { data, error } = await supabase
        .from('visit_entries')
        .insert({
          client_id: clientId,
          carer_id: carerId,
          agency_id: agencyId,
          selected_symptom_ids: selectedSymptomIds,
          temperature: vitals.temperature,
          pulse: vitals.pulse,
          systolic_bp: vitals.systolicBp,
          diastolic_bp: vitals.diastolicBp,
          oxygen_saturation: vitals.oxygenSaturation,
          respiratory_rate: vitals.respiratoryRate,
          note,
          score,
          risk_level: riskLevel,
          reasons,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating visit entry:', error)
        return null
      }

      const newEntry = dbVisitEntryToVisitEntry(data)

      // Alert is auto-created by database trigger for amber/red
      // Refresh to get the new alert
      if (riskLevel === 'amber' || riskLevel === 'red') {
        const { data: newAlertData } = await supabase
          .from('alerts')
          .select('*')
          .eq('visit_entry_id', data.id)
          .single()

        if (newAlertData) {
          setAlerts((prev) => [dbAlertToAlert(newAlertData), ...prev])
        }
      }

      setVisitEntries((prev) => [newEntry, ...prev])
      return newEntry
    },
    []
  )

  const addCorrectionNote = useCallback(
    async (visitEntryId: string, carerId: string, text: string) => {
      const { data, error } = await supabase
        .from('correction_notes')
        .insert({
          visit_entry_id: visitEntryId,
          carer_id: carerId,
          text,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding correction note:', error)
        return
      }

      const newNote = dbCorrectionNoteToCorrectionNote(data)

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
    async (alertId: string, managerId: string, actionTaken: AlertActionTaken, note?: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({
          is_reviewed: true,
          reviewed_by: managerId,
          reviewed_at: new Date().toISOString(),
          action_taken: actionTaken,
          manager_note: note,
        })
        .eq('id', alertId)

      if (error) {
        console.error('Error reviewing alert:', error)
        return
      }

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

  const getAlertById = useCallback((id: string) => alerts.find((a) => a.id === id), [alerts])

  const getUnreviewedCount = useCallback(
    (agencyId: string) => alerts.filter((a) => a.agencyId === agencyId && !a.isReviewed).length,
    [alerts]
  )

  const value: AppContextType = {
    clients,
    carers,
    visitEntries,
    alerts,
    isLoading,
    refreshData,
    addClient,
    updateClientStatus,
    assignCarerToClient,
    unassignCarerFromClient,
    getClientById,
    getClientsForCarer,
    addCarer,
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
