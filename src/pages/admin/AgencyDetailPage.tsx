import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Badge } from '@/components/ui'
import { useAdmin, useAuth } from '@/context/AuthContext'
import { useAdminData } from '@/context/AdminContext'
import {
  Shield,
  LogOut,
  ArrowLeft,
  Building2,
  Users,
  UserCheck,
  Bell,
  Activity,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import type { AgencyStatus, Carer, Client } from '@/types'

export function AgencyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const admin = useAdmin()
  const { logout } = useAuth()
  const {
    getAgencyById,
    getActivityForAgency,
    getCarersForAgency,
    getClientsForAgency,
    updateAgencyStatus,
    approveAgency,
    rejectAgency,
    isLoading,
  } = useAdminData()
  const [activeTab, setActiveTab] = useState<'overview' | 'carers' | 'clients' | 'activity'>(
    'overview'
  )
  const [carers, setCarers] = useState<Carer[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loadingCarers, setLoadingCarers] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState<AgencyStatus>('active')
  const [statusNotes, setStatusNotes] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approving, setApproving] = useState(false)

  const agency = getAgencyById(id || '')
  const agencyActivity = id ? getActivityForAgency(id).slice(0, 10) : []

  // Load carers when tab is selected
  useEffect(() => {
    if (activeTab === 'carers' && id && carers.length === 0) {
      setLoadingCarers(true)
      getCarersForAgency(id)
        .then(setCarers)
        .catch((err) => console.error('Failed to load carers:', err))
        .finally(() => setLoadingCarers(false))
    }
  }, [activeTab, id, getCarersForAgency, carers.length])

  // Load clients when tab is selected
  useEffect(() => {
    if (activeTab === 'clients' && id && clients.length === 0) {
      setLoadingClients(true)
      getClientsForAgency(id)
        .then(setClients)
        .catch((err) => console.error('Failed to load clients:', err))
        .finally(() => setLoadingClients(false))
    }
  }, [activeTab, id, getClientsForAgency, clients.length])

  const handleStatusChange = async () => {
    if (!id) return
    setUpdatingStatus(true)
    try {
      await updateAgencyStatus(id, newStatus, statusNotes || undefined)
      setShowStatusModal(false)
      setStatusNotes('')
    } catch (err) {
      console.error('Failed to update agency status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Agency Not Found</h2>
          <p className="text-slate-400 mb-4">The requested agency could not be found.</p>
          <Button onClick={() => navigate('/admin/agencies')}>Back to Agencies</Button>
        </Card>
      </div>
    )
  }

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
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleApprove = async () => {
    if (!id) return
    setApproving(true)
    try {
      await approveAgency(id)
    } catch (err) {
      console.error('Failed to approve agency:', err)
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) return
    setUpdatingStatus(true)
    try {
      await rejectAgency(id, rejectReason.trim())
      setShowRejectModal(false)
      setRejectReason('')
    } catch (err) {
      console.error('Failed to reject agency:', err)
    } finally {
      setUpdatingStatus(false)
    }
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

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatEventType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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
        {/* Back Link */}
        <Link
          to="/admin/agencies"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Agencies</span>
        </Link>

        {/* Agency Header */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{agency.name}</h2>
                  {getStatusBadge(agency.status)}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {agency.contactEmail}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created {formatDate(agency.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {agency.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApprove}
                    loading={approving}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30"
                    onClick={() => setShowRejectModal(true)}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Reject
                  </Button>
                </>
              )}
              {agency.status === 'rejected' && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleApprove}
                  loading={approving}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approve
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border-amber-600/30"
                onClick={() => {
                  setNewStatus(agency.status)
                  setShowStatusModal(true)
                }}
              >
                Change Status
              </Button>
            </div>
          </div>

          {agency.status === 'rejected' && agency.rejectionReason && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
              <p className="text-sm text-red-400">
                <span className="font-medium text-red-300">Rejection Reason:</span>{' '}
                {agency.rejectionReason}
              </p>
            </div>
          )}

          {agency.notes && (
            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
              <p className="text-sm text-slate-400">
                <span className="font-medium text-slate-300">Notes:</span> {agency.notes}
              </p>
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{agency.totalCarers}</p>
                <p className="text-xs text-slate-500">
                  {agency.activeCarers} active / {agency.totalCarers - agency.activeCarers}{' '}
                  inactive
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">Total Carers</p>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{agency.totalClients}</p>
                <p className="text-xs text-slate-500">
                  {agency.activeClients} active /{' '}
                  {agency.totalClients - agency.activeClients} inactive
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">Total Clients</p>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{agency.totalAlerts}</p>
                <p className="text-xs text-slate-500">
                  {agency.unreviewedAlerts} unreviewed
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">Total Alerts</p>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {agency.lastActivityAt ? formatDate(agency.lastActivityAt) : 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">Last Activity</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('carers')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'carers'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Carers ({agency.totalCarers})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'clients'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Clients ({agency.totalClients})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'activity'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Activity Log
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Agency Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Agency Name</p>
                <p className="text-white">{agency.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <p className="text-white">{getStatusBadge(agency.status)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Primary Contact</p>
                <p className="text-white">{agency.contactName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Contact Email</p>
                <p className="text-white">{agency.contactEmail}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Created</p>
                <p className="text-white">{formatDate(agency.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Last Activity</p>
                <p className="text-white">
                  {agency.lastActivityAt ? formatDate(agency.lastActivityAt) : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'carers' && (
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Carers</h3>
            {loadingCarers ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : carers.length > 0 ? (
              <div className="space-y-3">
                {carers.map((carer) => (
                  <div
                    key={carer.id}
                    className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{carer.fullName}</p>
                        <p className="text-xs text-slate-400">{carer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        {carer.assignedClientIds.length} client{carer.assignedClientIds.length !== 1 ? 's' : ''}
                      </span>
                      <Badge variant={carer.status === 'active' ? 'success' : 'secondary'}>
                        {carer.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Joined {formatShortDate(carer.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                No carers found for this agency.
              </p>
            )}
          </Card>
        )}

        {activeTab === 'clients' && (
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Clients</h3>
            {loadingClients ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clients.length > 0 ? (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{client.displayName}</p>
                        {client.internalReference && (
                          <p className="text-xs text-slate-400">Ref: {client.internalReference}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={client.status === 'active' ? 'success' : 'secondary'}>
                        {client.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Added {formatShortDate(client.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                No clients found for this agency.
              </p>
            )}
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Log</h3>
            {agencyActivity.length > 0 ? (
              <div className="space-y-3">
                {agencyActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 py-3 border-b border-slate-700 last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        <span className="font-medium">
                          {formatEventType(entry.eventType)}
                        </span>
                        {entry.entityName && (
                          <span className="text-slate-400">: {entry.entityName}</span>
                        )}
                      </p>
                      {entry.reason && (
                        <p className="text-xs text-slate-500 mt-1">
                          Reason: {entry.reason}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        by {entry.performedByName} at {formatDate(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                No activity recorded for this agency.
              </p>
            )}
          </Card>
        )}

        {/* Reject Agency Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-2">Reject Agency</h3>
              <p className="text-sm text-slate-400 mb-4">
                Please provide a reason for rejecting <span className="font-medium text-white">{agency.name}</span>.
                This will be shown to the manager.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={3}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-400 resize-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectReason('')
                  }}
                  variant="secondary"
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                  loading={updatingStatus}
                >
                  Reject Agency
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Change Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Change Agency Status
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AgencyStatus)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Reason for status change..."
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setShowStatusModal(false)
                      setStatusNotes('')
                    }}
                    variant="secondary"
                    className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    loading={updatingStatus}
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
