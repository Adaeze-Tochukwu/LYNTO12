import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import {
  dbUserToUser,
  dbAgencyToAgency,
  dbPlatformAdminToPlatformAdmin,
} from '@/lib/converters'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User, Manager, Carer, Agency, PlatformAdmin } from '@/types'

interface AuthContextType {
  user: User | null
  admin: PlatformAdmin | null
  agency: Agency | null
  isAuthenticated: boolean
  isLoading: boolean
  isManager: boolean
  isCarer: boolean
  isAdmin: boolean
  isPrimaryAdmin: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  registerAgency: (
    agencyName: string,
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (authUser: SupabaseUser) => {
    // Check if user is a platform admin
    const { data: adminData } = await supabase
      .from('platform_admins')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .eq('status', 'active')
      .single()

    if (adminData) {
      setAdmin(dbPlatformAdminToPlatformAdmin(adminData))
      setUser(null)
      setAgency(null)
      return
    }

    // Check if user is a regular user (manager/carer)
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .eq('status', 'active')
      .single()

    if (userData) {
      setUser(dbUserToUser(userData))
      setAdmin(null)

      // Fetch agency
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', userData.agency_id)
        .single()

      if (agencyData) {
        setAgency(dbAgencyToAgency(agencyData))
      }
    }
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user)
      }
      setIsLoading(false)
    })

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAdmin(null)
        setAgency(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        if (data.user) {
          await fetchUserProfile(data.user)
        }

        return { success: true }
      } catch {
        return { success: false, error: 'An unexpected error occurred' }
      }
    },
    [fetchUserProfile]
  )

  const adminLogin = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        if (data.user) {
          // Verify this is actually an admin
          const { data: adminData, error: adminError } = await supabase
            .from('platform_admins')
            .select('*')
            .eq('auth_user_id', data.user.id)
            .eq('status', 'active')
            .single()

          if (adminError || !adminData) {
            await supabase.auth.signOut()
            return { success: false, error: 'Not authorized as admin' }
          }

          // Update last login
          await supabase
            .from('platform_admins')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', adminData.id)

          setAdmin(dbPlatformAdminToPlatformAdmin(adminData))
          setUser(null)
          setAgency(null)
        }

        return { success: true }
      } catch {
        return { success: false, error: 'An unexpected error occurred' }
      }
    },
    []
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAdmin(null)
    setAgency(null)
  }, [])

  const registerAgency = useCallback(
    async (
      agencyName: string,
      fullName: string,
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) {
          return { success: false, error: authError.message }
        }

        if (!authData.user) {
          return { success: false, error: 'Failed to create account' }
        }

        // 2. Create agency
        const { data: agencyData, error: agencyError } = await supabase
          .from('agencies')
          .insert({
            name: agencyName,
            status: 'active',
            contact_email: email,
            contact_name: fullName,
          })
          .select()
          .single()

        if (agencyError) {
          return { success: false, error: 'Failed to create agency' }
        }

        // 3. Create manager user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            auth_user_id: authData.user.id,
            email,
            full_name: fullName,
            role: 'manager',
            status: 'active',
            agency_id: agencyData.id,
          })
          .select()
          .single()

        if (userError) {
          return { success: false, error: 'Failed to create user profile' }
        }

        // 4. Update agency with manager_id
        await supabase
          .from('agencies')
          .update({ manager_id: userData.id })
          .eq('id', agencyData.id)

        // 5. Set local state
        setUser(dbUserToUser(userData))
        setAgency(dbAgencyToAgency(agencyData))
        setAdmin(null)

        return { success: true }
      } catch {
        return { success: false, error: 'An unexpected error occurred' }
      }
    },
    []
  )

  const value: AuthContextType = {
    user,
    admin,
    agency,
    isAuthenticated: !!user || !!admin,
    isLoading,
    isManager: user?.role === 'manager',
    isCarer: user?.role === 'carer',
    isAdmin: !!admin,
    isPrimaryAdmin: admin?.adminRole === 'primary_admin',
    login,
    adminLogin,
    logout,
    registerAgency,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook to get typed user
export function useManager(): Manager | null {
  const { user, isManager } = useAuth()
  return isManager ? (user as Manager) : null
}

export function useCarer(): Carer | null {
  const { user, isCarer } = useAuth()
  const [assignedClientIds, setAssignedClientIds] = useState<string[]>([])

  useEffect(() => {
    if (user && isCarer) {
      // Fetch assigned client IDs
      supabase
        .from('carer_client_assignments')
        .select('client_id')
        .eq('carer_id', user.id)
        .then(({ data }) => {
          if (data) {
            setAssignedClientIds(data.map((d) => d.client_id))
          }
        })
    }
  }, [user, isCarer])

  if (!isCarer || !user) return null

  return {
    ...user,
    role: 'carer' as const,
    assignedClientIds,
  }
}

export function useAdmin(): PlatformAdmin | null {
  const { admin, isAdmin } = useAuth()
  return isAdmin ? admin : null
}
