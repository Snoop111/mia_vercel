import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DatePickerProps {
  startDate: string
  endDate: string
  onDateChange: (startDate: string, endDate: string) => void
  className?: string
}

// Helper function to format date for display
const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short'
  })
}

// Helper function to add days to a date
const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

// Helper function to format date for input (YYYY-MM-DD)
const formatDateForInput = (dateString: string): string => {
  return dateString // Already in YYYY-MM-DD format
}

const DatePicker = ({ startDate, endDate, onDateChange, className = '' }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(startDate)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStartDateChange = (newStartDate: string) => {
    setTempStartDate(newStartDate)
    const newEndDate = addDays(newStartDate, 6) // Always 7 days (6 days after start)
    onDateChange(newStartDate, newEndDate)
    setIsOpen(false)
  }

  // Calculate dropdown position relative to button
  const getDropdownStyle = () => {
    if (!pickerRef.current) return {}
    const rect = pickerRef.current.getBoundingClientRect()
    return {
      position: 'fixed' as const,
      top: rect.bottom + 8, // 8px below button
      right: window.innerWidth - rect.right, // Align to right edge of button
      zIndex: 9999
    }
  }

  const dateRangeDisplay = `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* Date Range Button - Inline in header */}
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M14 2h-2V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM2 6h12v8H2V6z" fill="currentColor"/>
          <path d="M4 8h2v2H4V8zm4 0h2v2H8V8zm4 0h2v2h-2V8z" fill="currentColor"/>
        </svg>
        <span>{dateRangeDisplay}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Date Picker Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-xl border border-gray-200 p-3"
            style={{ width: '240px', ...getDropdownStyle() }}
          >
            <div className="space-y-3">
              {/* Compact Header */}
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-900">Select Start Date</h3>
                <p className="text-xs text-gray-500 mt-1">+7 days automatically</p>
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <input
                  type="date"
                  value={formatDateForInput(tempStartDate)}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                />
                
                {/* Compact Preview */}
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Range:</span>
                      <span className="font-medium">{formatDateForDisplay(tempStartDate)} - {formatDateForDisplay(addDays(tempStartDate, 6))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Actions */}
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={() => handleStartDateChange(tempStartDate)}
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DatePicker