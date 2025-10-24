import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Column from '../components/Column'
import { achievementManager } from '../utils/achievementManager'
import type { Column as ColumnType, AppSettings } from '../types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock achievement manager methods
vi.mock('../utils/achievementManager', () => ({
  achievementManager: {
    trackCardCreated: vi.fn(() => []),
    trackCardCompleted: vi.fn(() => []),
    trackChecklistCompleted: vi.fn(() => []),
    trackBoardCreated: vi.fn(() => []),
    trackColumnCreated: vi.fn(() => []),
    getUserStats: vi.fn(() => ({
      totalCardsCreated: 0,
      totalCardsCompleted: 0,
      totalChecklistsCompleted: 0,
      totalBoardsCreated: 0,
      totalColumnsCreated: 0,
      currentDailyStreak: 0,
      longestDailyStreak: 0,
      lastLoginDate: null
    })),
    getUserProgress: vi.fn(() => ({})),
    getBadgeUnlocks: vi.fn(() => []),
    getAllAchievementsWithStatus: vi.fn(() => [])
  }
}))

const mockSettings: AppSettings = {
  columnCardLimit: 8,
  theme: 'dark',
  autoSave: true
}

const createMockColumn = (): ColumnType => ({
  id: 'test-column',
  title: 'Test Column',
  boardId: 'test-board',
  position: 0,
  cards: []
})

