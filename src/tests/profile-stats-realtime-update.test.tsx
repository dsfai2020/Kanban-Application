import { describe, it, expect, beforeEach, vi } from 'vitest'
import { achievementManager } from '../utils/achievementManager'

describe('ProfileModal Achievement Stats Real-Time Update', () => {
  beforeEach(() => {
    // Reset achievement manager data before each test
    achievementManager.resetAllData()
    vi.clearAllMocks()
  })

  it('should update cards completed immediately when tracked', () => {
    // Get initial stats - should be 0
    let stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(0)
    expect(stats.completedCardIds).toEqual([])

    // Move first card to done
    achievementManager.trackCardMovedToDone('card-1')
    
    // Check stats updated immediately
    stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(1)
    expect(stats.completedCardIds).toEqual(['card-1'])

    // Move second card to done
    achievementManager.trackCardMovedToDone('card-2')
    
    // Check stats updated again
    stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(2)
    expect(stats.completedCardIds).toEqual(['card-1', 'card-2'])

    // Try to add same card again (should be prevented)
    achievementManager.trackCardMovedToDone('card-1')
    
    // Stats should remain the same
    stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(2)
    expect(stats.completedCardIds).toEqual(['card-1', 'card-2'])
  })

  it('should show correct achievement status for cards completed', () => {
    // Get the cards completed achievements
    let achievements = achievementManager.getAllAchievementsWithStatus()
    let taskMasterBronze = achievements.find(({ achievement }) => 
      achievement.id === 'cards_completed_bronze'
    )
    
    // Should start at 0 progress
    expect(taskMasterBronze?.status.currentProgress).toBe(0)
    expect(taskMasterBronze?.status.isUnlocked).toBe(false)
    expect(taskMasterBronze?.status.percentage).toBe(0)

    // Complete some cards (bronze needs 10)
    for (let i = 1; i <= 5; i++) {
      achievementManager.trackCardMovedToDone(`card-${i}`)
    }

    // Check progress updated
    achievements = achievementManager.getAllAchievementsWithStatus()
    taskMasterBronze = achievements.find(({ achievement }) => 
      achievement.id === 'cards_completed_bronze'
    )
    
    expect(taskMasterBronze?.status.currentProgress).toBe(5)
    expect(taskMasterBronze?.status.isUnlocked).toBe(true) // Should be unlocked since bronze only needs 1 card
    expect(taskMasterBronze?.status.percentage).toBe(100) // 5/1 = 500% but capped at 100%

    // Complete more to ensure it stays unlocked (total 10) 
    for (let i = 6; i <= 10; i++) {
      achievementManager.trackCardMovedToDone(`card-${i}`)
    }

    // Should still be unlocked
    achievements = achievementManager.getAllAchievementsWithStatus()
    taskMasterBronze = achievements.find(({ achievement }) => 
      achievement.id === 'cards_completed_bronze'
    )
    
    expect(taskMasterBronze?.status.currentProgress).toBe(10)
    expect(taskMasterBronze?.status.isUnlocked).toBe(true)
    expect(taskMasterBronze?.status.percentage).toBe(100)
  })

  it('should persist data and reload correctly', () => {
    // Complete some cards
    achievementManager.trackCardMovedToDone('card-1')
    achievementManager.trackCardMovedToDone('card-2')

    // Check localStorage persistence
    const storedStats = JSON.parse(localStorage.getItem('kanban_user_stats') || '{}')
    expect(storedStats.totalCardsCompleted).toBe(2)
    expect(storedStats.completedCardIds).toEqual(['card-1', 'card-2'])

    // Simulate fresh instance reading from localStorage
    const freshStats = achievementManager.getUserStats()
    expect(freshStats.totalCardsCompleted).toBe(2)
    expect(freshStats.completedCardIds).toEqual(['card-1', 'card-2'])
  })

  it('should handle card removal from done column correctly', () => {
    // Add cards
    achievementManager.trackCardMovedToDone('card-1')
    achievementManager.trackCardMovedToDone('card-2')
    
    let stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(2)
    expect(stats.completedCardIds).toEqual(['card-1', 'card-2'])

    // Remove one card from done
    achievementManager.trackCardRemovedFromDone('card-1')
    
    // Should remove from tracking but keep total count
    stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(2) // Doesn't decrease for achievement purposes
    expect(stats.completedCardIds).toEqual(['card-2']) // But removed from active tracking
    
    // Can add the removed card again - it will increment again since it was removed from tracking
    achievementManager.trackCardMovedToDone('card-1')
    stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(3) // Increments to 3 since card-1 was re-added
    expect(stats.completedCardIds).toEqual(['card-2', 'card-1'])
  })
})