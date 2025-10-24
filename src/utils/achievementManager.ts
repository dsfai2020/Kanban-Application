import { ALL_ACHIEVEMENTS, getAchievementsByType } from './achievements'
import type { 
  UserStats, 
  UserProgress, 
  BadgeUnlock, 
  Achievement,
  AchievementType,
  BadgeTier
} from '../types/achievements'

// Notification callback type
type NotificationCallback = (achievement: Achievement, tier: BadgeTier) => void

const STORAGE_KEYS = {
  USER_STATS: 'kanban_user_stats',
  USER_PROGRESS: 'kanban_user_progress',
  BADGE_UNLOCKS: 'kanban_badge_unlocks'
}

// Initialize default user stats
const getDefaultUserStats = (): UserStats => ({
  totalCardsCompleted: 0,
  totalCardsCreated: 0,
  totalChecklistsCompleted: 0,
  totalBoardsCreated: 0,
  totalColumnsCreated: 0,
  currentDailyStreak: 0,
  longestDailyStreak: 0,
  lastLoginDate: new Date().toDateString(),
  joinDate: new Date().toDateString(),
  perfectCards: 0,
  speedDemons: 0
})

// Initialize default user progress
const getDefaultUserProgress = (): UserProgress => {
  const progress: UserProgress = {}
  const achievementTypes: AchievementType[] = [
    'daily_streak', 'cards_completed', 'cards_created', 
    'checklists_completed', 'boards_created', 'columns_created',
    'speed_demon', 'perfectionist', 'organizer'
  ]
  
  achievementTypes.forEach(type => {
    progress[type] = {
      currentValue: 0,
      lastUpdated: new Date().toISOString(),
      unlockedTiers: []
    }
  })
  
  return progress
}

class AchievementManager {
  private userStats: UserStats
  private userProgress: UserProgress
  private badgeUnlocks: BadgeUnlock[]
  private notificationCallbacks: NotificationCallback[] = []

  constructor() {
    this.userStats = this.loadUserStats()
    this.userProgress = this.loadUserProgress()
    this.badgeUnlocks = this.loadBadgeUnlocks()
    this.checkDailyLogin()
  }

