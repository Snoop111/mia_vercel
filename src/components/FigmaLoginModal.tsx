import { motion } from 'framer-motion'
import { useSession } from '../contexts/SessionContext'
import { useState } from 'react'

interface FigmaLoginModalProps {
  onAuthSuccess?: () => void
}

const FigmaLoginModal = ({ onAuthSuccess }: FigmaLoginModalProps) => {
  const { login, isLoading: sessionLoading, error, sessionId, checkExistingAuth, refreshAccounts } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const handleLoginClick = async (method: string) => {
    if (method === 'Google') {
      try {
        setIsLoading(true)
        setLoadingMessage('Opening Google sign-in...')
        console.log('🔐 Starting Google OAuth with popup flow...')

        // Use new SessionContext login method
        const success = await login()

        if (success) {
          console.log('✅ Authentication successful!')
          setLoadingMessage('Authentication successful!')

          // Trigger the auth success callback immediately
          if (onAuthSuccess) {
            console.log('🔄 Calling onAuthSuccess callback')
            onAuthSuccess()
          } else {
            console.warn('⚠️ No onAuthSuccess callback provided')
          }
        } else {
          throw new Error('Authentication failed')
        }

      } catch (error) {
        console.error('💥 Error during OAuth:', error)
        if (error instanceof Error) {
          alert(`Authentication failed: ${error.message}`)
        } else {
          alert('Authentication failed. Please try again.')
        }
        setIsLoading(false)
        setLoadingMessage('')
      }
    } else if (method === 'Login') {
      // BYPASS: Black "Log in" button simulates authentication for mobile testing
      console.log('🚀 Login Bypass - creating authenticated session for mobile testing')

      try {
        setIsLoading(true)
        setLoadingMessage('Creating bypass session...')

        // Use the SessionContext's session ID for consistency

        // Call the new bypass endpoint which creates a complete authenticated session
        const bypassResponse = await fetch('/api/oauth/bypass-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          }
        })

        if (!bypassResponse.ok) {
          const errorData = await bypassResponse.json().catch(() => ({}))
          throw new Error(errorData.detail || 'Bypass login failed')
        }

        const bypassData = await bypassResponse.json()
        console.log('✅ Bypass login successful:', bypassData)

        setLoadingMessage('Session created! Redirecting...')

        // Force the SessionContext to check auth status with the bypass session
        // Check authentication status with the bypass session ID
        const authStatusResponse = await fetch('/api/oauth/google/status', {
          headers: {
            'X-Session-ID': sessionId
          }
        })

        if (authStatusResponse.ok) {
          const authData = await authStatusResponse.json()
          console.log('🔍 Auth status after bypass:', authData)

          if (authData.authenticated) {
            // Update SessionContext by refreshing auth
            const authSuccess = await checkExistingAuth()
            if (authSuccess) {
              await refreshAccounts()
            }
          }
        }

        // Small delay for UX
        setTimeout(() => {
          console.log('🔄 Login bypass complete - calling onAuthSuccess')
          if (onAuthSuccess) {
            onAuthSuccess()
          }
          setIsLoading(false)
        }, 200)

      } catch (error) {
        console.error('💥 Login bypass failed:', error)
        alert(`Login bypass failed: ${error instanceof Error ? error.message : 'Please try again.'}`)
        setIsLoading(false)
        setLoadingMessage('')
      }
    } else {
      console.log(`${method} login not implemented yet`)
      alert(`${method} login coming soon!`)
    }
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed left-0 right-0 z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        bottom: '-15px' // Push modal DOWN (away from text)
      }}
    >
      {/* White Modal - Height reduced, full width maintained */}
      <div
        className="bg-white rounded-t-[38px] px-6 py-3 shadow-2xl touch-manipulation"
        style={{
          touchAction: 'manipulation',
          height: '260px', // Slightly taller to prevent cutoff, but still shorter than original
          width: '100%' // Ensure full width coverage
        }}
      >
        {/* Continue with Apple Button */}
        <button
          onClick={() => handleLoginClick('Apple')}
          className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-6 mb-2 flex items-center justify-center space-x-3 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px]"
        >
          <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          </div>
          <span className="text-gray-900 font-medium">Continue with Apple</span>
        </button>

        {/* Continue with Google Button */}
        <button
          onClick={() => handleLoginClick('Google')}
          disabled={isLoading}
          className={`w-full border border-gray-200 rounded-2xl py-3 px-6 mb-2 flex items-center justify-center space-x-3 transition-colors touch-manipulation min-h-[44px] ${
            isLoading
              ? 'bg-gray-100 cursor-not-allowed'
              : 'bg-white hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium">{loadingMessage}</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-900 font-medium">Continue with Google</span>
            </>
          )}
        </button>

        {/* Sign up with email Button */}
        <button
          onClick={() => handleLoginClick('Email')}
          className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-6 mb-2 flex items-center justify-center space-x-3 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px]"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-600">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          <span className="text-gray-900 font-medium">Sign up with email</span>
        </button>

        {/* Log in Button - Black */}
        <button
          onClick={() => handleLoginClick('Login')}
          className="w-full bg-black text-white rounded-2xl py-3 px-6 font-medium hover:bg-gray-800 active:bg-gray-700 transition-colors touch-manipulation min-h-[44px]"
        >
          Log in
        </button>
      </div>
    </motion.div>
  )
}

export default FigmaLoginModal