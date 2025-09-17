import { useEffect, useState } from 'react'
import { metaAuthService } from '../services/metaAuth'
import { useSession } from '../contexts/SessionContext'

interface OAuthCallbackProps {
  provider?: 'google' | 'meta'
}

export const OAuthCallback: React.FC<OAuthCallbackProps> = ({ provider = 'google' }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  const { refreshAccounts, checkExistingAuth } = useSession()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        const state = urlParams.get('state')

        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        if (!code) {
          throw new Error('No authorization code received')
        }

        console.log(`🔐 Processing ${provider} OAuth callback with code:`, code)

        if (provider === 'meta') {
          await metaAuthService.exchangeCodeForTokens(code)
          console.log('✅ Meta authentication successful!')

          // Update session context
          await checkExistingAuth()
          await refreshAccounts()
        } else {
          // Handle Google OAuth via session context
          console.log('🔄 Google OAuth handled by SessionContext')
        }

        setStatus('success')

        // Redirect to main app after successful authentication
        setTimeout(() => {
          if (window.opener) {
            // If opened in popup, close popup and reload parent
            window.opener.postMessage({ type: 'oauth-success', provider }, window.location.origin)
            window.close()
          } else {
            // If direct redirect, go to main app
            window.location.href = '/'
          }
        }, 2000)

      } catch (err) {
        console.error(`${provider} OAuth callback error:`, err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStatus('error')
      }
    }

    handleCallback()
  }, [provider, refreshAccounts, checkExistingAuth])

  const providerName = provider === 'meta' ? 'Meta' : 'Google'
  const providerColor = provider === 'meta' ? '#1877F2' : '#4285F4'

  if (status === 'loading') {
    return (
      <div className="oauth-callback min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-300 border-t-current rounded-full animate-spin"
                 style={{ borderTopColor: providerColor }}></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authenticating with {providerName}...</h2>
          <p className="text-gray-600">Please wait while we complete the authentication process.</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="oauth-callback min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-green-600">✅ Authentication Successful!</h2>
          <p className="text-gray-600 mb-2">You have been successfully authenticated with {providerName}.</p>
          <p className="text-sm text-gray-500">
            {window.opener ? 'Closing this window...' : 'Redirecting you back to the application...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="oauth-callback min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
        <div className="mb-4">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-red-600">❌ Authentication Failed</h2>
        <p className="text-gray-600 mb-4">There was an error during authentication:</p>
        <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded">{error}</p>
        <button
          onClick={() => {
            if (window.opener) {
              window.close()
            } else {
              window.location.href = '/'
            }
          }}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {window.opener ? 'Close Window' : 'Return to App'}
        </button>
      </div>
    </div>
  )
}