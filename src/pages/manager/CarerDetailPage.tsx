import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MobileLayout, Header } from '@/components/layout'
import { Card, Button, Select, Badge, Modal } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { User, Users, Mail, Calendar, Settings, ArrowRight, Send } from 'lucide-react'
import type { CarerDeactivationReason } from '@/types'

const DEACTIVATION_REASONS = [
  { value: 'left_organisation', label: 'Left organisation' },
  { value: 'on_long_term_leave', label: 'On long-term leave' },
  { value: 'internal_decision', label: 'Internal decision' },
]

export function CarerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getCarerById,
    getClientById,
    clients,
    deactivateCarer,
    assignCarerToClient,
    resendInvite,
  } = useApp()

  const carer = id ? getCarerById(id) : undefined

  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [deactivationReason, setDeactivationReason] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  if (!carer) {
    return (
      <MobileLayout header={<Header title="Carer" showBack />}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Carer not found</p>
        </div>
      </MobileLayout>
    )
  }

  const assignedClients = carer.assignedClientIds
    .map((id) => getClientById(id))
    .filter((c) => c && c.status === 'active')

  const availableClients = clients.filter(
    (c) => c.status === 'active' && !carer.assignedClientIds.includes(c.id)
  )

  const handleDeactivate = async () => {
    if (!deactivationReason) return
    try {
      await deactivateCarer(carer.id, deactivationReason as CarerDeactivationReason)
      setShowDeactivateModal(false)
      navigate('/manager/carers')
    } catch (err) {
      console.error('Failed to deactivate carer:', err)
    }
  }

  const handleAssign = async () => {
    if (!selectedClientId) return
    try {
      await assignCarerToClient(selectedClientId, carer.id)
      setSelectedClientId('')
      setShowAssignModal(false)
    } catch (err) {
      console.error('Failed to assign client:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'pending':
        return <Badge variant="warning">Pending Setup</Badge>
      case 'inactive':
        return <Badge variant="default">Inactive</Badge>
      default:
        return null
    }
  }

  return (
    <MobileLayout header={<Header title={carer.fullName} showBack />}>
      <div className="space-y-4 pb-6 animate-fade-in">
        {/* Carer Info Card */}
        <Card padding="md">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                carer.status === 'active' ? 'bg-primary-50' : 'bg-slate-100'
              )}
            >
              <User
                className={cn(
                  'w-7 h-7',
                  carer.status === 'active' ? 'text-primary-500' : 'text-slate-400'
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-slate-800">
                  {carer.fullName}
                </h2>
                {getStatusBadge(carer.status)}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">{carer.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">
                Joined {formatDateTime(carer.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">
                {assignedClients.length} client(s) assigned
              </span>
            </div>
          </div>

          {carer.status === 'inactive' && carer.deactivationReason && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Deactivation Reason</p>
              <p className="text-sm text-slate-700 capitalize">
                {carer.deactivationReason.replace(/_/g, ' ')}
              </p>
              {carer.deactivatedAt && (
                <p className="text-xs text-slate-400 mt-1">
                  Deactivated on {formatDateTime(carer.deactivatedAt)}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Resend Invite - only for pending carers */}
        {carer.status === 'pending' && (
          <Button
            variant="outline"
            fullWidth
            loading={resending}
            onClick={async () => {
              setResending(true)
              try {
                await resendInvite(carer.email)
                setResendSuccess(true)
                setTimeout(() => setResendSuccess(false), 3000)
              } catch (err) {
                console.error('Failed to resend invite:', err)
              } finally {
                setResending(false)
              }
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            {resendSuccess ? 'Invite Resent!' : 'Resend Invite Link'}
          </Button>
        )}

        {/* Assigned Clients */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Assigned Clients</h3>
            {carer.status === 'active' && availableClients.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAssignModal(true)}
              >
                Assign Client
              </Button>
            )}
          </div>

          {assignedClients.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No clients assigned
            </p>
          ) : (
            <div className="space-y-2">
              {assignedClients.map(
                (client) =>
                  client && (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => navigate(`/manager/clients/${client.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">
                            {client.displayName}
                          </span>
                          {client.internalReference && (
                            <p className="text-xs text-slate-400">
                              {client.internalReference}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  )
              )}
            </div>
          )}
        </Card>

        {/* Deactivate Action */}
        {carer.status !== 'inactive' && (
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowDeactivateModal(true)}
            className="text-slate-600"
          >
            <Settings className="w-5 h-5 mr-2" />
            Deactivate Carer
          </Button>
        )}
      </div>

      {/* Assign Client Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Client"
      >
        <div className="space-y-4">
          <Select
            label="Select Client"
            options={availableClients.map((c) => ({
              value: c.id,
              label: `${c.displayName}${c.internalReference ? ` (${c.internalReference})` : ''}`,
            }))}
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            placeholder="Choose a client..."
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </Button>
            <Button fullWidth onClick={handleAssign} disabled={!selectedClientId}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Deactivate Carer"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Deactivating this carer will prevent them from logging in. All their
            historical entries and alerts will be preserved.
          </p>
          <Select
            label="Reason"
            options={DEACTIVATION_REASONS}
            value={deactivationReason}
            onChange={(e) => setDeactivationReason(e.target.value)}
            placeholder="Select a reason..."
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowDeactivateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDeactivate}
              disabled={!deactivationReason}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </MobileLayout>
  )
}
