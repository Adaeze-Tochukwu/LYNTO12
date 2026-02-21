import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AgencyPendingPage } from '@/pages/auth/AgencyPendingPage'
import { AgencyRejectedPage } from '@/pages/auth/AgencyRejectedPage'
import { AppProvider } from '@/context/AppContext'
import { AdminProvider } from '@/context/AdminContext'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { SetPasswordPage } from '@/pages/auth/SetPasswordPage'
import { TermsPage } from '@/pages/auth/TermsPage'

// Manager pages
import { ManagerDashboard } from '@/pages/manager/ManagerDashboard'
import { AlertsPage } from '@/pages/manager/AlertsPage'
import { AlertDetailPage } from '@/pages/manager/AlertDetailPage'
import { ClientsPage } from '@/pages/manager/ClientsPage'
import { ClientDetailPage } from '@/pages/manager/ClientDetailPage'
import { CarersPage } from '@/pages/manager/CarersPage'
import { CarerDetailPage } from '@/pages/manager/CarerDetailPage'

// Carer pages
import { CarerHome } from '@/pages/carer/CarerHome'
import { CarerClientsPage } from '@/pages/carer/CarerClientsPage'
import { CarerHistoryPage } from '@/pages/carer/CarerHistoryPage'
import { VisitEntryPage } from '@/pages/carer/VisitEntryPage'
import { EntryDetailPage } from '@/pages/carer/EntryDetailPage'

// Admin pages
import {
  AdminLoginPage,
  AdminDashboard,
  AgenciesPage,
  AgencyDetailPage,
  AdminsPage,
  ActivityLogPage,
} from '@/pages/admin'

// Loading spinner
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

// Protected route component
function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactNode
  allowedRole?: 'manager' | 'carer' | 'admin'
}) {
  const { isAuthenticated, isManager, isCarer, isAdmin, isLoading, agencyStatus } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (!isAuthenticated) {
    if (allowedRole === 'admin') {
      return <Navigate to="/admin/login" replace />
    }
    return <Navigate to="/login" replace />
  }

  // For manager/carer routes, check agency status
  if (allowedRole === 'manager' || allowedRole === 'carer') {
    if (agencyStatus === 'pending') return <AgencyPendingPage />
    if (agencyStatus === 'rejected') return <AgencyRejectedPage />
  }

  if (allowedRole === 'manager' && !isManager) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/carer" replace />
  }

  if (allowedRole === 'carer' && !isCarer) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/manager" replace />
  }

  if (allowedRole === 'admin' && !isAdmin) {
    if (isManager) {
      return <Navigate to="/manager" replace />
    }
    return <Navigate to="/carer" replace />
  }

  return <>{children}</>
}

// Auth route - redirect if already logged in
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isManager, isAdmin, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to={isManager ? '/manager' : '/carer'} replace />
  }

  return <>{children}</>
}

// Admin Auth route - redirect if already logged in as admin
function AdminAuthRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

// Wrapper that adds AdminProvider for admin routes
function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="admin">
      <AdminProvider>
        {children}
      </AdminProvider>
    </ProtectedRoute>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <RegisterPage />
          </AuthRoute>
        }
      />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      {/* Admin Auth routes */}
      <Route
        path="/admin/login"
        element={
          <AdminAuthRoute>
            <AdminLoginPage />
          </AdminAuthRoute>
        }
      />

      {/* Admin routes (wrapped with AdminProvider) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/agencies"
        element={
          <AdminRoute>
            <AgenciesPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/agencies/:id"
        element={
          <AdminRoute>
            <AgencyDetailPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/admins"
        element={
          <AdminRoute>
            <AdminsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/activity"
        element={
          <AdminRoute>
            <ActivityLogPage />
          </AdminRoute>
        }
      />

      {/* Manager routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRole="manager">
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/alerts"
        element={
          <ProtectedRoute allowedRole="manager">
            <AlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/alerts/:id"
        element={
          <ProtectedRoute allowedRole="manager">
            <AlertDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/clients"
        element={
          <ProtectedRoute allowedRole="manager">
            <ClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/clients/:id"
        element={
          <ProtectedRoute allowedRole="manager">
            <ClientDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/carers"
        element={
          <ProtectedRoute allowedRole="manager">
            <CarersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/carers/:id"
        element={
          <ProtectedRoute allowedRole="manager">
            <CarerDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Carer routes */}
      <Route
        path="/carer"
        element={
          <ProtectedRoute allowedRole="carer">
            <CarerHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/carer/clients"
        element={
          <ProtectedRoute allowedRole="carer">
            <CarerClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/carer/history"
        element={
          <ProtectedRoute allowedRole="carer">
            <CarerHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/carer/visit/:clientId"
        element={
          <ProtectedRoute allowedRole="carer">
            <VisitEntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/carer/entry/:id"
        element={
          <ProtectedRoute allowedRole="carer">
            <EntryDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
