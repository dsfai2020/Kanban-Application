import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DndContext } from '@dnd-kit/core'
import KanbanBoard from '../components/KanbanBoard'
import type { Board, AppSettings } from '../types'

describe('Edit Modal Debugging Test', () => {
  const mockSettings: AppSettings = {
    columnCardLimit: 10,
    theme: 'dark',
    autoSave: true
  }

  const mockBoard: Board = {
    id: 'board-1',
    title: 'Test Board',
    description: 'Test board for debugging',
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
            id: 'card-1',
            title: 'Test Card with Edit',
            description: 'This card should have a working edit button',
            columnId: 'col-1',
            position: 0,
            priority: 'medium',
            tags: ['test'],
            checklist: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'card-2',
            title: 'Another Test Card',
            description: 'Another card for testing',
            columnId: 'col-1',
            position: 1,
            priority: 'high',
            tags: ['debug'],
            checklist: [
              { id: 'check-1', text: 'Test item', completed: false }
            ],
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
    // Mock console.log to capture our debug messages
    global.console.log = vi.fn()
  })

  it('should verify cards render with edit functionality', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Verify cards are rendered
    expect(screen.getByText('Test Card with Edit')).toBeInTheDocument()
    expect(screen.getByText('Another Test Card')).toBeInTheDocument()

    // Find all menu buttons (there should be 2, one for each card)
    const menuButtons = screen.getAllByTitle('Card options')
    expect(menuButtons).toHaveLength(2)

    // Click the first card's menu button
    fireEvent.click(menuButtons[0])

    // Wait for menu to appear
    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit')
      expect(editButtons).toHaveLength(1)
    })

    // Click the edit button
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })

    // Verify modal content
    expect(screen.getByDisplayValue('Test Card with Edit')).toBeInTheDocument()
    expect(screen.getByDisplayValue('This card should have a working edit button')).toBeInTheDocument()
  })

  it('should verify second card also has working edit functionality', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Find all menu buttons
    const menuButtons = screen.getAllByTitle('Card options')
    
    // Click the second card's menu button (index 1)
    fireEvent.click(menuButtons[1])

    // Wait for menu to appear
    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit')
      expect(editButtons).toHaveLength(1)
    })

    // Click the edit button
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })

    // Verify modal content for second card
    expect(screen.getByDisplayValue('Another Test Card')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Another card for testing')).toBeInTheDocument()
    
    // Check checklist is present
    expect(screen.getByText('Test item')).toBeInTheDocument()
  })

  it('should handle form submission correctly', async () => {
    render(
      <DndContext>
        <KanbanBoard 
          board={mockBoard} 
          onUpdateBoard={mockOnUpdateBoard}
          settings={mockSettings}
        />
      </DndContext>
    )

    // Open edit modal for first card
    const menuButtons = screen.getAllByTitle('Card options')
    fireEvent.click(menuButtons[0])
    
    const editButton = await screen.findByText('Edit')
    fireEvent.click(editButton)

    // Wait for modal and modify title
    const titleInput = await screen.findByDisplayValue('Test Card with Edit')
    fireEvent.change(titleInput, { target: { value: 'Modified Test Card' } })

    // Click save
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    // Verify the board update function was called
    await waitFor(() => {
      expect(mockOnUpdateBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: expect.arrayContaining([
            expect.objectContaining({
              cards: expect.arrayContaining([
                expect.objectContaining({
                  title: 'Modified Test Card'
                })
              ])
            })
          ])
        })
      )
    })
  })
})