describe('Card Achievement Tracking Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    
    // Reset all mocks to their default implementations
    vi.mocked(achievementManager.trackCardCreated).mockImplementation(() => [])
    vi.mocked(achievementManager.trackCardCompleted).mockImplementation(() => [])
    vi.mocked(achievementManager.trackChecklistCompleted).mockImplementation(() => [])
    vi.mocked(achievementManager.trackBoardCreated).mockImplementation(() => [])
    vi.mocked(achievementManager.trackColumnCreated).mockImplementation(() => [])
  })

  describe('Card Creation Achievement Tracking', () => {
    it('should call trackCardCreated when a new card is successfully created', async () => {
      const user = userEvent.setup()
      const mockColumn = createMockColumn()
      const onUpdateColumn = vi.fn()

      render(
        <Column
          column={mockColumn}
          settings={mockSettings}
          onUpdateColumn={onUpdateColumn}
          onDeleteColumn={vi.fn()}
        />
      )

      // Click "Add a card" button to start creating
      const addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      // Fill in the card title
      const titleInput = screen.getByPlaceholderText('Enter card title')
      await user.type(titleInput, 'Achievement Test Card')

      // Submit the form
      const submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      // Verify achievement tracking was called
      expect(achievementManager.trackCardCreated).toHaveBeenCalledTimes(1)
      
      // Verify the column was updated with new card
      expect(onUpdateColumn).toHaveBeenCalledWith(
        expect.objectContaining({
          cards: expect.arrayContaining([
            expect.objectContaining({
              title: 'Achievement Test Card'
            })
          ])
        })
      )
    })

    it('should not call trackCardCreated when card creation fails due to empty title', async () => {
      const user = userEvent.setup()
      const mockColumn = createMockColumn()
      const onUpdateColumn = vi.fn()

      render(
        <Column
          column={mockColumn}
          settings={mockSettings}
          onUpdateColumn={onUpdateColumn}
          onDeleteColumn={vi.fn()}
        />
      )

      // Click "Add a card" button
      const addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      // Try to submit without entering a title
      const submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      // Should not track achievement for failed creation
      expect(achievementManager.trackCardCreated).not.toHaveBeenCalled()
      expect(onUpdateColumn).not.toHaveBeenCalled()
    })

    it('should track achievement even if trackCardCreated throws an error', async () => {
      const user = userEvent.setup()
      const mockColumn = createMockColumn()
      const onUpdateColumn = vi.fn()
      
      // Mock console.warn to verify error handling
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock trackCardCreated to throw error
      vi.mocked(achievementManager.trackCardCreated).mockImplementation(() => {
        throw new Error('Achievement tracking failed')
      })

      render(
        <Column
          column={mockColumn}
          settings={mockSettings}
          onUpdateColumn={onUpdateColumn}
          onDeleteColumn={vi.fn()}
        />
      )

      // Create a card
      const addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      const titleInput = screen.getByPlaceholderText('Enter card title')
      await user.type(titleInput, 'Error Test Card')

      const submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      // Card creation should still work even if achievement tracking fails
      expect(onUpdateColumn).toHaveBeenCalled()
      expect(achievementManager.trackCardCreated).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith('Achievement tracking failed:', expect.any(Error))
      
      consoleWarnSpy.mockRestore()
    })

    it('should track multiple card creations independently', async () => {
      const user = userEvent.setup()
      const mockColumn = createMockColumn()
      const onUpdateColumn = vi.fn()

      render(
        <Column
          column={mockColumn}
          settings={mockSettings}
          onUpdateColumn={onUpdateColumn}
          onDeleteColumn={vi.fn()}
        />
      )

      // Create first card
      let addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      let titleInput = screen.getByPlaceholderText('Enter card title')
      await user.type(titleInput, 'First Card')

      let submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      expect(achievementManager.trackCardCreated).toHaveBeenCalledTimes(1)

      // Wait for form to close and find the button again
      addCardBtn = await screen.findByText('Add a card')
      await user.click(addCardBtn)

      // Find the new form inputs
      titleInput = await screen.findByPlaceholderText('Enter card title')
      await user.type(titleInput, 'Second Card')

      submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      expect(achievementManager.trackCardCreated).toHaveBeenCalledTimes(2)
    })
  })

  describe('Achievement Manager Integration', () => {
    it('should verify achievement manager is properly imported and accessible', () => {
      expect(achievementManager).toBeDefined()
      expect(achievementManager.trackCardCreated).toBeDefined()
      expect(achievementManager.trackCardCompleted).toBeDefined()
      expect(achievementManager.trackChecklistCompleted).toBeDefined()
      expect(achievementManager.trackColumnCreated).toBeDefined()
      expect(achievementManager.trackBoardCreated).toBeDefined()
    })

    it('should handle achievement manager method calls correctly', () => {
      // Reset mocks to ensure clean state
      vi.mocked(achievementManager.trackCardCreated).mockReturnValue([])
      
      // Test that methods return expected format
      const result = achievementManager.trackCardCreated()
      expect(Array.isArray(result)).toBe(true)
      
      const stats = achievementManager.getUserStats()
      expect(typeof stats).toBe('object')
      expect(stats).toHaveProperty('totalCardsCreated')
      expect(stats).toHaveProperty('totalCardsCompleted')
    })
  })

  describe('Card Form Interaction', () => {
    it('should properly handle form cancellation without tracking', async () => {
      const user = userEvent.setup()
      const mockColumn = createMockColumn()
      const onUpdateColumn = vi.fn()

      render(
        <Column
          column={mockColumn}
          settings={mockSettings}
          onUpdateColumn={onUpdateColumn}
          onDeleteColumn={vi.fn()}
        />
      )

      // Start creating a card
      const addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      // Fill in some data
      const titleInput = screen.getByPlaceholderText('Enter card title')
      await user.type(titleInput, 'Cancelled Card')

      // Cancel instead of submitting
      const cancelBtn = screen.getByText('Cancel')
      await user.click(cancelBtn)

      // Should not track achievement for cancelled creation
      expect(achievementManager.trackCardCreated).not.toHaveBeenCalled()
      expect(onUpdateColumn).not.toHaveBeenCalled()

      // Form should be hidden
      expect(screen.queryByPlaceholderText('Enter card title')).not.toBeInTheDocument()
    })

    it('should handle card creation with both title and description', async () => {
      const user = userEvent.setup()
      const mockColumn = createMockColumn()
      const onUpdateColumn = vi.fn()

      render(
        <Column
          column={mockColumn}
          settings={mockSettings}
          onUpdateColumn={onUpdateColumn}
          onDeleteColumn={vi.fn()}
        />
      )

      // Create a card with both title and description
      const addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      const titleInput = screen.getByPlaceholderText('Enter card title')
      await user.type(titleInput, 'Full Card')

      const descriptionInput = screen.getByPlaceholderText('Enter card description (optional)')
      await user.type(descriptionInput, 'This card has a description')

      const submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      // Verify achievement tracking
      expect(achievementManager.trackCardCreated).toHaveBeenCalledTimes(1)
      
      // Verify card data
      expect(onUpdateColumn).toHaveBeenCalledWith(
        expect.objectContaining({
          cards: expect.arrayContaining([
            expect.objectContaining({
              title: 'Full Card',
              description: 'This card has a description'
            })
          ])
        })
      )
    })
  })
})