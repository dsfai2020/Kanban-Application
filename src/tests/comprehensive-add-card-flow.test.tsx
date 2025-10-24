import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DndContext } from '@dnd-kit/core'
import KanbanBoard from '../components/KanbanBoard'
import type { Board, AppSettings } from '../types'

describe('Comprehensive Add Card Edit Flow', () => {
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
        cards: []
      }
    ]
  }

  const mockOnUpdateBoard = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reproduce the exact user workflow step by step', async () => {
    console.log('Step 1: Rendering KanbanBoard')
    const { debug } = render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Step 1: Check initial state
    console.log('Step 2: Checking for "Add a card" button')
    const addCardButtons = screen.queryAllByText('Add a card')
    console.log('Found Add a card buttons:', addCardButtons.length)
    
    if (addCardButtons.length === 0) {
      console.log('No Add a card button found, checking for form...')
      const titleInput = screen.queryByPlaceholderText('Enter card title')
      if (titleInput) {
        console.log('Form already visible')
      } else {
        console.log('Neither button nor form found!')
        debug()
        throw new Error('Cannot find add card functionality')
      }
    } else {
      console.log('Step 3: Clicking "Add a card" button')
      fireEvent.click(addCardButtons[0])
    }

    // Step 2: Wait for form to appear
    console.log('Step 4: Waiting for form to appear')
    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('Enter card title')
      expect(titleInput).toBeInTheDocument()
    })

    // Step 3: Fill out the form
    console.log('Step 5: Filling out the form')
    const titleInput = screen.getByPlaceholderText('Enter card title')
    const descriptionInput = screen.getByPlaceholderText('Enter card description (optional)')
    
    fireEvent.change(titleInput, { target: { value: 'Test Card from Add Button' } })
    fireEvent.change(descriptionInput, { target: { value: 'Created via Add a card button' } })

    // Step 4: Submit the form
    console.log('Step 6: Submitting the form')
    const addButton = screen.getByText('Add Card')
    fireEvent.click(addButton)

    // Step 5: Wait for card to be created
    console.log('Step 7: Waiting for card to be created')
    await waitFor(() => {
      expect(screen.getByText('Test Card from Add Button')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Step 6: Verify the card is rendered with all expected properties
    console.log('Step 8: Verifying card is rendered correctly')
    const cardElement = screen.getByText('Test Card from Add Button').closest('.card')
    expect(cardElement).toBeInTheDocument()
    
    // Step 7: Find and verify the card menu button
    console.log('Step 9: Looking for card menu button')
    const menuButton = screen.getByTitle('Card options')
    expect(menuButton).toBeInTheDocument()
    expect(menuButton).not.toBeDisabled()
    console.log('Menu button found and is enabled')

    // Step 8: Click the menu button
    console.log('Step 10: Clicking card menu button')
    fireEvent.click(menuButton)

    // Step 9: Wait for menu to appear
    console.log('Step 11: Waiting for menu to appear')
    await waitFor(() => {
      const editButton = screen.getByText('Edit')
      expect(editButton).toBeInTheDocument()
    }, { timeout: 3000 })

    // Step 10: Click edit button
    console.log('Step 12: Clicking edit button')
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    // Step 11: Wait for modal to appear
    console.log('Step 13: Waiting for edit modal to appear')
    await waitFor(() => {
      const modalTitle = screen.getByText('Edit Card')
      expect(modalTitle).toBeInTheDocument()
    }, { timeout: 5000 })

    // Step 12: Verify modal content
    console.log('Step 14: Verifying modal content')
    const titleField = screen.getByDisplayValue('Test Card from Add Button')
    const descField = screen.getByDisplayValue('Created via Add a card button')
    expect(titleField).toBeInTheDocument()
    expect(descField).toBeInTheDocument()

    console.log('✅ All steps completed successfully!')
  })

  it('should verify the onUpdate and onDelete handlers are properly passed', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Add a card first
    const titleInput = screen.getByPlaceholderText('Enter card title')
    fireEvent.change(titleInput, { target: { value: 'Handler Test Card' } })
    fireEvent.click(screen.getByText('Add Card'))

    await waitFor(() => {
      expect(screen.getByText('Handler Test Card')).toBeInTheDocument()
    })

    // Check if the card component has the handlers
    const cardElement = screen.getByText('Handler Test Card').closest('.card')
    expect(cardElement).toBeInTheDocument()

    // The menu button should be enabled (which means handlers are passed)
    const menuButton = screen.getByTitle('Card options')
    expect(menuButton).not.toBeDisabled()

    // Try to open edit modal
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Edit'))

    // If we get here without errors, handlers are working
    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('Handler Test Card')).toBeInTheDocument()
  })

  it('should test the exact sequence: create multiple cards and edit each', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Create first card
    let titleInput = screen.getByPlaceholderText('Enter card title')
    fireEvent.change(titleInput, { target: { value: 'First Card' } })
    fireEvent.click(screen.getByText('Add Card'))

    await waitFor(() => {
      expect(screen.getByText('First Card')).toBeInTheDocument()
    })

    // Click "Add a card" again for second card
    fireEvent.click(screen.getByText('Add a card'))
    
    await waitFor(() => {
      titleInput = screen.getByPlaceholderText('Enter card title')
      expect(titleInput).toBeInTheDocument()
    })

    // Create second card
    fireEvent.change(titleInput, { target: { value: 'Second Card' } })
    fireEvent.click(screen.getByText('Add Card'))

    await waitFor(() => {
      expect(screen.getByText('Second Card')).toBeInTheDocument()
    })

    // Now test editing both cards
    const menuButtons = screen.getAllByTitle('Card options')
    expect(menuButtons).toHaveLength(2)

    // Test first card
    fireEvent.click(menuButtons[0])
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Edit'))
    await waitFor(() => {
      expect(screen.getByDisplayValue('First Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Cancel'))

    // Test second card
    await waitFor(() => {
      expect(screen.queryByText('Edit Card')).not.toBeInTheDocument()
    })
    
    fireEvent.click(menuButtons[1])
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Edit'))
    await waitFor(() => {
      expect(screen.getByDisplayValue('Second Card')).toBeInTheDocument()
    })

    console.log('✅ Both newly created cards can be edited successfully!')
  })
})