import { useState, useCallback } from 'react'
import type { Achievement, BadgeTier } from '../types/achievements'

export interface AchievementNotificationData {
  id: string
  achievement: Achievement
  tier: BadgeTier
  timestamp: number
}

export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<AchievementNotificationData[]>([])

  const showNotification = useCallback((achievement: Achievement, tier: BadgeTier) => {
    const notification: AchievementNotificationData = {
      id: `${achievement.id}-${tier}-${Date.now()}`,
      achievement,
      tier,
      timestamp: Date.now()
    }

    setNotifications(prev => [...prev, notification])

    // Auto-remove after 6 seconds (notification shows for 5s + 1s buffer)
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 6000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications
  }
}