  // Load data from localStorage
  private loadUserStats(): UserStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_STATS)
      if (stored) {
        return { ...getDefaultUserStats(), ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
    return getDefaultUserStats()
  }

  private loadUserProgress(): UserProgress {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS)
      if (stored) {
        return { ...getDefaultUserProgress(), ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Error loading user progress:', error)
    }
    return getDefaultUserProgress()
  }

  private loadBadgeUnlocks(): BadgeUnlock[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BADGE_UNLOCKS)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading badge unlocks:', error)
    }
    return []
  }

  // Save data to localStorage
  private saveUserStats(): void {
    localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(this.userStats))
  }

  private saveUserProgress(): void {
    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(this.userProgress))
  }

  private saveBadgeUnlocks(): void {
    localStorage.setItem(STORAGE_KEYS.BADGE_UNLOCKS, JSON.stringify(this.badgeUnlocks))
  }

  // Public getters
  getUserStats(): UserStats {
    return { ...this.userStats }
  }

  getUserProgress(): UserProgress {
    return { ...this.userProgress }
  }

  getBadgeUnlocks(): BadgeUnlock[] {
    return [...this.badgeUnlocks]
  }

  // Check daily login and update streak
  private checkDailyLogin(): void {
    const today = new Date().toDateString()
    const lastLogin = this.userStats.lastLoginDate
    
    if (lastLogin !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (lastLogin === yesterday.toDateString()) {
        // Consecutive day
        this.userStats.currentDailyStreak++
      } else {
        // Streak broken
        this.userStats.currentDailyStreak = 1
      }
      
      this.userStats.longestDailyStreak = Math.max(
        this.userStats.longestDailyStreak, 
        this.userStats.currentDailyStreak
      )
      
      this.userStats.lastLoginDate = today
      
      // Update daily streak progress
      this.updateProgress('daily_streak', this.userStats.currentDailyStreak)
      
      this.saveUserStats()
    }
  }

  // Update progress for a specific achievement type
  private updateProgress(type: AchievementType, newValue: number): BadgeUnlock[] {
    const newUnlocks: BadgeUnlock[] = []
    
    if (!this.userProgress[type]) {
      this.userProgress[type] = {
        currentValue: 0,
        lastUpdated: new Date().toISOString(),
        unlockedTiers: []
      }
    }
    
    this.userProgress[type].currentValue = newValue
    this.userProgress[type].lastUpdated = new Date().toISOString()
    
    // Check for new achievement unlocks
    const achievements = getAchievementsByType(type)
    
    achievements.forEach(achievement => {
      const isAlreadyUnlocked = this.userProgress[type].unlockedTiers.includes(achievement.tier)
      
      if (!isAlreadyUnlocked && newValue >= achievement.requirement) {
        // New achievement unlocked!
        this.userProgress[type].unlockedTiers.push(achievement.tier)
        
        const unlock: BadgeUnlock = {
          achievementId: achievement.id,
          tier: achievement.tier,
          unlockedAt: new Date().toISOString(),
          isNew: true
        }
        
        this.badgeUnlocks.push(unlock)
        newUnlocks.push(unlock)
      }
    })
    
    this.saveUserProgress()
    this.saveBadgeUnlocks()
    
    // Trigger notifications for new unlocks
    if (newUnlocks.length > 0) {
      this.triggerNotifications(newUnlocks)
    }
    
    return newUnlocks
  }

  // Public methods to track different actions
  trackCardCompleted(): BadgeUnlock[] {
    this.userStats.totalCardsCompleted++
    this.saveUserStats()
    return this.updateProgress('cards_completed', this.userStats.totalCardsCompleted)
  }

  trackCardCreated(): BadgeUnlock[] {
    this.userStats.totalCardsCreated++
    this.saveUserStats()
    return this.updateProgress('cards_created', this.userStats.totalCardsCreated)
  }

  trackChecklistCompleted(): BadgeUnlock[] {
    this.userStats.totalChecklistsCompleted++
    this.saveUserStats()
    return this.updateProgress('checklists_completed', this.userStats.totalChecklistsCompleted)
  }

  trackBoardCreated(): BadgeUnlock[] {
    this.userStats.totalBoardsCreated++
    this.saveUserStats()
    return this.updateProgress('boards_created', this.userStats.totalBoardsCreated)
  }

  trackColumnCreated(): BadgeUnlock[] {
    this.userStats.totalColumnsCreated++
    this.saveUserStats()
    return this.updateProgress('columns_created', this.userStats.totalColumnsCreated)
  }

  trackPerfectCard(): BadgeUnlock[] {
    this.userStats.perfectCards++
    this.saveUserStats()
    return this.updateProgress('perfectionist', this.userStats.perfectCards)
  }

  trackSpeedDemon(): BadgeUnlock[] {
    this.userStats.speedDemons++
    this.saveUserStats()
    return this.updateProgress('speed_demon', this.userStats.speedDemons)
  }

  // Check if user completed 5+ cards today (for speed demon tracking)
  checkSpeedDemon(cardsCompletedToday: number): BadgeUnlock[] {
    if (cardsCompletedToday >= 5) {
      return this.trackSpeedDemon()
    }
    return []
  }

  // Get achievement status for display
  getAchievementStatus(achievement: Achievement): {
    isUnlocked: boolean;
    currentProgress: number;
    percentage: number;
  } {
    const progress = this.userProgress[achievement.type]
    if (!progress) {
      return { isUnlocked: false, currentProgress: 0, percentage: 0 }
    }
    
    const isUnlocked = progress.unlockedTiers.includes(achievement.tier)
    const currentProgress = progress.currentValue
    const percentage = Math.min(100, Math.round((currentProgress / achievement.requirement) * 100))
    
    return { isUnlocked, currentProgress, percentage }
  }

  // Get all achievements with their status
  getAllAchievementsWithStatus() {
    return ALL_ACHIEVEMENTS.map(achievement => ({
      achievement,
      status: this.getAchievementStatus(achievement)
    }))
  }

  // Notification system methods
  addNotificationCallback(callback: NotificationCallback): void {
    this.notificationCallbacks.push(callback)
  }

  removeNotificationCallback(callback: NotificationCallback): void {
    this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback)
  }

  private triggerNotifications(newUnlocks: BadgeUnlock[]): void {
    newUnlocks.forEach(unlock => {
      const achievement = ALL_ACHIEVEMENTS.find(a => a.id === unlock.achievementId)
      if (achievement) {
        this.notificationCallbacks.forEach(callback => {
          try {
            callback(achievement, unlock.tier)
          } catch (error) {
            console.error('Error in achievement notification callback:', error)
          }
        })
      }
    })
  }

  // Mark new unlocks as seen
  markUnlocksAsSeen(): void {
    this.badgeUnlocks = this.badgeUnlocks.map(unlock => ({
      ...unlock,
      isNew: false
    }))
    this.saveBadgeUnlocks()
  }

  // Get new unlocks that haven't been seen
  getNewUnlocks(): BadgeUnlock[] {
    return this.badgeUnlocks.filter(unlock => unlock.isNew)
  }

  // Reset all data (for testing/debugging)
  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_STATS)
    localStorage.removeItem(STORAGE_KEYS.USER_PROGRESS)
    localStorage.removeItem(STORAGE_KEYS.BADGE_UNLOCKS)
    
    this.userStats = getDefaultUserStats()
    this.userProgress = getDefaultUserProgress()
    this.badgeUnlocks = []
  }
}

// Export singleton instance
export const achievementManager = new AchievementManager()
export default AchievementManager