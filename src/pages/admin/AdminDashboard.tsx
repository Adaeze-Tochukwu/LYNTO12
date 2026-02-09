import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'
import { useAdmin, useAuth } from '@/context/AuthContext'
import { useAdminData } from '@/context/AdminContext'
import {
  Building2,
  Users,
  UserCheck,
  Bell,
  Activity,
  Shield,
  LogOut,
  ChevronRight,
  Loader2,
} from 'lucide-react'

export function AdminDashboard() {
  const admin = useAdmin()
  const { logout } = useAuth()
  const { agencies, activityLog, isLoading } = useAdminData()

  const recentActivity = activityLog.slice(0, 5)

  // Compute global stats from agencies
  const stats = {
    totalAgencies: agencies.length,
    activeAgencies: agencies.filter((a) => a.status === 'active').length,
    inactiveAgencies: agencies.filter((a) => a.status !== 'active').length,
    totalCarers: agencies.reduce((sum, a) => sum + a.totalCarers, 0),
    activeCarers: agencies.reduce((sum, a) => sum + a.activeCarers, 0),
    inactiveCarers: agencies.reduce((sum, a) => sum + a.totalCarers - a.activeCarers, 0),
    totalClients: agencies.reduce((sum, a) => sum + a.totalClients, 0),
    activeClients: agencies.reduce((sum, a) => sum + a.activeClients, 0),
    inactiveClients: agencies.reduce((sum, a) => sum + a.totalClients - a.activeClients, 0),
    totalAlerts: agencies.reduce((sum, a) => sum + a.totalAlerts, 0),
    unreviewedAlerts: agencies.reduce((sum, a) => sum + a.unreviewedAlerts, 0),
    reviewedAlerts: agencies.reduce((sum, a) => sum + a.totalAlerts - a.unreviewedAlerts, 0),
  }

  const formatEventType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">LYNTO Admin</h1>
              <p className="text-xs text-slate-400">Platform Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">{admin?.fullName}</span>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 px-4 py-2">
        <div className="max-w-6xl mx-auto flex gap-1">
          <Link
            to="/admin"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/agencies"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Agencies
          </Link>
          <Link
            to="/admin/admins"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Admins
          </Link>
          <Link
            to="/admin/activity"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Activity Log
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-white mb-6">Global Dashboard</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {/* Agencies */}
              <Card className="bg-slate-800 border-slate-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">Agencies</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalAgencies}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.activeAgencies} active / {stats.inactiveAgencies} inactive
                </p>
              </Card>

              {/* Carers */}
              <Card className="bg-slate-800 border-slate-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">Carers</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalCarers}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.activeCarers} active / {stats.inactiveCarers} inactive
                </p>
              </Card>

              {/* Clients */}
              <Card className="bg-slate-800 border-slate-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">Clients</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalClients}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.activeClients} active / {stats.inactiveClients} inactive
                </p>
              </Card>

              {/* Alerts */}
              <Card className="bg-slate-800 border-slate-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">Alerts</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalAlerts}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.unreviewedAlerts} unreviewed / {stats.reviewedAlerts} reviewed
                </p>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                </div>
                <Link
                  to="/admin/activity"
                  className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 py-3 border-b border-slate-700 last:border-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">
                          <span className="font-medium">{formatEventType(entry.eventType)}</span>
                          {entry.agencyName && (
                            <span className="text-slate-400"> - {entry.agencyName}</span>
                          )}
                          {entry.entityName && (
                            <span className="text-slate-400">: {entry.entityName}</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          by {entry.performedByName} at {formatDate(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No recent activity.</p>
                )}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
