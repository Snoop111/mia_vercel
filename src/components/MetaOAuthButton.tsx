import { useState, useEffect } from 'react'
import { metaAuthService, MetaUserInfo } from '../services/metaAuth'

interface MetaOAuthButtonProps {
  onAuthSuccess?: (userInfo: MetaUserInfo) => void
  onAuthError?: (error: string) => void
  className?: string
  variant?: 'modal' | 'standalone'
}

export const MetaOAuthButton: React.FC<MetaOAuthButtonProps> = ({
  onAuthSuccess,
  onAuthError,
  className = '',
  variant = 'modal'
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState<MetaUserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      if (metaAuthService.isUserAuthenticated()) {
        const info = await metaAuthService.getUserInfo()
        if (info) {
          setUserInfo(info)
          setIsAuthenticated(true)
          onAuthSuccess?.(info)
        }
      }
    } catch (error) {
      console.error('Error checking Meta auth status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      console.log('🔐 Starting Meta OAuth flow...')

      const authUrl = await metaAuthService.getAuthUrl()
      console.log('📱 Redirecting to Meta OAuth URL:', authUrl)

      // Use popup for better UX in modal variant
      if (variant === 'modal') {
        const popup = window.open(
          authUrl,
          'meta-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )

        // Monitor popup for completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            setTimeout(() => {
              checkAuthStatus()
              setIsLoading(false)
            }, 1000)
          }
        }, 1000)
      } else {
        // Direct redirect for standalone variant
        window.location.href = authUrl
      }
    } catch (error) {
      console.error('Error getting Meta auth URL:', error)
      onAuthError?.('Failed to get Meta authorization URL')
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await metaAuthService.logout()
      setIsAuthenticated(false)
      setUserInfo(null)
    } catch (error) {
      console.error('Error during Meta logout:', error)
    }
  }

  if (loading) {
    return (
      <button disabled className={`oauth-button loading ${className}`}>
        <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
        <span>Loading...</span>
      </button>
    )
  }

  if (isAuthenticated && userInfo) {
    return (
      <div className={`oauth-container ${className}`}>
        <div className="user-info">
          <div className="profile-icon meta">
            <img
              src="/icons/meta-color.svg"
              alt="Meta"
              className="w-6 h-6"
            />
          </div>
          <span className="font-medium">{userInfo.name}</span>
          {userInfo.email && <span className="email text-sm text-gray-600">{userInfo.email}</span>}
        </div>
        <button onClick={handleLogout} className="oauth-button logout">
          Logout
        </button>
      </div>
    )
  }

  const baseButtonClasses = variant === 'modal'
    ? "w-full border border-gray-200 rounded-2xl py-3 px-6 mb-2 flex items-center justify-center space-x-3 transition-colors touch-manipulation min-h-[44px]"
    : "oauth-button login meta"

  const buttonClasses = isLoading
    ? `${baseButtonClasses} bg-gray-100 cursor-not-allowed`
    : `${baseButtonClasses} bg-white hover:bg-gray-50 active:bg-gray-100`

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`${buttonClasses} ${className}`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Connecting to Meta...</span>
        </>
      ) : (
        <>
          <div className="w-5 h-5 flex items-center justify-center">
            <img
              src="/icons/meta-color.svg"
              alt="Meta"
              className="w-5 h-5"
            />
          </div>
          <span className="text-gray-900 font-medium">
            {variant === 'modal' ? 'Continue with Meta' : 'Sign in with Meta for Ads Access'}
          </span>
        </>
      )}
    </button>
  )
}