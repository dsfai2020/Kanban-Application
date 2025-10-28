import { describe, it, expect, beforeEach, vi } from 'vitest'
import { achievementManager } from '../utils/achievementManager'

describe('Achievement Manager Stats Update', () => {
  beforeEach(() => {
    // Reset achievement manager data before each test
    achievementManager.resetAllData()
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  it('should track cards completed and update stats immediately', () => {
    // Initial stats should show 0 cards completed
    const initialStats = achievementManager.getUserStats()
    expect(initialStats.totalCardsCompleted).toBe(0)
    expect(initialStats.completedCardIds).toEqual([])

    // Move a card to done column
    const newUnlocks = achievementManager.trackCardMovedToDone('card-1')
    
    // Stats should be updated immediately
    const updatedStats = achievementManager.getUserStats()
    expect(updatedStats.totalCardsCompleted).toBe(1)
    expect(updatedStats.completedCardIds).toContain('card-1')
    
    // Should unlock at least one achievement (Bronze First Steps)
    expect(newUnlocks.length).toBeGreaterThan(0)
  })

  it('should prevent duplicate counting when same card is moved to done multiple times', () => {
    // Move same card to done multiple times
    achievementManager.trackCardMovedToDone('card-1')
    achievementManager.trackCardMovedToDone('card-1') // Duplicate
    achievementManager.trackCardMovedToDone('card-1') // Another duplicate

    // Should only count once
    const stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(1)
    expect(stats.completedCardIds).toEqual(['card-1'])
  })

  it('should persist data to localStorage and update immediately', () => {
    // Complete a card
    achievementManager.trackCardMovedToDone('card-1')

    // Check localStorage has the data immediately
    const storedStats = JSON.parse(localStorage.getItem('kanban_user_stats') || '{}')
    expect(storedStats.totalCardsCompleted).toBe(1)
    expect(storedStats.completedCardIds).toContain('card-1')

    // Check that getUserStats returns fresh data
    const freshStats = achievementManager.getUserStats()
    expect(freshStats.totalCardsCompleted).toBe(1)
    expect(freshStats.completedCardIds).toContain('card-1')
  })
})