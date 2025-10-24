import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DndContext } from '@dnd-kit/core'
import KanbanBoard from '../components/KanbanBoard'
import type { Board, AppSettings } from '../types'

describe('Add Card Edit Modal Test', () => {
  const mockSettings: AppSettings = {
    columnCardLimit: 10,
    theme: 'dark',
    autoSave: true
  }

  const mockBoard: Board = {
    id: 'board-1',
    title: 'Test Board',
    description: 'Test board',
    isActive: true,
    createdAt: new Date(),
    columns: [
      {
        id: 'col-1',
        title: 'To Do',
        boardId: 'board-1',
        position: 0,
        cards: [] // Start with empty column
      }
    ]
  }

  const mockOnUpdateBoard = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow editing newly created cards', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Check what's currently rendered
    const addCardButton = screen.queryByText('Add a card')
    const titleInput = screen.queryByPlaceholderText('Enter card title')
    
    if (addCardButton) {
      // Click "Add a card" button to show form
      fireEvent.click(addCardButton)
      
      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter card title')).toBeInTheDocument()
      })
    } else if (titleInput) {
      // Form is already visible, just use it
      expect(titleInput).toBeInTheDocument()
    } else {
      throw new Error('Neither Add a card button nor form is visible')
    }

    // Fill in card details (using correct placeholder text)
    const titleInputField = screen.getByPlaceholderText('Enter card title')
    const descriptionInput = screen.getByPlaceholderText('Enter card description (optional)')
    
    fireEvent.change(titleInputField, { target: { value: 'New Test Card' } })
    fireEvent.change(descriptionInput, { target: { value: 'This is a new test card' } })

    // Submit the form
    fireEvent.click(screen.getByText('Add Card'))

    // Wait for card to be created and form to close
    await waitFor(() => {
      expect(screen.getByText('New Test Card')).toBeInTheDocument()
      expect(screen.getByText('This is a new test card')).toBeInTheDocument()
    })

    // Verify that the board update was called with the new card
    expect(mockOnUpdateBoard).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.arrayContaining([
          expect.objectContaining({
            cards: expect.arrayContaining([
              expect.objectContaining({
                title: 'New Test Card',
                description: 'This is a new test card'
              })
            ])
          })
        ])
      })
    )

    // Now try to edit the newly created card
    const menuButton = screen.getByTitle('Card options')
    expect(menuButton).toBeInTheDocument()
    expect(menuButton).not.toBeDisabled()

    // Click the menu button
    fireEvent.click(menuButton)

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    // Click the edit button
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    // Wait for modal to appear - this is where the issue might be
    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })

    // Verify modal content
    expect(screen.getByDisplayValue('New Test Card')).toBeInTheDocument()
    expect(screen.getByDisplayValue('This is a new test card')).toBeInTheDocument()
  })

  it('should compare default card vs newly created card functionality', async () => {
    // Create a board with a default card
    const boardWithDefaultCard: Board = {
      ...mockBoard,
      columns: [
        {
          id: 'col-1',
          title: 'To Do',
          boardId: 'board-1',
          position: 0,
          cards: [
            {
              id: 'default-card',
              title: 'Default Card',
              description: 'This is a default card',
              columnId: 'col-1',
              position: 0,
              priority: 'medium',
              tags: [],
              checklist: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      ]
    }

    render(
      <DndContext>
        <KanbanBoard 
          board={boardWithDefaultCard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Test editing the default card first
    let menuButtons = screen.getAllByTitle('Card options')
    expect(menuButtons[0]).toBeInTheDocument()
    expect(menuButtons[0]).not.toBeDisabled()

    fireEvent.click(menuButtons[0])
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Edit'))

    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })

    // Close the modal
    fireEvent.click(screen.getByText('Cancel'))

    await waitFor(() => {
      expect(screen.queryByText('Edit Card')).not.toBeInTheDocument()
    })

    // Now add a new card
    fireEvent.click(screen.getByText('Add a card'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter card title')).toBeInTheDocument()
    })

    const titleInput = screen.getByPlaceholderText('Enter card title')
    fireEvent.change(titleInput, { target: { value: 'New Added Card' } })
    fireEvent.click(screen.getByText('Add Card'))

    await waitFor(() => {
      expect(screen.getByText('New Added Card')).toBeInTheDocument()
    })

    // Now test editing the newly added card
    menuButtons = screen.getAllByTitle('Card options')
    expect(menuButtons).toHaveLength(2) // Should have 2 cards now

    // Click on the second card's menu (the newly added one)
    fireEvent.click(menuButtons[1])

    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit')
      expect(editButtons).toHaveLength(1)
    })

    fireEvent.click(screen.getByText('Edit'))

    // This should work for the newly created card too
    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
      expect(screen.getByDisplayValue('New Added Card')).toBeInTheDocument()
    })
  })
})