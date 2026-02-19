import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Manager, Carer, Agency, PlatformAdmin } from '@/types'
import { supabase } from '@/lib/supabase'
import { dbUserToUser, dbPlatformAdminToPlatformAdmin } from '@/lib/converters'
import type { DbUser, DbPlatformAdmin, DbAgency } from '@/lib/database.types'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  admin: PlatformAdmin | null
  agency: Agency | null
  isAuthenticated: boolean
  isManager: boolean
  isCarer: boolean
  isAdmin: boolean
  isPrimaryAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  adminLogin: (email: string, password: string) => Promise<boolean>
  logout: () => void
  registerAgency: (agencyName: string, fullName: string, email: string, password: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user profile from DB based on auth session
  const loadProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null)
      setAdmin(null)
      setAgency(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Use RPC to get profile (bypasses RLS chicken-and-egg problem)
      const { data: profileData, error: profileError } = await supabase.rpc('get_my_profile')

      if (profileError) {
        console.error('Error loading profile:', profileError.message, profileError.details, profileError.hint)
        setIsLoading(false)
        return
      }

      console.log('Profile loaded:', profileData)

      if (profileData?.type === 'admin') {
        const adminProfile = profileData.profile as DbPlatformAdmin
        setAdmin(dbPlatformAdminToPlatformAdmin(adminProfile))
        setUser(null)
        setAgency(null)
      } else if (profileData?.type === 'user') {
        const userProfile = profileData.profile as DbUser
        const agencyData = profileData.agency as DbAgency | null

        setUser(dbUserToUser(userProfile))
        setAdmin(null)

        if (agencyData) {
          setAgency({
            id: agencyData.id,
            name: agencyData.name,
            createdAt: agencyData.created_at,
            managerId: userProfile.role === 'manager' ? userProfile.id : '',
          })
        }
      } else {
        // No profile found - could be a new user who hasn't completed registration
        setUser(null)
        setAdmin(null)
        setAgency(null)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('Login error:', error.message)
      return false
    }
    console.log('Login successful, user ID:', data.user?.id)

    // Explicitly load profile instead of waiting for onAuthStateChange
    const { data: session } = await supabase.auth.getSession()
    await loadProfile(session.session)
    return true
  }, [loadProfile])

  const adminLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('Admin login error:', error.message)
      return false
    }

    // Verify this is actually an admin by checking the profile
    const { data: profileData } = await supabase.rpc('get_my_profile')

    if (profileData?.type !== 'admin') {
      // Not an admin - sign them out
      await supabase.auth.signOut()
      return false
    }

    // Update last login
    await supabase.from('platform_admins').update({
      last_login_at: new Date().toISOString(),
    }).eq('id', profileData.profile.id)

    // Log admin login activity
    await supabase.from('activity_log').insert({
      event_type: 'admin_login',
      performed_by: profileData.profile.id,
      performed_by_name: profileData.profile.full_name,
    })

    return true
  }, [])

  const logout = useCallback(async () => {
    // Log admin logout if admin
    if (admin) {
      await supabase.from('activity_log').insert({
        event_type: 'admin_logout',
        performed_by: admin.id,
        performed_by_name: admin.fullName,
      })
    }

    await supabase.auth.signOut()
    setUser(null)
    setAdmin(null)
    setAgency(null)
  }, [admin])

  const registerAgency = useCallback(
    async (agencyName: string, fullName: string, email: string, password: string): Promise<boolean> => {
      // 1. Create auth user
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        console.error('Registration error:', signUpError.message)
        return false
      }

      // 2. Call RPC to create agency + user record
      const { data: rpcData, error: rpcError } = await supabase.rpc('register_agency', {
        p_agency_name: agencyName,
        p_full_name: fullName,
        p_email: email,
      })

      if (rpcError) {
        console.error('Register agency error:', rpcError.message, rpcError.details, rpcError.hint)
        throw new Error(rpcError.message)
      }

      console.log('Agency registered:', rpcData)

      // Explicitly load profile
      const { data: session } = await supabase.auth.getSession()
      await loadProfile(session.session)
      return true
    },
    [loadProfile]
  )

  const value: AuthContextType = {
    user,
    admin,
    agency,
    isAuthenticated: !!user || !!admin,
    isManager: user?.role === 'manager',
    isCarer: user?.role === 'carer',
    isAdmin: !!admin,
    isPrimaryAdmin: admin?.adminRole === 'primary_admin',
    isLoading,
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
  return isCarer ? (user as Carer) : null
}

export function useAdmin(): PlatformAdmin | null {
  const { admin, isAdmin } = useAuth()
  return isAdmin ? admin : null
}
