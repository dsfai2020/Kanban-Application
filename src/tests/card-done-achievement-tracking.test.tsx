import { describe, it, expect, beforeEach } from 'vitest'
import { achievementManager } from '../utils/achievementManager'

describe('Achievement Manager - Card Done Tracking', () => {
  beforeEach(() => {
    // Clear localStorage to start fresh for each test
    localStorage.clear()
    // Reset the achievement manager instance by creating a fresh one
    // This ensures we start with clean state for each test
    const freshManager = new (achievementManager.constructor as any)()
    Object.assign(achievementManager, freshManager)
  })



  it('should detect Done column names correctly', () => {
    // Test the helper logic manually
    const isDoneColumn = (columnTitle: string): boolean => {
      const lowerTitle = columnTitle.toLowerCase().trim()
      return lowerTitle === 'done' || 
             lowerTitle === 'completed' || 
             lowerTitle === 'complete' || 
             lowerTitle === 'finished' || 
             lowerTitle === 'finish'
    }

    const testCases = [
      { title: 'Done', expected: true },
      { title: 'done', expected: true },
      { title: 'DONE', expected: true },
      { title: 'Completed', expected: true },
      { title: 'completed', expected: true },
      { title: 'Complete', expected: true },
      { title: 'Finished', expected: true },
      { title: 'Finish', expected: true },
      { title: 'To Do', expected: false },
      { title: 'In Progress', expected: false },
      { title: 'Review', expected: false }
    ]

    testCases.forEach(({ title, expected }) => {
      expect(isDoneColumn(title)).toBe(expected)
    })
  })

  it('should prevent double counting of completed cards', () => {
    const initialStats = achievementManager.getUserStats()
    expect(initialStats.totalCardsCompleted).toBe(0)
    expect(initialStats.completedCardIds).toEqual([])

    // Move card to done for the first time
    achievementManager.trackCardMovedToDone('card-123')
    const stats1 = achievementManager.getUserStats()
    
    expect(stats1.totalCardsCompleted).toBe(1)
    expect(stats1.completedCardIds).toContain('card-123')

    // Try to move same card to done again (should not increment)
    const unlocks2 = achievementManager.trackCardMovedToDone('card-123')
    const stats2 = achievementManager.getUserStats()
    
    expect(stats2.totalCardsCompleted).toBe(1) // Should still be 1
    expect(stats2.completedCardIds).toEqual(['card-123']) // Should still only contain card-123
    expect(unlocks2).toEqual([]) // No new achievements unlocked
  })

  it('should handle removing cards from done column', () => {
    // First, move card to done
    achievementManager.trackCardMovedToDone('card-456')
    const stats1 = achievementManager.getUserStats()
    expect(stats1.completedCardIds).toContain('card-456')

    // Remove card from done
    achievementManager.trackCardRemovedFromDone('card-456')
    const stats2 = achievementManager.getUserStats()
    expect(stats2.completedCardIds).not.toContain('card-456')
    
    // Total completed count should not decrease (prevents achievement regression)
    expect(stats2.totalCardsCompleted).toBe(1)
  })

  it('should allow re-completion of previously removed cards', () => {
    // Move card to done
    achievementManager.trackCardMovedToDone('card-789')
    const stats1 = achievementManager.getUserStats()
    expect(stats1.totalCardsCompleted).toBe(1)

    // Remove from done
    achievementManager.trackCardRemovedFromDone('card-789')
    
    // Move back to done (should count as new completion)
    achievementManager.trackCardMovedToDone('card-789')
    const stats2 = achievementManager.getUserStats()
    expect(stats2.totalCardsCompleted).toBe(2)
    expect(stats2.completedCardIds).toContain('card-789')
  })

  it('should handle multiple different cards correctly', () => {
    // Move multiple cards to done
    achievementManager.trackCardMovedToDone('card-1')
    achievementManager.trackCardMovedToDone('card-2')
    achievementManager.trackCardMovedToDone('card-3')
    
    const stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(3)
    expect(stats.completedCardIds).toEqual(['card-1', 'card-2', 'card-3'])

    // Try to move card-2 again (should not increment)
    achievementManager.trackCardMovedToDone('card-2')
    const stats2 = achievementManager.getUserStats()
    expect(stats2.totalCardsCompleted).toBe(3) // Should still be 3
  })
})