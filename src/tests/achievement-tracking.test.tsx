import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../contexts/AuthContext'
import KanbanBoard from '../components/KanbanBoard'
import Column from '../components/Column'
import Card from '../components/Card'
import { achievementManager } from '../utils/achievementManager'
import type { Board, Column as ColumnType, Card as CardType, AppSettings } from '../types'

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
    trackCardCreated: vi.fn(),
    trackCardCompleted: vi.fn(),
    trackChecklistCompleted: vi.fn(),
    trackBoardCreated: vi.fn(),
    trackColumnCreated: vi.fn(),
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

const createMockBoard = (): Board => ({
  id: 'test-board',
  title: 'Test Board',
  description: 'Test Description',
  columns: [
    {
      id: 'col-1',
      title: 'To Do',
      boardId: 'test-board',
      position: 0,
      cards: []
    },
    {
      id: 'col-2', 
      title: 'In Progress',
      boardId: 'test-board',
      position: 1,
      cards: []
    },
    {
      id: 'col-3',
      title: 'Done',
      boardId: 'test-board',
      position: 2,
      cards: []
    }
  ],
  createdAt: new Date(),
  isActive: true
})

const createMockCard = (): CardType => ({
  id: 'test-card',
  title: 'Test Card',
  description: 'Test Description',
  columnId: 'col-1',
  position: 0,
  tags: [],
  priority: 'medium',
  checklist: [
    { id: 'check-1', text: 'Task 1', completed: false },
    { id: 'check-2', text: 'Task 2', completed: false }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
})

describe('Achievement Tracking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('Card Creation Achievement Tracking', () => {
    it('should track card creation when adding a new card via Column component', async () => {
      const user = userEvent.setup()
      const mockColumn: ColumnType = {
        id: 'col-1',
        title: 'To Do',
        boardId: 'test-board',
        position: 0,
        cards: []
      }
      
      const onUpdateColumn = vi.fn()

      render(
        <AuthProvider>
          <Column
            column={mockColumn}
            settings={mockSettings}
            onUpdateColumn={onUpdateColumn}
            onDeleteColumn={vi.fn()}
          />
        </AuthProvider>
      )

      // Click the "Add a card" button
      const addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      // Fill in card details
      const titleInput = screen.getByPlaceholderText('Enter card title')
      await user.type(titleInput, 'New Test Card')

      const descriptionInput = screen.getByPlaceholderText('Enter card description (optional)')
      await user.type(descriptionInput, 'Test description')

      // Submit the form
      const submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      // Verify achievement tracking was called
      expect(achievementManager.trackCardCreated).toHaveBeenCalledTimes(1)
      expect(onUpdateColumn).toHaveBeenCalledWith(
        expect.objectContaining({
          cards: expect.arrayContaining([
            expect.objectContaining({
              title: 'New Test Card',
              description: 'Test description'
            })
          ])
        })
      )
    })

    it('should not track achievement if card creation fails', async () => {
      const user = userEvent.setup()
      const mockColumn: ColumnType = {
        id: 'col-1',
        title: 'To Do', 
        boardId: 'test-board',
        position: 0,
        cards: []
      }

      render(
        <AuthProvider>
          <Column
            column={mockColumn}
            settings={mockSettings}
            onUpdateColumn={vi.fn()}
            onDeleteColumn={vi.fn()}
          />
        </AuthProvider>
      )

      // Click add card button
      const addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      // Try to submit without title (should fail)
      const submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      // Should not track achievement for failed creation
      expect(achievementManager.trackCardCreated).not.toHaveBeenCalled()
    })
  })

  describe('Card Completion Achievement Tracking', () => {
    it('should track card completion when updating a card via Card component', async () => {
      const user = userEvent.setup()
      const mockCard = createMockCard()
      const onUpdate = vi.fn()
      const onDelete = vi.fn()

      render(
        <AuthProvider>
          <Card
            card={mockCard}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </AuthProvider>
      )

      // Click the card to open edit modal
      const cardElement = screen.getByText('Test Card')
      await user.click(cardElement)

      // Wait for modal to appear and make changes
      const titleInput = screen.getByDisplayValue('Test Card')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Test Card')

      // Save the card
      const saveBtn = screen.getByText('Save')
      await user.click(saveBtn)

      // Verify achievement tracking was called
      expect(achievementManager.trackCardCompleted).toHaveBeenCalledTimes(1)
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Test Card'
        })
      )
    })

    it('should track multiple card completions independently', async () => {
      const user = userEvent.setup()
      const mockCard1 = { ...createMockCard(), id: 'card-1', title: 'Card 1' }
      const mockCard2 = { ...createMockCard(), id: 'card-2', title: 'Card 2' }
      
      const onUpdate = vi.fn()
      const onDelete = vi.fn()

      // Test first card
      const { rerender } = render(
        <AuthProvider>
          <Card
            card={mockCard1}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </AuthProvider>
      )

      // Open and save first card
      await user.click(screen.getByText('Card 1'))
      await user.click(screen.getByText('Save'))

      expect(achievementManager.trackCardCompleted).toHaveBeenCalledTimes(1)

      // Test second card
      rerender(
        <AuthProvider>
          <Card
            card={mockCard2}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </AuthProvider>
      )

      // Open and save second card
      await user.click(screen.getByText('Card 2'))
      await user.click(screen.getByText('Save'))

      expect(achievementManager.trackCardCompleted).toHaveBeenCalledTimes(2)
    })
  })

  describe('Checklist Completion Achievement Tracking', () => {
    it('should track checklist completion when checking off checklist items', async () => {
      const user = userEvent.setup()
      const mockCard = createMockCard()
      const onUpdate = vi.fn()
      const onDelete = vi.fn()

      render(
        <AuthProvider>
          <Card
            card={mockCard}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </AuthProvider>
      )

      // Click the card to open edit modal
      const cardElement = screen.getByText('Test Card')
      await user.click(cardElement)

      // Find and check the first checklist item
      const checkboxes = screen.getAllByRole('checkbox')
      const firstCheckbox = checkboxes.find(cb => {
        const label = cb.closest('label')?.textContent || cb.getAttribute('aria-label') || ''
        return label.includes('Task 1')
      })

      expect(firstCheckbox).toBeTruthy()
      await user.click(firstCheckbox!)

      // Verify achievement tracking was called
      expect(achievementManager.trackChecklistCompleted).toHaveBeenCalledTimes(1)
    })

    it('should not track when unchecking a checklist item', async () => {
      const user = userEvent.setup()
      const mockCard = {
        ...createMockCard(),
        checklist: [
          { id: 'check-1', text: 'Task 1', completed: true }, // Already completed
          { id: 'check-2', text: 'Task 2', completed: false }
        ]
      }
      const onUpdate = vi.fn()
      const onDelete = vi.fn()

      render(
        <AuthProvider>
          <Card
            card={mockCard}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </AuthProvider>
      )

      // Click the card to open edit modal
      await user.click(screen.getByText('Test Card'))

      // Find and uncheck the first checklist item (it's already checked)
      const checkboxes = screen.getAllByRole('checkbox')
      const checkedCheckbox = checkboxes.find(cb => 
        (cb as HTMLInputElement).checked
      )

      expect(checkedCheckbox).toBeTruthy()
      await user.click(checkedCheckbox!)

      // Should not track achievement for unchecking
      expect(achievementManager.trackChecklistCompleted).not.toHaveBeenCalled()
    })

    it('should track multiple checklist completions within the same card', async () => {
      const user = userEvent.setup()
      const mockCard = createMockCard()
      const onUpdate = vi.fn()
      const onDelete = vi.fn()

      render(
        <AuthProvider>
          <Card
            card={mockCard}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </AuthProvider>
      )

      // Click the card to open edit modal
      await user.click(screen.getByText('Test Card'))

      // Check both checklist items
      const checkboxes = screen.getAllByRole('checkbox')
      
      for (const checkbox of checkboxes) {
        if (!(checkbox as HTMLInputElement).checked) {
          await user.click(checkbox)
        }
      }

      // Should track achievement for each completion
      expect(achievementManager.trackChecklistCompleted).toHaveBeenCalledTimes(2)
    })
  })

  describe('Column Creation Achievement Tracking', () => {
    it('should track column creation when adding a new column via KanbanBoard', async () => {
      const user = userEvent.setup()
      const mockBoard = createMockBoard()
      const onUpdateBoard = vi.fn()

      render(
        <AuthProvider>
          <KanbanBoard
            board={mockBoard}
            onUpdateBoard={onUpdateBoard}
            settings={mockSettings}
          />
        </AuthProvider>
      )

      // Click the add column button
      const addColumnBtn = screen.getByText('Add Column')
      await user.click(addColumnBtn)

      // Fill in column title
      const titleInput = screen.getByPlaceholderText('Enter column title')
      await user.type(titleInput, 'New Test Column')

      // Submit the form
      const submitBtn = screen.getByRole('button', { name: /add column/i })
      await user.click(submitBtn)

      // Verify achievement tracking was called
      expect(achievementManager.trackColumnCreated).toHaveBeenCalledTimes(1)
      expect(onUpdateBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: expect.arrayContaining([
            expect.objectContaining({
              title: 'New Test Column'
            })
          ])
        })
      )
    })
  })

  describe('Achievement Integration with Board Management', () => {
    it('should maintain achievement state when board updates occur', async () => {
      const user = userEvent.setup()
      const mockBoard = createMockBoard()
      const onUpdateBoard = vi.fn()

      // Add some cards to the board
      mockBoard.columns[0].cards = [createMockCard()]

      render(
        <AuthProvider>
          <KanbanBoard
            board={mockBoard}
            onUpdateBoard={onUpdateBoard}
            settings={mockSettings}
          />
        </AuthProvider>
      )

      // Create a new card
      const addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      const titleInput = screen.getByPlaceholderText('Enter card title')
      await user.type(titleInput, 'Achievement Test Card')

      const submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      // Verify tracking still works after board state changes
      expect(achievementManager.trackCardCreated).toHaveBeenCalled()
    })
  })

  describe('Achievement Tracking Error Handling', () => {
    it('should handle achievement tracking failures gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock achievement manager to throw error
      vi.mocked(achievementManager.trackCardCreated).mockImplementation(() => {
        throw new Error('Achievement tracking failed')
      })

      const mockColumn: ColumnType = {
        id: 'col-1',
        title: 'To Do',
        boardId: 'test-board', 
        position: 0,
        cards: []
      }
      
      const onUpdateColumn = vi.fn()

      render(
        <AuthProvider>
          <Column
            column={mockColumn}
            settings={mockSettings}
            onUpdateColumn={onUpdateColumn}
            onDeleteColumn={vi.fn()}
          />
        </AuthProvider>
      )

      // Create a card - should not crash even if achievement tracking fails
      const addCardBtn = screen.getByText('Add a card')
      await user.click(addCardBtn)

      const titleInput = screen.getByPlaceholderText('Enter card title')
      await user.type(titleInput, 'Error Test Card')

      const submitBtn = screen.getByText('Add Card')
      await user.click(submitBtn)

      // Card should still be created even if achievement tracking fails
      expect(onUpdateColumn).toHaveBeenCalled()
    })
  })
})