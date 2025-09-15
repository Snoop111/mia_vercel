import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AccountMapping {
  id: string
  name: string
  google_ads_id: string
  ga4_property_id: string
  business_type: string
  color: string
  display_name: string
}

export interface UserProfile {
  name: string
  email: string
  picture_url: string
  google_user_id: string
}

export interface SessionState {
  // Authentication state
  isAuthenticated: boolean
  isLoading: boolean

  // User information
  user: UserProfile | null

  // Session information
  sessionId: string | null

  // Account selection
  selectedAccount: AccountMapping | null
  availableAccounts: AccountMapping[]

  // Error state
  error: string | null
}

export interface SessionActions {
  // Authentication actions
  login: () => Promise<boolean>
  logout: () => Promise<void>

  // Account selection actions
  selectAccount: (accountId: string) => Promise<boolean>
  refreshAccounts: () => Promise<void>

  // Utility actions
  clearError: () => void
  generateSessionId: () => string
  checkExistingAuth: () => Promise<boolean>
}

type SessionContextType = SessionState & SessionActions

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

interface SessionProviderProps {
  children: ReactNode
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [state, setState] = useState<SessionState>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    sessionId: null,
    selectedAccount: null,
    availableAccounts: [],
    error: null
  })

  // Generate a unique session ID
  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Initialize session on mount - but don't auto-authenticate to allow video intro
  useEffect(() => {
    const initializeSession = async () => {
      setState(prev => ({ ...prev, isLoading: true }))

      try {
        // Generate session ID
        const sessionId = generateSessionId()

        // For now, just initialize with session ID and let explicit login handle auth
        // This prevents auto-skipping the video intro
        setState(prev => ({
          ...prev,
          sessionId: sessionId,
          isLoading: false
        }))

        console.log('[SESSION] Initialized with session ID:', sessionId)
      } catch (error) {
        console.error('[SESSION] Initialization error:', error)
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize session',
          sessionId: generateSessionId(),
          isLoading: false
        }))
      }
    }

    initializeSession()
  }, [])

  const login = async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get auth URL
      const authUrlResponse = await fetch('/api/oauth/google/auth-url')

      if (!authUrlResponse.ok) {
        throw new Error('Failed to get auth URL')
      }

      const authData = await authUrlResponse.json()

      // Open popup for OAuth
      const popup = window.open(
        authData.auth_url,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.')
      }

      // Poll for completion
      return new Promise((resolve) => {
        const pollTimer = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(pollTimer)

              // Complete OAuth by creating database session
              try {
                console.log('[SESSION] Completing OAuth and creating database session...')
                const completeResponse = await fetch('/api/oauth/google/complete', {
                  method: 'POST',
                  headers: {
                    'X-Session-ID': state.sessionId
                  }
                })

                if (!completeResponse.ok) {
                  throw new Error(`OAuth complete failed: ${completeResponse.status}`)
                }

                const completeData = await completeResponse.json()
                console.log('[SESSION] OAuth complete response:', completeData)
              } catch (error) {
                console.error('[SESSION] OAuth complete error:', error)
                setState(prev => ({
                  ...prev,
                  isLoading: false,
                  error: 'Failed to complete authentication session'
                }))
                resolve(false)
                return
              }

              // Check auth status
              const statusResponse = await fetch('/api/oauth/google/status', {
                headers: {
                  'X-Session-ID': state.sessionId
                }
              })
              if (statusResponse.ok) {
                const statusData = await statusResponse.json()

                if (statusData.authenticated) {
                  // Fetch accounts
                  await refreshAccounts()

                  setState(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    isLoading: false,
                    user: {
                      name: statusData.name || 'User',
                      email: statusData.email || '',
                      picture_url: statusData.picture || '',
                      google_user_id: statusData.user_id || ''
                    }
                  }))

                  resolve(true)
                } else {
                  setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Authentication failed'
                  }))
                  resolve(false)
                }
              } else {
                setState(prev => ({
                  ...prev,
                  isLoading: false,
                  error: 'Failed to verify authentication'
                }))
                resolve(false)
              }
            }
          } catch (error) {
            clearInterval(pollTimer)
            console.error('[SESSION] Auth polling error:', error)
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Authentication failed'
            }))
            resolve(false)
          }
        }, 1000)

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollTimer)
          if (!popup.closed) {
            popup.close()
          }
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Authentication timed out'
          }))
          resolve(false)
        }, 300000)
      })
    } catch (error) {
      console.error('[SESSION] Login error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }))
      return false
    }
  }

  const logout = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      await fetch('/api/oauth/google/logout', { method: 'POST' })

      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        sessionId: generateSessionId(),
        selectedAccount: null,
        availableAccounts: [],
        error: null
      })
    } catch (error) {
      console.error('[SESSION] Logout error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Logout failed'
      }))
    }
  }

  const refreshAccounts = async (): Promise<void> => {
    try {
      console.log('[SESSION] Fetching accounts from /api/accounts/available')
      const response = await fetch('/api/accounts/available')

      if (response.ok) {
        const data = await response.json()
        console.log('[SESSION] Received accounts:', data.accounts?.length || 0)
        setState(prev => ({
          ...prev,
          availableAccounts: data.accounts || []
        }))
      } else {
        console.error('[SESSION] Accounts API failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('[SESSION] Failed to refresh accounts:', error)
    }
  }

  const selectAccount = async (accountId: string): Promise<boolean> => {
    if (!state.sessionId) {
      setState(prev => ({ ...prev, error: 'No session ID available' }))
      return false
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('[SESSION] Selecting account:', accountId, 'with session:', state.sessionId)

      const response = await fetch('/api/accounts/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': state.sessionId
        },
        body: JSON.stringify({
          account_id: accountId,
          session_id: state.sessionId
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[SESSION] Account selection API response:', data)

        // Find the full account details
        const account = state.availableAccounts.find(acc => acc.id === accountId)
        console.log('[SESSION] Setting selected account:', account?.name)

        setState(prev => ({
          ...prev,
          selectedAccount: account || null,
          isLoading: false
        }))

        return true
      } else {
        console.error('[SESSION] Account selection API failed:', response.status, response.statusText)
        throw new Error('Failed to select account')
      }
    } catch (error) {
      console.error('[SESSION] Account selection error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Account selection failed'
      }))
      return false
    }
  }

  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }))
  }

  const checkExistingAuth = async (): Promise<boolean> => {
    try {
      const authResponse = await fetch('/api/oauth/google/status')
      if (authResponse.ok) {
        const authData = await authResponse.json()
        if (authData.authenticated) {
          // Fetch available accounts
          await refreshAccounts()

          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: {
              name: authData.name || 'User',
              email: authData.email || '',
              picture_url: authData.picture || '',
              google_user_id: authData.user_id || ''
            }
          }))
          return true
        }
      }
    } catch (error) {
      console.error('[SESSION] Error checking existing auth:', error)
    }
    return false
  }

  const contextValue: SessionContextType = {
    ...state,
    login,
    logout,
    selectAccount,
    refreshAccounts,
    clearError,
    generateSessionId,
    checkExistingAuth
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}