import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Input, Badge } from '@/components/ui'
import { useAdmin, useAuth } from '@/context/AuthContext'
import { useAdminData } from '@/context/AdminContext'
import {
  Shield,
  LogOut,
  Search,
  Building2,
  Users,
  UserCheck,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import type { AgencyStatus } from '@/types'

export function AgenciesPage() {
  const admin = useAdmin()
  const { logout } = useAuth()
  const { agencies, isLoading } = useAdminData()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AgencyStatus | 'all'>('all')

  const filteredAgencies = agencies.filter((agency) => {
    const matchesSearch =
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || agency.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: AgencyStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'suspended':
        return <Badge variant="warning">Suspended</Badge>
      case 'pending':
        return <Badge variant="info">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/agencies"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg"
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Agencies ({filteredAgencies.length})
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AgencyStatus | 'all')}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          /* Agencies List */
          <div className="space-y-3">
            {filteredAgencies.map((agency) => (
              <Link key={agency.id} to={`/admin/agencies/${agency.id}`}>
                <Card className="bg-slate-800 border-slate-700 p-4 hover:bg-slate-750 hover:border-slate-600 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{agency.name}</h3>
                          {getStatusBadge(agency.status)}
                        </div>
                        <p className="text-sm text-slate-400 mt-0.5">
                          {agency.contactName} - {agency.contactEmail}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Created {formatDate(agency.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-medium text-white">
                            {agency.activeCarers}/{agency.totalCarers}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Carers</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-slate-400">
                          <UserCheck className="w-4 h-4" />
                          <span className="text-sm font-medium text-white">
                            {agency.activeClients}/{agency.totalClients}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Clients</p>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-amber-400">
                          {agency.unreviewedAlerts}
                        </span>
                        <p className="text-xs text-slate-500">Unreviewed</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

            {filteredAgencies.length === 0 && (
              <Card className="bg-slate-800 border-slate-700 p-8 text-center">
                <p className="text-slate-400">No agencies found matching your criteria.</p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
