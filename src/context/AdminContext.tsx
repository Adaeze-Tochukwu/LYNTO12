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
import {
  dbAgencyStatsToAgencyWithStats,
  dbPlatformAdminToPlatformAdmin,
  dbActivityLogToActivityLogEntry,
} from '@/lib/converters'
import type {
  AgencyWithStats,
  PlatformAdmin,
  ActivityLogEntry,
  AgencyStatus,
} from '@/types'

interface AdminContextType {
  agencies: AgencyWithStats[]
  admins: PlatformAdmin[]
  activityLog: ActivityLogEntry[]
  isLoading: boolean
  refreshData: () => Promise<void>
  updateAgencyStatus: (agencyId: string, status: AgencyStatus, notes?: string) => Promise<void>
  getAgencyById: (id: string) => AgencyWithStats | undefined
  getActivityForAgency: (agencyId: string) => ActivityLogEntry[]
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  const [agencies, setAgencies] = useState<AgencyWithStats[]>([])
  const [admins, setAdmins] = useState<PlatformAdmin[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshData = useCallback(async () => {
    if (!isAdmin) {
      setAgencies([])
      setAdmins([])
      setActivityLog([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      // Fetch agency stats
      const { data: agencyData } = await supabase
        .from('agency_stats')
        .select('*')

      if (agencyData) {
        setAgencies(agencyData.map(dbAgencyStatsToAgencyWithStats))
      }

      // Fetch platform admins
      const { data: adminsData } = await supabase
        .from('platform_admins')
        .select('*')
        .order('created_at', { ascending: true })

      if (adminsData) {
        setAdmins(adminsData.map(dbPlatformAdminToPlatformAdmin))
      }

      // Fetch activity log
      const { data: logData } = await supabase
        .from('activity_log')
        .select('*')
        .order('timestamp', { ascending: false })

      if (logData) {
        setActivityLog(logData.map(dbActivityLogToActivityLogEntry))
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const updateAgencyStatus = useCallback(
    async (agencyId: string, status: AgencyStatus, notes?: string) => {
      const { error } = await supabase
        .from('agencies')
        .update({
          status,
          notes: notes ?? null,
        })
        .eq('id', agencyId)

      if (error) {
        console.error('Error updating agency status:', error)
        return
      }

      // Update local state
      setAgencies((prev) =>
        prev.map((a) =>
          a.id === agencyId ? { ...a, status, notes: notes ?? a.notes } : a
        )
      )
    },
    []
  )

  const getAgencyById = useCallback(
    (id: string) => agencies.find((a) => a.id === id),
    [agencies]
  )

  const getActivityForAgency = useCallback(
    (agencyId: string) => activityLog.filter((log) => log.agencyId === agencyId),
    [activityLog]
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
