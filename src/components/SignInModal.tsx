import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { SignInCredentials, SignUpCredentials } from '../types'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signIn, signUp, resetPassword, continueAsGuest, authState } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  })

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: '',
    })
    setError(null)
    setSuccess(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleModeChange = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode)
    resetForm()
  }

  const validateForm = (): boolean => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    if (mode === 'reset') return true

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (mode === 'signup') {
      if (!formData.displayName || formData.displayName.trim().length < 2) {
        setError('Display name must be at least 2 characters long')
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateForm()) return

    try {
      if (mode === 'signin') {
        const credentials: SignInCredentials = {
          email: formData.email,
          password: formData.password,
        }
        await signIn(credentials)
        onClose()
      } else if (mode === 'signup') {
        const credentials: SignUpCredentials = {
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName.trim(),
          confirmPassword: formData.confirmPassword,
        }
        await signUp(credentials)
        onClose()
      } else if (mode === 'reset') {
        await resetPassword(formData.email)
        setSuccess('Password reset email sent! Check your inbox.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleContinueAsGuest = () => {
    continueAsGuest()
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  if (!isOpen) return null

  // Debug log for mobile testing
  console.log('SignInModal render:', { 
    isOpen, 
    mode, 
    showGuestButton: mode === 'signin' || mode === 'signup',
    userAgent: navigator.userAgent.includes('Mobile')
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">
            {mode === 'signin' && 'Sign In to Kanban'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <button
            className="auth-modal-close"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="auth-modal-content">
          {/* Demo credentials notice */}
          {mode === 'signin' && (
            <div className="demo-notice">
              <p><strong>Demo:</strong> email: demo@example.com, password: password</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-group">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="form-input with-icon"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Display name field (signup only) */}
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="displayName" className="form-label">
                  Display Name
                </label>
                <div className="input-group">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Enter your display name"
                    className="form-input with-icon"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* Password field (not for reset) */}
            {mode !== 'reset' && (
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-group">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="form-input with-icon with-toggle"
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm password field (signup only) */}
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="input-group">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="form-input with-icon with-toggle"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={authState.isLoading}
            >
              {authState.isLoading ? (
                <span>
                  {mode === 'signin' && 'Signing In...'}
                  {mode === 'signup' && 'Creating Account...'}
                  {mode === 'reset' && 'Sending Reset Email...'}
                </span>
              ) : (
                <span>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Email'}
                </span>
              )}
            </button>

            {/* Forgot password link (signin only) */}
            {mode === 'signin' && (
              <button
                type="button"
                className="auth-link"
                onClick={() => handleModeChange('reset')}
              >
                Forgot your password?
              </button>
            )}

            {/* Continue as Guest button (signin and signup only) */}
            {(mode === 'signin' || mode === 'signup') && (
              <button
                type="button"
                className="btn btn-secondary btn-full guest-btn"
                onClick={handleContinueAsGuest}
                style={{
                  marginTop: '1rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '2px solid var(--accent-primary)',
                  color: 'var(--text-primary)',
                  padding: '1rem',
                  fontSize: '1rem',
                  display: 'block',
                  width: '100%'
                }}
              >
                🚀 Continue as Guest
              </button>
            )}
          </form>

          {/* Mode switcher */}
          <div className="auth-footer">
            {mode === 'signin' && (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => handleModeChange('signup')}
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => handleModeChange('signin')}
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <p>
                Remember your password?{' '}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => handleModeChange('signin')}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}