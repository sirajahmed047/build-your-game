'use client'

import { useEffect, useState, useCallback } from 'react'

interface AchievementNotificationProps {
  message: string
  onClose: () => void
  duration?: number
}

export function AchievementNotification({ 
  message, 
  onClose, 
  duration = 5000 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const handleClose = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto-close after duration
    const closeTimer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(closeTimer)
    }
  }, [duration, handleClose])

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      isVisible && !isLeaving 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-full opacity-0 scale-95'
    }`}>
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-2xl max-w-sm">
        <div className="flex items-start space-x-3">
          {/* Achievement Icon */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-lg">🏆</span>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">Achievement Unlocked!</h4>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm mt-1 text-blue-100">{message}</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-white bg-opacity-20 rounded-full h-1">
          <div 
            className="bg-yellow-400 h-1 rounded-full transition-all duration-300 ease-linear"
            style={{
              width: isLeaving ? '0%' : '100%',
              transition: `width ${duration}ms linear`
            }}
          />
        </div>
      </div>
      
      {/* Celebration particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 200}ms`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    </div>
  )
}