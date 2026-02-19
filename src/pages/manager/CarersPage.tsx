import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileLayout, Header, BottomNav } from '@/components/layout'
import { Card, Button, Input, Badge, Modal } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import { Plus, Search, User, ArrowRight, UserX, Mail, Send } from 'lucide-react'

export function CarersPage() {
  const navigate = useNavigate()
  const { carers, addCarer, resendInvite } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCarerName, setNewCarerName] = useState('')
  const [newCarerEmail, setNewCarerEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [inviteSent, setInviteSent] = useState(false)

  const filteredCarers = carers.filter((carer) => {
    const matchesSearch =
      carer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carer.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (showInactive) return matchesSearch
    return matchesSearch && carer.status !== 'inactive'
  })

  const activeCount = carers.filter((c) => c.status === 'active').length
  const pendingCount = carers.filter((c) => c.status === 'pending').length
  const totalCount = carers.length

  const [addingCarer, setAddingCarer] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [resentId, setResentId] = useState<string | null>(null)

  const handleAddCarer = async () => {
    if (!newCarerName.trim() || !newCarerEmail.trim()) return

    setAddingCarer(true)
    try {
      await addCarer(newCarerName.trim(), newCarerEmail.trim())
      setInviteSent(true)

      setTimeout(() => {
        setNewCarerName('')
        setNewCarerEmail('')
        setEmailError('')
        setShowAddModal(false)
        setInviteSent(false)
      }, 2000)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to invite carer')
    } finally {
      setAddingCarer(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>
      case 'inactive':
        return <Badge variant="default" size="sm">Inactive</Badge>
      default:
        return null
    }
  }

  return (
    <MobileLayout
      header={
        <Header
          title="Carers"
          showLogout
          rightAction={
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              Invite
            </Button>
          }
        />
      }
      footer={<BottomNav />}
      noPadding
    >
      <div className="animate-fade-in">
        {/* Search & Filter */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search carers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowInactive(false)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                !showInactive
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              Active ({activeCount + pendingCount})
            </button>
            <button
              onClick={() => setShowInactive(true)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                showInactive
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              All ({totalCount})
            </button>
          </div>
        </div>

        {/* Carers List */}
        <div className="p-4 space-y-3">
          {filteredCarers.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">No carers found</h3>
              <p className="text-sm text-slate-500">
                {searchQuery
                  ? 'Try a different search term.'
                  : 'Invite your first carer to get started.'}
              </p>
            </Card>
          ) : (
            filteredCarers.map((carer) => (
              <div key={carer.id} className="space-y-2">
                <Card
                  padding="md"
                  interactive
                  onClick={() => navigate(`/manager/carers/${carer.id}`)}
                  className="flex items-center gap-4"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      carer.status === 'active' ? 'bg-primary-50' : 'bg-slate-100'
                    )}
                  >
                    {carer.status === 'inactive' ? (
                      <UserX className="w-6 h-6 text-slate-400" />
                    ) : (
                      <User
                        className={cn(
                          'w-6 h-6',
                          carer.status === 'active'
                            ? 'text-primary-500'
                            : 'text-risk-amber'
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 truncate">
                        {carer.fullName}
                      </p>
                      {getStatusBadge(carer.status)}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{carer.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {carer.assignedClientIds.length} client(s) assigned
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                </Card>
                {carer.status === 'pending' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      setResendingId(carer.id)
                      try {
                        await resendInvite(carer.email)
                        setResentId(carer.id)
                        setTimeout(() => setResentId(null), 3000)
                      } catch (err) {
                        console.error('Failed to resend invite:', err)
                      } finally {
                        setResendingId(null)
                      }
                    }}
                    disabled={resendingId === carer.id}
                    className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-primary-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {resendingId === carer.id
                      ? 'Sending...'
                      : resentId === carer.id
                        ? 'Invite Resent!'
                        : 'Resend Invite Link'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Carer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setInviteSent(false)
          setEmailError('')
        }}
        title="Invite New Carer"
      >
        {inviteSent ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-risk-green-light mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-8 h-8 text-risk-green" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Invite Sent!</h3>
            <p className="text-sm text-slate-500">
              An invitation email has been sent to {newCarerEmail}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              The carer will receive an email with a link to set up their password.
            </p>
            <Input
              label="Full Name"
              value={newCarerName}
              onChange={(e) => setNewCarerName(e.target.value)}
              placeholder="e.g., Emma Wilson"
            />
            <Input
              label="Email Address"
              type="email"
              value={newCarerEmail}
              onChange={(e) => {
                setNewCarerEmail(e.target.value)
                setEmailError('')
              }}
              placeholder="carer@example.com"
              error={emailError}
            />
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={handleAddCarer}
                disabled={!newCarerName.trim() || !newCarerEmail.trim()}
                loading={addingCarer}
              >
                Send Invite
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MobileLayout>
  )
}
