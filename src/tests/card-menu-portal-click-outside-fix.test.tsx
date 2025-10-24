import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DndContext } from '@dnd-kit/core'
import KanbanBoard from '../components/KanbanBoard'
import type { Board, AppSettings } from '../types'

describe('Card Menu Portal Click Outside Bug Prevention', () => {
  const mockSettings: AppSettings = {
    columnCardLimit: 10,
    theme: 'dark',
    autoSave: true
  }

  const mockBoard: Board = {
    id: 'board-1',
    title: 'Test Board',
    description: 'Test board description',
    isActive: true,
    createdAt: new Date(),
    columns: [
      {
        id: 'col-1',
        title: 'To Do',
        boardId: 'board-1',
        position: 0,
        cards: [
          {
            id: 'test-card-1',
            title: 'Test Card for Menu Bug',
            description: 'This card tests the menu portal click outside issue',
            columnId: 'col-1',
            position: 0,
            priority: 'medium',
            tags: ['test'],
            checklist: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      }
    ]
  }

  const mockOnUpdateBoard = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any existing portals
    document.querySelectorAll('.card-menu-portal').forEach(el => el.remove())
  })

  it('should allow clicking Edit button in menu portal without interference from click outside handler', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Find the card
    const testCard = screen.getByText('Test Card for Menu Bug')
    expect(testCard).toBeInTheDocument()

    // Find and click the menu button (three dots)
    const menuButton = screen.getByTitle('Card options')
    expect(menuButton).toBeInTheDocument()
    
    fireEvent.click(menuButton)

    // Wait for menu portal to appear in DOM
    await waitFor(() => {
      const menuPortal = document.querySelector('.card-menu-portal')
      expect(menuPortal).toBeInTheDocument()
    })

    // Find the Edit button within the portal
    const editButton = screen.getByText('Edit')
    expect(editButton).toBeInTheDocument()

    // Click the Edit button - this should not be intercepted by click outside handler
    fireEvent.click(editButton)

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })

    // Verify modal content is correct
    expect(screen.getByDisplayValue('Test Card for Menu Bug')).toBeInTheDocument()
    expect(screen.getByDisplayValue('This card tests the menu portal click outside issue')).toBeInTheDocument()

    // Verify menu is closed after clicking Edit
    await waitFor(() => {
      const menuPortal = document.querySelector('.card-menu-portal')
      expect(menuPortal).not.toBeInTheDocument()
    })
  })

  it('should allow clicking Delete button in menu portal without interference', async () => {
    // Mock window.confirm to return true
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true)

    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Click menu button
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)

    // Wait for menu portal to appear
    await waitFor(() => {
      const menuPortal = document.querySelector('.card-menu-portal')
      expect(menuPortal).toBeInTheDocument()
    })

    // Click Delete button
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    // Verify board update was called (card should be deleted)
    await waitFor(() => {
      expect(mockOnUpdateBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: expect.arrayContaining([
            expect.objectContaining({
              cards: [] // Card should be removed
            })
          ])
        })
      )
    })

    // Restore original confirm
    window.confirm = originalConfirm
  })

  it('should close menu when clicking outside but not inside portal', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Click menu button to open menu
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)

    // Wait for menu portal to appear
    await waitFor(() => {
      const menuPortal = document.querySelector('.card-menu-portal')
      expect(menuPortal).toBeInTheDocument()
    })

    // Click outside the menu (on the board header)
    const boardTitle = screen.getByText('Test Board')
    fireEvent.mouseDown(boardTitle)

    // Menu should close
    await waitFor(() => {
      const menuPortal = document.querySelector('.card-menu-portal')
      expect(menuPortal).not.toBeInTheDocument()
    })
  })

  it('should NOT close menu when clicking inside the portal', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Click menu button to open menu
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)

    // Wait for menu portal to appear
    await waitFor(() => {
      const menuPortal = document.querySelector('.card-menu-portal')
      expect(menuPortal).toBeInTheDocument()
    })

    // Click inside the portal but not on a button (should not close menu)
    const menuPortal = document.querySelector('.card-menu-portal')!
    fireEvent.mouseDown(menuPortal)

    // Menu should still be open
    await waitFor(() => {
      const menuPortalAfter = document.querySelector('.card-menu-portal')
      expect(menuPortalAfter).toBeInTheDocument()
    })
  })

  it('should handle rapid menu open/close without causing issues', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    const menuButton = screen.getByTitle('Card options')

    // Rapidly open and close menu multiple times
    for (let i = 0; i < 5; i++) {
      fireEvent.click(menuButton) // Open
      
      await waitFor(() => {
        const menuPortal = document.querySelector('.card-menu-portal')
        expect(menuPortal).toBeInTheDocument()
      })

      fireEvent.click(menuButton) // Close
      
      await waitFor(() => {
        const menuPortal = document.querySelector('.card-menu-portal')
        expect(menuPortal).not.toBeInTheDocument()
      })
    }

    // Final test: ensure edit still works after rapid toggling
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      const editButton = screen.getByText('Edit')
      expect(editButton).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Edit'))

    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })
  })

  it('should work correctly with newly created cards', async () => {
    // Start with empty column
    const emptyBoard: Board = {
      ...mockBoard,
      columns: [{
        ...mockBoard.columns[0],
        cards: []
      }]
    }

    render(
      <DndContext>
        <KanbanBoard 
          board={emptyBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Click "Add a card" to show the form
    fireEvent.click(screen.getByText('Add a card'))

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter card title')).toBeInTheDocument()
    })

    // Create a new card
    const titleInput = screen.getByPlaceholderText('Enter card title')
    fireEvent.change(titleInput, { target: { value: 'Newly Created Card' } })
    fireEvent.click(screen.getByText('Add Card'))

    await waitFor(() => {
      expect(screen.getByText('Newly Created Card')).toBeInTheDocument()
    })

    // Test edit functionality on newly created card
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)

    await waitFor(() => {
      const menuPortal = document.querySelector('.card-menu-portal')
      expect(menuPortal).toBeInTheDocument()
    })

    // Click Edit - this should work without portal click outside interference
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Newly Created Card')).toBeInTheDocument()
    })
  })
})