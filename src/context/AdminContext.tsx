import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  AgencyWithStats,
  PlatformAdmin,
  ActivityLogEntry,
  AgencyStatus,
  Carer,
  Client,
} from '@/types'
import { supabase, createFreshClient } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import {
  dbAgencyStatsToAgencyWithStats,
  dbPlatformAdminToPlatformAdmin,
  dbActivityLogToActivityLogEntry,
  dbUserToCarer,
  dbClientToClient,
} from '@/lib/converters'
import type {
  DbAgencyStats,
  DbPlatformAdmin,
  DbActivityLog,
  DbUser,
  DbClient,
  DbCarerClientAssignment,
} from '@/lib/database.types'

interface AdminContextType {
  agencies: AgencyWithStats[]
  admins: PlatformAdmin[]
  activityLog: ActivityLogEntry[]
  isLoading: boolean
  refreshData: () => Promise<void>
  updateAgencyStatus: (agencyId: string, status: AgencyStatus, notes?: string) => Promise<void>
  getAgencyById: (id: string) => AgencyWithStats | undefined
  getActivityForAgency: (agencyId: string) => ActivityLogEntry[]
  getCarersForAgency: (agencyId: string) => Promise<Carer[]>
  getClientsForAgency: (agencyId: string) => Promise<Client[]>
  approveAgency: (agencyId: string) => Promise<void>
  rejectAgency: (agencyId: string, reason: string) => Promise<void>
  inviteAdmin: (email: string, fullName: string, adminRole: PlatformAdmin['adminRole']) => Promise<void>
  updateAdminStatus: (adminId: string, status: 'active' | 'inactive', reason?: string) => Promise<void>
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { admin, isAdmin } = useAuth()
  const [agencies, setAgencies] = useState<AgencyWithStats[]>([])
  const [admins, setAdmins] = useState<PlatformAdmin[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Load agencies from agency_stats view
      const { data: agencyRows } = await supabase
        .from('agency_stats')
        .select('*')
        .order('created_at', { ascending: false })

      if (agencyRows) {
        setAgencies(agencyRows.map((r: DbAgencyStats) => dbAgencyStatsToAgencyWithStats(r)))
      }

      // Load platform admins
      const { data: adminRows } = await supabase
        .from('platform_admins')
        .select('*')
        .order('created_at', { ascending: false })

      if (adminRows) {
        setAdmins(adminRows.map((r: DbPlatformAdmin) => dbPlatformAdminToPlatformAdmin(r)))
      }

      // Load activity log
      const { data: logRows } = await supabase
        .from('activity_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200)

      if (logRows) {
        setActivityLog(logRows.map((r: DbActivityLog) => dbActivityLogToActivityLogEntry(r)))
      }
    } catch (err) {
      console.error('Error loading admin data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  const updateAgencyStatus = useCallback(
    async (agencyId: string, status: AgencyStatus, notes?: string): Promise<void> => {
      const updates: Record<string, unknown> = { status }
      if (notes !== undefined) updates.notes = notes

      const { error } = await supabase
        .from('agencies')
        .update(updates)
        .eq('id', agencyId)

      if (error) throw error

      // Update local state
      setAgencies((prev) =>
        prev.map((a) => (a.id === agencyId ? { ...a, status, notes: notes || a.notes } : a))
      )

      // Log activity
      const agency = agencies.find((a) => a.id === agencyId)
      if (admin && agency) {
        await supabase.from('activity_log').insert({
          event_type: 'agency_status_changed',
          agency_id: agencyId,
          agency_name: agency.name,
          performed_by: admin.id,
          performed_by_name: admin.fullName,
          reason: `Status changed to ${status}${notes ? `: ${notes}` : ''}`,
        })
      }
    },
    [admin, agencies]
  )

  const getAgencyById = useCallback(
    (id: string) => agencies.find((a) => a.id === id),
    [agencies]
  )

  const getActivityForAgency = useCallback(
    (agencyId: string) => activityLog.filter((l) => l.agencyId === agencyId),
    [activityLog]
  )

  const getCarersForAgency = useCallback(
    async (agencyId: string): Promise<Carer[]> => {
      const { data: carerRows } = await supabase
        .from('users')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('role', 'carer')
        .order('created_at', { ascending: false })

      const { data: assignmentRows } = await supabase
        .from('carer_client_assignments')
        .select('*')
        .eq('agency_id', agencyId)

      if (!carerRows) return []

      const assignments = (assignmentRows || []) as DbCarerClientAssignment[]
      return carerRows.map((r: DbUser) => {
        const carerAssignments = assignments
          .filter((a) => a.carer_id === r.id)
          .map((a) => a.client_id)
        return dbUserToCarer(r, carerAssignments)
      })
    },
    []
  )

  const getClientsForAgency = useCallback(
    async (agencyId: string): Promise<Client[]> => {
      const { data: clientRows } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })

      if (!clientRows) return []
      return clientRows.map((r: DbClient) => dbClientToClient(r))
    },
    []
  )

