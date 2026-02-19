import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileLayout } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { Shield } from 'lucide-react'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { adminLogin, forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await adminLogin(email, password)
      if (success) {
        navigate('/admin')
      } else {
        setError('Invalid email or password')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first.')
      return
    }
    setResetLoading(true)
    setError('')
    try {
      await forgotPassword(email.trim())
      setResetSent(true)
    } catch {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <MobileLayout className="flex flex-col justify-center items-center min-h-screen py-8 bg-slate-900">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-slate-400 mt-2">LYNTO Platform Administration</p>
        </div>

        <Card padding="lg" className="bg-slate-800 border-slate-700">
          {resetSent ? (
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
              <p className="text-sm text-slate-400 mb-4">
                A password reset link has been sent to {email}
              </p>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setResetSent(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lynto.com"
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                className="bg-indigo-600 hover:bg-indigo-700 mt-6"
              >
                Sign In to Admin Portal
              </Button>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="w-full text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                {resetLoading ? 'Sending...' : 'Forgot your password?'}
              </button>
            </form>
          )}
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          Platform Admin access only.
        </p>
      </div>
    </MobileLayout>
  )
}
