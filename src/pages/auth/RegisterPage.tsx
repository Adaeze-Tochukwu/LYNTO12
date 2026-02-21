import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MobileLayout } from '@/components/layout'
import { Card, Button, Input, Checkbox } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { Heart, ArrowLeft, CheckCircle } from 'lucide-react'

export function RegisterPage() {
  const { registerAgency } = useAuth()
  const [agencyName, setAgencyName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!agencyName.trim()) {
      newErrors.agencyName = 'Agency name is required'
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the Terms and Conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    try {
      const success = await registerAgency(agencyName, fullName, email, password)
      if (success) {
        setRegistered(true)
      }
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <MobileLayout className="flex flex-col justify-center items-center py-8">
        <div className="w-full max-w-sm animate-fade-in">
          <Card padding="lg" className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4 mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              Registration Submitted!
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Your agency <span className="font-medium text-slate-700">{agencyName}</span> has been
              registered and is now under review. You'll be able to access the dashboard once
              an administrator has approved your account.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-500">
                This usually takes 1-2 business days. You'll be able to log in and check
                your status at any time.
              </p>
            </div>
            <Link to="/login">
              <Button fullWidth variant="secondary">
                Back to Login
              </Button>
            </Link>
          </Card>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout className="flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to login</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 mb-3">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Register Your Agency</h1>
          <p className="text-sm text-slate-500 mt-1">Start monitoring with Lynto</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Agency Name"
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g., Sunrise Care Services"
              error={errors.agencyName}
              required
            />

            <Input
              label="Your Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Sarah Jones"
              error={errors.fullName}
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              error={errors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              error={errors.password}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              error={errors.confirmPassword}
              required
            />

            {errors.form && (
              <p className="text-sm text-risk-red text-center">{errors.form}</p>
            )}

            <div className="mt-4">
              <Checkbox
                id="terms-checkbox"
                variant="inline"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                label={
                  <>
                    I have read and agree to the{' '}
                    <Link
                      to="/terms"
                      className="text-primary-500 hover:text-primary-600 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms and Conditions
                    </Link>
                  </>
                }
              />
              {errors.terms && (
                <p className="text-xs text-risk-red mt-1 ml-8">{errors.terms}</p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={
                !agencyName.trim() ||
                !fullName.trim() ||
                !email.trim() ||
                !password ||
                !confirmPassword ||
                !termsAccepted
              }
              className="mt-6"
            >
              Create Agency Account
            </Button>
          </form>
        </Card>
      </div>
    </MobileLayout>
  )
}
