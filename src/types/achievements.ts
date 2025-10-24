export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export type AchievementType = 
  | 'daily_streak'
  | 'cards_completed' 
  | 'cards_created'
  | 'checklists_completed'
  | 'boards_created'
  | 'columns_created'
  | 'consecutive_days'
  | 'speed_demon' // Complete 5 cards in one day
  | 'perfectionist' // Complete all checklist items on 10 cards
  | 'organizer' // Create 5 different priority levels

export interface Achievement {
  id: string
  type: AchievementType
  name: string
  description: string
  tier: BadgeTier
  requirement: number
  icon: 'trophy' | 'ribbon' | 'medal' | 'star' | 'crown'
  color: string
}

export interface UserProgress {
  [key: string]: {
    currentValue: number
    lastUpdated: string
    unlockedTiers: BadgeTier[]
  }
}

export interface UserStats {
  totalCardsCompleted: number
  totalCardsCreated: number
  totalChecklistsCompleted: number
  totalBoardsCreated: number
  totalColumnsCreated: number
  currentDailyStreak: number
  longestDailyStreak: number
  lastLoginDate: string
  joinDate: string
  perfectCards: number // Cards with all checklist items completed
  speedDemons: number // Days with 5+ cards completed
}

export interface BadgeUnlock {
  achievementId: string
  tier: BadgeTier
  unlockedAt: string
  isNew: boolean
}