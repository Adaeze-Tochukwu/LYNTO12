import { MobileLayout } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { XCircle, LogOut } from 'lucide-react'

export function AgencyRejectedPage() {
  const { agency, rejectionReason, logout } = useAuth()

  return (
    <MobileLayout className="flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-sm animate-fade-in">
        <Card padding="lg" className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4 mx-auto">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Registration Not Approved
          </h1>

          {agency && (
            <p className="text-sm font-medium text-slate-600 mb-3">
              {agency.name}
            </p>
          )}

          <p className="text-sm text-slate-500 mb-4">
            Unfortunately, your agency registration was not approved.
          </p>

          {rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs font-medium text-red-700 mb-1">Reason</p>
              <p className="text-sm text-red-600">{rejectionReason}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-slate-500">
              If you believe this was a mistake or would like more information,
              please contact our support team for assistance.
            </p>
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={logout}
            className="flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </Card>
      </div>
    </MobileLayout>
  )
}
