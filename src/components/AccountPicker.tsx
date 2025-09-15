import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { accountService, AccountCollections, GoogleAdsAccount, GA4Account, CombinedAccount } from '../services/accountService'

interface AccountPickerProps {
  isOpen: boolean
  onClose: () => void
  onAccountSelect: (account: GoogleAdsAccount | GA4Account | CombinedAccount) => void
  currentAccount?: GoogleAdsAccount | GA4Account | CombinedAccount
}

const AccountPicker = ({ isOpen, onClose, onAccountSelect, currentAccount }: AccountPickerProps) => {
  const [collections, setCollections] = useState<AccountCollections>({ googleAds: [], ga4: [], combined: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'combined' | 'googleAds' | 'ga4'>('combined')
  const [selectedAccount, setSelectedAccount] = useState<GoogleAdsAccount | GA4Account | CombinedAccount | null>(null)

  // Fetch accounts on component mount (cached data loads instantly)
  useEffect(() => {
    console.log('🔍 [AccountPicker] Mount useEffect triggered:', {
      googleAdsCount: collections.googleAds.length,
      ga4Count: collections.ga4.length,
      loading
    })
    
    // Always fetch on mount if we don't have data (cache makes this fast)
    if (collections.googleAds.length === 0 && collections.ga4.length === 0) {
      console.log('✅ [AccountPicker] No cached data, fetching accounts...')
      fetchAccounts()
    } else {
      console.log('✅ [AccountPicker] Using cached account data')
    }
  }, []) // Empty dependency - only run on mount
  
  // Separate useEffect for when modal opens/closes  
  useEffect(() => {
    console.log('🔍 [AccountPicker] Modal state changed:', { isOpen })
  }, [isOpen])

  const fetchAccounts = async () => {
    // Only prevent if already fetching (not initial loading state)
    if (loading && (collections.googleAds.length > 0 || collections.ga4.length > 0)) {
      console.log('⏳ [AccountPicker] Already fetching, skipping...')
      return
    }
    
    try {
      console.log('🚀 [AccountPicker] Starting account fetch...')
      setLoading(true)
      console.log('🔄 Fetching account collections for authenticated user...')
      
      // Use new collections-based service  
      const accountCollections = await accountService.getAccountCollections()
      console.log(`✅ Found ${accountCollections.googleAds.length} Google Ads, ${accountCollections.ga4.length} GA4, ${accountCollections.combined.length} Combined accounts`)
      
      setCollections(accountCollections)
    } catch (error) {
      console.error('❌ Failed to fetch account collections:', error)
      setCollections({ googleAds: [], ga4: [], combined: [] })
    } finally {
      setLoading(false)
    }
  }

  // Get current tab's accounts
  const getCurrentAccounts = () => {
    switch (activeTab) {
      case 'googleAds':
        return collections.googleAds
      case 'ga4':
        return collections.ga4
      case 'combined':
        return collections.combined
      default:
        return []
    }
  }

  const getAccountIcon = (tab: string) => {
    switch (tab) {
      case 'googleAds':
        return '🎯' // Google Ads
      case 'ga4':
        return '📊' // Analytics
      case 'combined':
        return '🔗' // Combined
      default:
        return '📱'
    }
  }

  const getCapabilityText = (account: GoogleAdsAccount | GA4Account | CombinedAccount) => {
    if ('google_ads_id' in account && 'ga4_property_id' in account) {
      return 'Comprehensive cross-platform insights'
    } else if ('property_id' in account) {
      return 'Google Analytics insights only'
    } else if ('customer_id' in account) {
      return 'Google Ads insights only'
    }
    return 'Limited insights available'
  }

  const handleAccountClick = (account: GoogleAdsAccount | GA4Account | CombinedAccount) => {
    // Just set selected account, don't close modal
    setSelectedAccount(account)
  }

  const handleApplySelection = () => {
    if (selectedAccount) {
      onAccountSelect(selectedAccount)
      onClose()
    }
  }

  // Initialize selectedAccount with currentAccount when modal opens
  useEffect(() => {
    if (isOpen && currentAccount) {
      setSelectedAccount(currentAccount)
    }
  }, [isOpen, currentAccount])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden shadow-xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-black p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select Account</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                ×
              </button>
            </div>
            <p className="text-gray-300 text-sm mt-2">
              Choose an account to analyze marketing performance
            </p>
          </div>

          {/* Account Type Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { key: 'combined', label: 'Combined', icon: '🔗', count: collections.combined.length },
              { key: 'googleAds', label: 'Google Ads', icon: '🎯', count: collections.googleAds.length },
              { key: 'ga4', label: 'GA4', icon: '📊', count: collections.ga4.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full min-w-[20px]">
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Account List */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 mt-2">Loading accounts...</p>
              </div>
            ) : getCurrentAccounts().length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {activeTab === 'combined' ? (
                  <div>
                    <p>No combined accounts found</p>
                    <p className="text-xs mt-2">Accounts with both Google Ads and GA4 will appear here</p>
                  </div>
                ) : (
                  <p>No {activeTab === 'googleAds' ? 'Google Ads only' : 'GA4 only'} accounts found</p>
                )}
              </div>
            ) : (
              <div className="p-2">
                {getCurrentAccounts().map((account) => (
                  <motion.button
                    key={account.id}
                    onClick={() => handleAccountClick(account)}
                    className={`w-full p-4 rounded-xl mb-2 text-left transition-colors hover:bg-blue-50 ${
                      selectedAccount?.id === account.id ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getAccountIcon(activeTab)}</span>
                          <h3 className="font-semibold text-gray-900">{account.name}</h3>
                          {activeTab === 'combined' && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                          {/* Show matching indicators */}
                          {activeTab === 'googleAds' && 'hasMatchingGA4' in account && account.hasMatchingGA4 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              📊 Has GA4
                            </span>
                          )}
                          {activeTab === 'ga4' && 'hasMatchingAds' in account && account.hasMatchingAds && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              🎯 Has Ads
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {getCapabilityText(account)}
                        </p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          {/* Google Ads Account */}
                          {activeTab === 'googleAds' && 'customer_id' in account && (
                            <>
                              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                ID: {account.customer_id}
                              </span>
                              {account.raw_data.error && (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                                  ⚠️ API Error
                                </span>
                              )}
                            </>
                          )}
                          {/* GA4 Account */}
                          {activeTab === 'ga4' && 'property_id' in account && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Property: {account.property_id}
                            </span>
                          )}
                          {/* Combined Account */}
                          {activeTab === 'combined' && 'google_ads_id' in account && 'ga4_property_id' in account && (
                            <>
                              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                Ads: {account.google_ads_id}
                              </span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                GA4: {account.ga4_property_id}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {selectedAccount?.id === account.id && (
                        <div className="text-blue-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Selection Feedback Bar */}
          {selectedAccount && (
            <div className="bg-gray-50 border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Selected:</p>
                  <p className="text-xs text-gray-600 truncate">{selectedAccount.name}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplySelection}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AccountPicker