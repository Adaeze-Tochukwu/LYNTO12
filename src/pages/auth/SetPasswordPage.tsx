import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileLayout } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Heart } from 'lucide-react'

export function SetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Handle the recovery token from the URL hash
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
        if (session?.user?.email) {
          setUserEmail(session.user.email)
        }
      }
    })

    // Also check if we already have a recovery session (e.g. from hash fragment)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
        if (session.user?.email) {
          setUserEmail(session.user.email)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Activate the user profile
      await supabase.rpc('activate_user')

      // Sign out so the user can log in fresh with their new password
      await supabase.auth.signOut()

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <MobileLayout className="flex flex-col justify-center items-center">
        <div className="w-full max-w-sm animate-fade-in text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Password Set!</h1>
          <p className="text-slate-500 mb-1">Your account is now active.</p>
          {userEmail && (
            <p className="text-sm text-slate-400 mb-6">
              Sign in with <span className="font-medium text-slate-600">{userEmail}</span>
            </p>
          )}
          <Button fullWidth onClick={() => navigate('/login')}>
            Go to Sign In
          </Button>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout className="flex flex-col justify-center items-center">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to Lynto</h1>
          <p className="text-slate-500 mt-1">Set a password to activate your account</p>
          {userEmail && (
            <p className="text-sm text-slate-400 mt-2">{userEmail}</p>
          )}
        </div>

        {!sessionReady ? (
          <Card padding="lg" className="text-center">
            <p className="text-slate-500">Loading your session...</p>
            <p className="text-sm text-slate-400 mt-2">
              If this takes too long, the link may have expired. Please request a new invite.
            </p>
          </Card>
        ) : (
          <Card padding="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
              />

              {error && (
                <p className="text-sm text-risk-red text-center">{error}</p>
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!password || !confirmPassword}
              >
                Set Password & Activate Account
              </Button>
            </form>
          </Card>
        )}
      </div>
    </MobileLayout>
  )
}
