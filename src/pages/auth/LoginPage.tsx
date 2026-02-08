import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MobileLayout } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { Heart } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        // Navigation will be handled by auth state change
        // For now, check role from response or redirect to a common entry point
        navigate('/manager')
      } else {
        setError(result.error || 'Invalid email or password. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MobileLayout className="flex flex-col justify-center items-center">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Lynto</h1>
          <p className="text-slate-500 mt-1">Clinical Patient Monitoring</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-xl font-semibold text-center mb-6">Sign In</h2>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@company.co.uk"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-risk-red text-center">{error}</p>
            )}

            <Button type="submit" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>
        </Card>

        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-slate-500">
            Don't have an agency yet?{' '}
            <Link
              to="/register"
              className="text-primary-500 font-medium hover:underline"
            >
              Register Agency
            </Link>
          </p>

          {/* Setup note */}
          <div className="text-xs text-slate-400 mt-4 p-3 bg-slate-100 rounded-xl">
            <p className="font-medium mb-1">Getting Started:</p>
            <p>Register your agency to create a manager account,</p>
            <p>or sign in with your credentials.</p>
          </div>
        </div>
      </div>
    </MobileLayout>
  )
}
