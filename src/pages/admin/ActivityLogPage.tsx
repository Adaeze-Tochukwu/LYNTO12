import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Input } from '@/components/ui'
import { useAdmin, useAuth } from '@/context/AuthContext'
import { useAdminData } from '@/context/AdminContext'
import {
  Shield,
  LogOut,
  Search,
  Filter,
  Building2,
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  LogIn,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { ActivityEventType } from '@/types'

export function ActivityLogPage() {
  const admin = useAdmin()
  const { logout } = useAuth()
  const { activityLog, agencies, isLoading } = useAdminData()
  const [searchTerm, setSearchTerm] = useState('')
  const [eventFilter, setEventFilter] = useState<ActivityEventType | 'all'>('all')
  const [agencyFilter, setAgencyFilter] = useState<string>('all')

  const filteredLogs = activityLog.filter((log) => {
    const matchesSearch =
      log.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (log.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesEvent = eventFilter === 'all' || log.eventType === eventFilter
    const matchesAgency = agencyFilter === 'all' || log.agencyId === agencyFilter
    return matchesSearch && matchesEvent && matchesAgency
  })

  const getEventIcon = (type: ActivityEventType) => {
    switch (type) {
      case 'agency_created':
      case 'agency_status_changed':
        return <Building2 className="w-4 h-4 text-blue-400" />
      case 'carer_created':
        return <UserPlus className="w-4 h-4 text-green-400" />
      case 'carer_deactivated':
        return <UserMinus className="w-4 h-4 text-red-400" />
      case 'carer_reactivated':
        return <Users className="w-4 h-4 text-green-400" />
      case 'client_created':
        return <UserPlus className="w-4 h-4 text-purple-400" />
      case 'client_deactivated':
        return <UserMinus className="w-4 h-4 text-red-400" />
      case 'client_reactivated':
        return <UserCheck className="w-4 h-4 text-green-400" />
      case 'admin_created':
      case 'admin_reactivated':
        return <Shield className="w-4 h-4 text-indigo-400" />
      case 'admin_deactivated':
        return <Shield className="w-4 h-4 text-red-400" />
      case 'admin_login':
      case 'admin_logout':
        return <LogIn className="w-4 h-4 text-slate-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />
    }
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

  const eventTypes: ActivityEventType[] = [
    'agency_created',
    'agency_status_changed',
    'carer_created',
    'carer_deactivated',
    'carer_reactivated',
    'client_created',
    'client_deactivated',
    'client_reactivated',
    'admin_created',
    'admin_deactivated',
    'admin_reactivated',
    'admin_login',
    'admin_logout',
  ]

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
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
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
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg"
          >
            Activity Log
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Activity Log ({filteredLogs.length})
          </h2>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Filters</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <select
              value={eventFilter}
              onChange={(e) =>
                setEventFilter(e.target.value as ActivityEventType | 'all')
              }
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Events</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {formatEventType(type)}
                </option>
              ))}
            </select>
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Agencies</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          /* Activity List */
          <Card className="bg-slate-800 border-slate-700 p-4">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 py-4 border-b border-slate-700 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                      {getEventIcon(entry.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-white">
                            <span className="font-medium">
                              {formatEventType(entry.eventType)}
                            </span>
                            {entry.agencyName && (
                              <span className="text-slate-400">
                                {' '}
                                - {entry.agencyName}
                              </span>
                            )}
                            {entry.entityName && (
                              <span className="text-slate-400">
                                : {entry.entityName}
                              </span>
                            )}
                          </p>
                          {entry.reason && (
                            <p className="text-xs text-slate-500 mt-1">
                              Reason: {entry.reason}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Performed by {entry.performedByName}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                No activity found matching your filters.
              </p>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}
