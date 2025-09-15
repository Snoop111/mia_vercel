import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from '../contexts/SessionContext'

interface LoginPageProps {
  onLoginSuccess: () => void
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const { login, isLoading, error, clearError } = useSession()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleLogin = async () => {
    if (isAuthenticating || isLoading) return

    setIsAuthenticating(true)
    clearError()

    try {
      const success = await login()

      if (success) {
        // Small delay for UX
        setTimeout(() => {
          onLoginSuccess()
        }, 500)
      }
    } catch (err) {
      console.error('[LOGIN] Error during login:', err)
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center" style={{ maxWidth: '393px', margin: '0 auto' }}>
      <div className="w-full px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-purple-600">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-4">Welcome to Mia</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Your AI-powered marketing intelligence assistant
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4"
          >
            <p className="text-red-200 text-sm text-center">{error}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-white font-semibold text-lg mb-4 text-center">Get Started</h3>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-blue-100 text-sm">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Analyze your Google Ads performance
              </li>
              <li className="flex items-center text-blue-100 text-sm">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Get insights from Google Analytics 4
              </li>
              <li className="flex items-center text-blue-100 text-sm">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Optimize creative assets with AI
              </li>
            </ul>

            <button
              onClick={handleLogin}
              disabled={isAuthenticating || isLoading}
              className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-3 ${
                isAuthenticating || isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              {isAuthenticating || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-blue-200 text-xs leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              <br />
              We'll securely access your Google Ads and Analytics data.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage