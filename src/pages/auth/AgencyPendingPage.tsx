import { MobileLayout } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { Clock, LogOut } from 'lucide-react'

export function AgencyPendingPage() {
  const { agency, logout } = useAuth()

  return (
    <MobileLayout className="flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-sm animate-fade-in">
        <Card padding="lg" className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4 mx-auto">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Your Agency is Under Review
          </h1>

          {agency && (
            <p className="text-sm font-medium text-primary-600 mb-3">
              {agency.name}
            </p>
          )}

          <p className="text-sm text-slate-500 mb-6">
            Your registration has been submitted and is being reviewed by our team.
            You'll be able to access the dashboard once your agency has been approved.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-slate-500">
              This usually takes 1-2 business days. If you have any questions,
              please contact our support team.
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
