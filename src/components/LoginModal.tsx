import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface LoginModalProps {
  onAuthSuccess: () => void
}

const LoginModal = ({ onAuthSuccess }: LoginModalProps) => {
  const [showMiaText, setShowMiaText] = useState(false)

  // Show Mia text after modal slides up
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMiaText(true)
    }, 600) // After slide animation completes

    return () => clearTimeout(timer)
  }, [])

  const handleGoogleAuth = async () => {
    try {
      console.log('[AUTH] Starting Google OAuth flow...')
      const response = await fetch('/api/oauth/google/auth-url')
      const data = await response.json()

      if (data.success && data.auth_url) {
        // Open OAuth in popup window
        const popup = window.open(
          data.auth_url,
          'oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )

        // Listen for OAuth success message
        const messageListener = (event: MessageEvent) => {
          if (event.data.type === 'oauth_success') {
            popup?.close()
            window.removeEventListener('message', messageListener)
            onAuthSuccess()
          }
        }

        window.addEventListener('message', messageListener)

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('OAuth error:', error)
    }
  }

  const handleMetaAuth = async () => {
    try {
      console.log('[AUTH] Starting Meta OAuth flow...')

      // For now, use bypass login since MCP server isn't fully configured
      console.log('[AUTH] Using Meta bypass login for testing...')

      const sessionId = `session_${Date.now()}`
      const bypassResponse = await fetch('/api/oauth/meta/bypass-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        }
      })

      if (bypassResponse.ok) {
        const bypassData = await bypassResponse.json()
        console.log('[AUTH] Meta bypass login successful:', bypassData)
        onAuthSuccess()
      } else {
        throw new Error('Meta authentication failed')
      }
    } catch (error) {
      console.error('Meta OAuth error:', error)
      alert('Meta authentication failed. Please try again.')
    }
  }

  return (
    <div className="absolute inset-0 flex items-end justify-center">
      {/* Mia text - appears in center before modal slides up */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showMiaText ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
        style={{ top: '-40px' }} // Offset to match Figma position
      >
        <h1 className="text-black text-[25.52px] font-normal" style={{ fontFamily: 'Geologica' }}>
          Mia
        </h1>
      </motion.div>

      {/* Login modal slides up from bottom */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: 'spring',
          damping: 25,
          stiffness: 200,
          duration: 0.6 
        }}
        className="w-full h-[301px] bg-white rounded-t-[38px] p-6 flex flex-col items-center gap-3"
        style={{ marginBottom: '0px' }}
      >
        {/* Auth Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[343px] mt-4">
          {/* Continue with Meta */}
          <button
            onClick={handleMetaAuth}
            className="w-full h-[50px] px-[73px] py-3 bg-white rounded-2xl flex justify-center items-center gap-1.5 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <img
                src="/icons/meta-color.svg"
                alt="Meta"
                className="w-4 h-4"
              />
            </div>
            <span className="text-black text-xl font-normal" style={{ fontFamily: 'SF Pro' }}>
              Continue with Meta
            </span>
          </button>

          {/* Continue with Google */}
          <button 
            onClick={handleGoogleAuth}
            className="w-full h-[50px] px-[73px] py-3 rounded-2xl flex justify-center items-center gap-1.5 hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'rgb(240, 245, 251)' }}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="text-lg">🔵</span>
            </div>
            <span className="text-black text-xl font-normal" style={{ fontFamily: 'SF Pro' }}>
              Continue with Google
            </span>
          </button>

          {/* Sign up with email */}
          <button className="w-full h-[50px] px-[73px] py-3 rounded-2xl flex justify-center items-center gap-1.5"
            style={{ backgroundColor: 'rgb(240, 245, 251)' }}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <span className="text-black text-lg">✉️</span>
            </div>
            <span className="text-black text-xl font-normal" style={{ fontFamily: 'SF Pro' }}>
              Sign up with email
            </span>
          </button>

          {/* Log in */}
          <button className="w-full h-[50px] px-[73px] py-3 bg-black rounded-2xl flex justify-center items-center gap-1.5 border border-gray-600">
            <span className="text-white text-xl font-normal" style={{ fontFamily: 'SF Pro' }}>
              Log in
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginModal