import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProfileModal from '../components/ProfileModal'
import { achievementManager } from '../utils/achievementManager'

// Mock auth context for ProfileModal
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    authState: {
      user: null,
      profile: null,
      isAuthenticated: false,
      isGuest: true,
      isLoading: false
    },
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    continueAsGuest: vi.fn()
  })
}))

describe('Done Column Cards Completed Stats Integration', () => {
  
  beforeEach(() => {
    achievementManager.resetAllData()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should update ProfileModal Cards Completed stat when card is moved to Done column', async () => {
    // Render ProfileModal to monitor stats
    const { rerender } = render(
      <ProfileModal isOpen={true} onClose={() => {}} />
    )

    // Initial stats should show 0 cards completed
    expect(screen.getByText('Cards Completed')).toBeInTheDocument()
    const initialZeros = screen.getAllByText('0')
    expect(initialZeros.length).toBeGreaterThan(0)

    // Simulate what happens when KanbanBoard moves a card to Done column
    // This would normally be triggered by handleDragEnd in KanbanBoard
    achievementManager.trackCardMovedToDone('card-1')

    // Verify achievement manager updated immediately
    const stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(1)
    expect(stats.completedCardIds).toContain('card-1')

    // Fast-forward the polling timer to trigger ProfileModal update
    vi.advanceTimersByTime(1000)

    // Re-render to trigger state update
    rerender(<ProfileModal isOpen={true} onClose={() => {}} />)

    // Verify the ProfileModal shows updated stats
    await waitFor(() => {
      const oneElements = screen.getAllByText('1')
      expect(oneElements.length).toBeGreaterThan(0)
    })

    expect(screen.getByText('Cards Completed')).toBeInTheDocument()
  })

  it('should update stats when multiple cards are moved to Done', async () => {
    const { rerender } = render(
      <ProfileModal isOpen={true} onClose={() => {}} />
    )

    // Initial state - 0 cards completed
    expect(screen.getByText('Cards Completed')).toBeInTheDocument()

    // Move first card to done
    achievementManager.trackCardMovedToDone('card-1')
    
    // Fast-forward and re-render
    vi.advanceTimersByTime(1000)
    rerender(<ProfileModal isOpen={true} onClose={() => {}} />)

    // Should show 1 completed
    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    })

    // Move second card to done
    achievementManager.trackCardMovedToDone('card-2')

    // Fast-forward and re-render
    vi.advanceTimersByTime(1000)
    rerender(<ProfileModal isOpen={true} onClose={() => {}} />)

    // Should show 2 completed
    await waitFor(() => {
      expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    })

    // Verify achievement manager state
    const finalStats = achievementManager.getUserStats()
    expect(finalStats.totalCardsCompleted).toBe(2)
    expect(finalStats.completedCardIds).toEqual(['card-1', 'card-2'])
  })

  it('should prevent duplicate counting when same card is moved to Done multiple times', async () => {
    const { rerender } = render(
      <ProfileModal isOpen={true} onClose={() => {}} />
    )

    // Move card to done
    achievementManager.trackCardMovedToDone('card-1')
    
    // Fast-forward and re-render
    vi.advanceTimersByTime(1000)
    rerender(<ProfileModal isOpen={true} onClose={() => {}} />)

    // Should show 1 completed
    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    })
    
    // Try to move same card to done again (should be prevented)
    achievementManager.trackCardMovedToDone('card-1')
    
    // Fast-forward and re-render
    vi.advanceTimersByTime(1000)
    rerender(<ProfileModal isOpen={true} onClose={() => {}} />)
    
    // Should still show only 1 (no duplicate counting)
    const stats = achievementManager.getUserStats()
    expect(stats.totalCardsCompleted).toBe(1)
    expect(stats.completedCardIds).toEqual(['card-1'])

    // ProfileModal should still show 1 (no change)
    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
      // Ensure no "2" appears (which would indicate duplicate counting)
      expect(screen.queryAllByText('2').length).toBe(0)
    })
  })

  it('should show persistent stats when modal is reopened', async () => {
    // Complete cards while modal is closed
    achievementManager.trackCardMovedToDone('card-1')
    achievementManager.trackCardMovedToDone('card-2')

    // Render modal as closed initially
    const { rerender } = render(
      <ProfileModal isOpen={false} onClose={() => {}} />
    )

    // Should not show content when closed
    expect(screen.queryByText('Cards Completed')).not.toBeInTheDocument()

    // Open the modal
    rerender(<ProfileModal isOpen={true} onClose={() => {}} />)

    // Fast-forward to allow data loading
    vi.advanceTimersByTime(1000)
    rerender(<ProfileModal isOpen={true} onClose={() => {}} />)

    // Should immediately show the persisted stats
    await waitFor(() => {
      expect(screen.getByText('Cards Completed')).toBeInTheDocument()
      expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    })
  })
})