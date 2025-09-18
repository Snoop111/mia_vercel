import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import VideoIntroView from './components/VideoIntroView'
import AccountSelectionPage from './components/AccountSelectionPage'
import MainViewCopy from './components/MainViewCopy' // The main app after auth
import GrowthPage from './components/GrowthPage' // Blue growth page
import OptimizePage from './components/OptimizePage' // Optimize improvement page
import ProtectPage from './components/ProtectPage' // Protect/fixing page
import CreativePageFixed from './components/CreativePageFixed' // NEW: Creative-only analysis
import { useSession } from './contexts/SessionContext'

type AppState = 'video-intro' | 'account-selection' | 'main' | 'growth' | 'improve' | 'fix' | 'creative'

function App() {
  const { isAuthenticated, isMetaAuthenticated, selectedAccount, isLoading } = useSession()
  const [appState, setAppState] = useState<AppState>('video-intro')

  // Support both Google and Meta authentication
  const isAnyAuthenticated = isAuthenticated || isMetaAuthenticated

  // Debug state changes
  useEffect(() => {
    console.log('[APP-STATE] App state changed to:', appState)
    console.log('[APP-STATE] isAuthenticated (Google):', isAuthenticated)
    console.log('[APP-STATE] isMetaAuthenticated (Meta):', isMetaAuthenticated)
    console.log('[APP-STATE] selectedAccount:', selectedAccount?.name)
    console.log('[APP-STATE] isLoading:', isLoading)
  }, [appState, isAuthenticated, isMetaAuthenticated, selectedAccount, isLoading])
  const [preloadedData, setPreloadedData] = useState<any>(null) // Store pre-fetched data

  // Preload critical images - mobile-optimized approach
  useEffect(() => {
    const criticalImages = [
      '/icons/Vector.png',
      '/icons/Mia.png',
      '/images/Grow Nav.png',
      '/images/Optimise Nav.png', 
      '/images/Protect Nav.png'
    ]
    
    // Multiple preloading strategies for mobile compatibility
    criticalImages.forEach(src => {
      // Strategy 1: Link preload
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
      
      // Strategy 2: Image object with cache control
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = src
      
      // Strategy 3: Force immediate load
      img.onload = () => {
        // Store in a global cache object
        if (!(window as any).imageCache) (window as any).imageCache = {}
        ;(window as any).imageCache[src] = img
      }
    })
  }, [])

  // Handle authentication state changes - but only after video intro
  useEffect(() => {
    if (isLoading) return // Wait for session to initialize

    // Only auto-transition if we're not on video-intro
    // This prevents skipping the video on initial load
    if (appState === 'video-intro') return

    // Check for account selection (works for both authenticated and bypass mode)
    if (selectedAccount && appState === 'account-selection') {
      // User has selected an account - but only auto-transition from account-selection
      // Don't interfere with manual navigation from other states
      console.log('🎯 [APP] Account selected, transitioning to main app:', selectedAccount.name)
      setAppState('main')
    } else if (isAnyAuthenticated && !selectedAccount && appState !== 'creative' && appState !== 'growth' && appState !== 'improve' && appState !== 'fix') {
      // User is authenticated (Google OR Meta) but needs to select an account
      console.log('🔐 [APP] User authenticated, transitioning to account selection')
      setAppState('account-selection')
    } else if (!isAnyAuthenticated && !selectedAccount && appState !== 'video-intro') {
      // User logged out - reset to video intro
      console.log('🔄 [APP] User logged out, resetting to video intro')
      setAppState('video-intro')
    }
  }, [isAuthenticated, isMetaAuthenticated, selectedAccount, isLoading, appState])

  const handleAuthSuccess = () => {
    // This will be triggered by the FigmaLoginModal
    // We need to manually transition since we disabled auto-transition on video-intro
    console.log('🎉 [APP] Auth success callback received - transitioning to account selection')
    console.log('🎉 [APP] Current state:', { appState, isAuthenticated, selectedAccount })

    // Force transition to account selection after successful auth
    // The SessionContext should have updated isAuthenticated by now
    console.log('🎉 [APP] Setting appState to account-selection')
    setAppState('account-selection')
  }


  const { logout } = useSession()

  const handleQuestionClick = (questionType: 'growth' | 'improve' | 'fix', data?: any) => {
    console.log(`📝 [APP] Navigation to ${questionType} with data:`, !!data)
    setPreloadedData(data) // Store the pre-fetched data
    if (questionType === 'growth') {
      setAppState('growth')
    } else if (questionType === 'improve') {
      setAppState('improve')
    } else if (questionType === 'fix') {
      setAppState('fix')
    }
  }

  const handleCreativeClick = () => {
    console.log('🎨 [APP] Navigation to creative analysis')
    setAppState('creative')
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {/* Content */}
      <div className="w-full h-full">
        <AnimatePresence mode="wait">
          {appState === 'video-intro' && (
            <motion.div
              key="video-intro"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <VideoIntroView onAuthSuccess={handleAuthSuccess} />
            </motion.div>
          )}

          {appState === 'account-selection' && (
            <motion.div
              key="account-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <AccountSelectionPage
                onAccountSelected={() => console.log('Account selected - state will auto-update')}
                onBack={() => logout()}
              />
            </motion.div>
          )}
          
          {appState === 'main' && selectedAccount && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full h-full"
            >
              <MainViewCopy
                onLogout={async () => {
                  console.log('🚪 User logout requested')
                  await logout()
                  // Reset app state to video intro after logout
                  setAppState('video-intro')
                  console.log('🔄 App state reset to video-intro')
                }}
                onQuestionClick={handleQuestionClick}
                onCreativeClick={handleCreativeClick}
              />
            </motion.div>
          )}
          
          {appState === 'growth' && isAnyAuthenticated && (
            <motion.div
              key="growth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <GrowthPage 
                onBack={() => {
                  setAppState('main')
                  setPreloadedData(null) // Clear pre-loaded data when going back
                }} 
                data={preloadedData}
              />
            </motion.div>
          )}

          {appState === 'improve' && isAnyAuthenticated && (
            <motion.div
              key="improve"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <OptimizePage 
                onBack={() => {
                  setAppState('main')
                  setPreloadedData(null) // Clear pre-loaded data when going back
                }} 
                data={preloadedData}
              />
            </motion.div>
          )}

          {appState === 'fix' && isAnyAuthenticated && (
            <motion.div
              key="fix"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <ProtectPage 
                onBack={() => {
                  setAppState('main')
                  setPreloadedData(null) // Clear pre-loaded data when going back
                }} 
                data={preloadedData}
              />
            </motion.div>
          )}

          {appState === 'creative' && isAnyAuthenticated && (
            <motion.div
              key="creative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="w-full h-full"
              style={{ backgroundColor: '#290068' }}
            >
              <CreativePageFixed
                onBack={() => {
                  console.log('[APP] Creative back clicked - stable transition')
                  setAppState('main')
                  setPreloadedData(null) // Clear any preloaded data
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default App