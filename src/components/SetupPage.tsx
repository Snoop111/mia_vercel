import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CombinedAccount } from '../services/accountService'

interface SetupPageProps {
  onSetupComplete: (account: CombinedAccount) => void
  userEmail?: string
}

interface AccountMapping {
  id: number
  account_id: string
  account_name: string
  google_ads_id: string
  ga4_property_id: string
  business_type: string
  is_active: boolean
  sort_order: number
}

const SetupPage = ({ onSetupComplete, userEmail }: SetupPageProps) => {
  const [selectedAccount, setSelectedAccount] = useState<AccountMapping | null>(null)
  const [availableAccounts, setAvailableAccounts] = useState<AccountMapping[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch available accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounts/available')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setAvailableAccounts(data.accounts || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts')
        console.error('[SETUP-PAGE] Error fetching accounts:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  const handleAccountSelect = (account: AccountMapping) => {
    setSelectedAccount(account)
  }

  const handleNext = async () => {
    if (!selectedAccount) return

    try {
      // Select the account in the backend
      const selectResponse = await fetch('/api/accounts/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: selectedAccount.account_id,
          session_id: 'main_session' // TODO: Get actual session ID
        }),
      })

      if (!selectResponse.ok) {
        throw new Error(`Failed to select account: ${selectResponse.status}`)
      }

      // Convert to CombinedAccount format for backwards compatibility
      const combinedAccount: CombinedAccount = {
        id: `${selectedAccount.account_id}-combined`,
        name: selectedAccount.account_name,
        google_ads_id: selectedAccount.google_ads_id,
        ga4_property_id: selectedAccount.ga4_property_id,
        display_name: selectedAccount.account_name,
        ads_data: {
          customer_id: selectedAccount.google_ads_id,
          resource_name: `customers/${selectedAccount.google_ads_id}`,
          descriptive_name: selectedAccount.account_name
        },
        ga4_data: {
          property_id: selectedAccount.ga4_property_id,
          display_name: `${selectedAccount.account_name} GA4`,
          name: `properties/${selectedAccount.ga4_property_id}`,
          currency_code: 'ZAR',
          time_zone: 'Africa/Johannesburg',
          account_id: '106540664695114193744', // TODO: Get actual user ID
          account_display_name: selectedAccount.account_name
        }
      }

      onSetupComplete(combinedAccount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select account')
      console.error('[SETUP-PAGE] Error selecting account:', err)
    }
  }

  return (
    <div className="w-full h-full bg-white flex flex-col" style={{ maxWidth: '393px', margin: '0 auto' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-8 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-black mb-3"
        >
          Welcome to Mia
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600"
        >
          Finish setting up your account
        </motion.p>
      </div>

      {/* Account Selection */}
      <div className="px-6 flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              <span className="ml-3 text-gray-600">Loading accounts...</span>
            </div>
          ) : availableAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No accounts available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableAccounts.map((account) => (
                <button
                  key={account.account_id}
                  onClick={() => handleAccountSelect(account)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedAccount?.account_id === account.account_id
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-black">{account.account_name}</h3>
                      {selectedAccount?.account_id === account.account_id && (
                        <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-1 capitalize">
                      {account.business_type || 'Business'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Google Ads: {account.google_ads_id} • GA4: {account.ga4_property_id}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Actions - Ensure visibility */}
      <div className="p-6 flex-shrink-0">
        <button
          onClick={handleNext}
          disabled={!selectedAccount}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            selectedAccount
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default SetupPage