  const approveAgency = useCallback(
    async (agencyId: string): Promise<void> => {
      const { error } = await supabase.rpc('approve_agency', { p_agency_id: agencyId })
      if (error) throw error
      await loadData()
    },
    [loadData]
  )

  const rejectAgency = useCallback(
    async (agencyId: string, reason: string): Promise<void> => {
      const { error } = await supabase.rpc('reject_agency', { p_agency_id: agencyId, p_reason: reason })
      if (error) throw error
      await loadData()
    },
    [loadData]
  )

  const inviteAdmin = useCallback(
    async (email: string, fullName: string, adminRole: PlatformAdmin['adminRole']): Promise<void> => {
      // 1. Create auth user with random password
      const freshClient = createFreshClient()
      const tempPassword = crypto.randomUUID()

      const { data: signUpData, error: signUpError } = await freshClient.auth.signUp({
        email,
        password: tempPassword,
      })

      const newUser = signUpData.user
      if (signUpError || !newUser) {
        throw new Error(signUpError?.message || 'Failed to create admin user')
      }

      // 2. Create platform_admins row
      const { error: insertError } = await supabase
        .from('platform_admins')
        .insert({
          id: newUser.id,
          email,
          full_name: fullName,
          admin_role: adminRole,
          status: 'pending',
        })

      if (insertError) throw insertError

      // 3. Send password reset email
      await freshClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-password`,
      })

      // 4. Log activity
      if (admin) {
        await supabase.from('activity_log').insert({
          event_type: 'admin_created',
          entity_id: newUser.id,
          entity_name: fullName,
          performed_by: admin.id,
          performed_by_name: admin.fullName,
        })
      }

      // 5. Update local state
      setAdmins((prev) => [
        {
          id: newUser.id,
          email,
          fullName,
          role: 'admin' as const,
          adminRole,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    [admin]
  )

  const updateAdminStatus = useCallback(
    async (adminId: string, status: 'active' | 'inactive', reason?: string): Promise<void> => {
      const updates: Record<string, unknown> = { status }
      if (status === 'inactive') {
        updates.deactivated_at = new Date().toISOString()
        updates.deactivation_reason = reason || null
      } else {
        updates.deactivated_at = null
        updates.deactivation_reason = null
      }

      const { error } = await supabase
        .from('platform_admins')
        .update(updates)
        .eq('id', adminId)

      if (error) throw error

      setAdmins((prev) =>
        prev.map((a) =>
          a.id === adminId
            ? {
                ...a,
                status,
                deactivatedAt: status === 'inactive' ? new Date().toISOString() : undefined,
                deactivationReason: status === 'inactive' ? reason : undefined,
              }
            : a
        )
      )

      // Log activity
      const targetAdmin = admins.find((a) => a.id === adminId)
      if (admin && targetAdmin) {
        await supabase.from('activity_log').insert({
          event_type: status === 'inactive' ? 'admin_deactivated' : 'admin_reactivated',
          entity_id: adminId,
          entity_name: targetAdmin.fullName,
          performed_by: admin.id,
          performed_by_name: admin.fullName,
          reason,
        })
      }
    },
    [admin, admins]
  )

  const value: AdminContextType = {
    agencies,
    admins,
    activityLog,
    isLoading,
    refreshData,
    updateAgencyStatus,
    getAgencyById,
    getActivityForAgency,
    getCarersForAgency,
    getClientsForAgency,
    approveAgency,
    rejectAgency,
    inviteAdmin,
    updateAdminStatus,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdminData() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdminData must be used within an AdminProvider')
  }
  return context
}
