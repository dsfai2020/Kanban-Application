import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Card from '../components/Card'
import type { Card as CardType } from '../types'

// Mock react-dom createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children
  }
})

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false
  })
}))

describe('Edit Button Issue Investigation', () => {
  const baseCard: CardType = {
    id: 'test-card',
    title: 'Test Card',
    columnId: 'test-column',
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle cards with missing onUpdate or onDelete handlers', () => {
    // Test with undefined handlers - this might be the real issue!
    render(
      <Card 
        card={baseCard} 
        onUpdate={undefined as any} 
        onDelete={undefined as any} 
      />
    )

    // Menu button should now exist but be disabled
    const menuButton = screen.getByTitle('Editing not available')
    expect(menuButton).toBeInTheDocument()
    expect(menuButton).toBeDisabled()

    // Clicking disabled button should NOT show the modal
    fireEvent.click(menuButton)

    // Menu should not appear since button is disabled
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('should handle cards with null handlers', () => {
    render(
      <Card 
        card={baseCard} 
        onUpdate={null as any} 
        onDelete={null as any} 
      />
    )

    const menuButton = screen.getByTitle('Editing not available')
    expect(menuButton).toBeInTheDocument()
    expect(menuButton).toBeDisabled()

    fireEvent.click(menuButton)

    // Should not show edit menu with null handlers
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('should work correctly with proper handlers', async () => {
    render(
      <Card 
        card={baseCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })
  })

  it('should handle cards with missing required properties', async () => {
    const incompleteCard = {
      id: 'incomplete',
      title: 'Incomplete Card',
      columnId: 'test',
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date()
      // Missing other optional properties
    } as CardType

    render(
      <Card 
        card={incompleteCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)

    const editButton = await screen.findByText('Edit')
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Incomplete Card')).toBeInTheDocument()
    })
  })

  it('should handle cards without optional props passed to Card component', () => {
    // This tests if the Card component can handle being called without onUpdate/onDelete
    render(<Card card={baseCard} />)

    const menuButton = screen.queryByTitle('Card options')
    
    // The menu button should not appear if no handlers are provided
    expect(menuButton).not.toBeInTheDocument()
  })

  it('should verify the Card component conditional rendering logic', () => {
    // This reproduces exactly how the Column component calls Card
    const CardWithHandlers = () => (
      <Card 
        card={baseCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const CardWithoutHandlers = () => (
      <Card card={baseCard} />
    )

    // Test with handlers
    const { rerender } = render(<CardWithHandlers />)
    expect(screen.getByTitle('Card options')).toBeInTheDocument()

    // Test without handlers
    rerender(<CardWithoutHandlers />)
    expect(screen.queryByTitle('Card options')).not.toBeInTheDocument()
  })

  it('should debug the exact issue scenario', async () => {
    // Let's simulate what might be happening in the real app
    const realWorldCard: CardType = {
      id: 'real-card',
      title: 'Welcome to your Kanban board! 🎉',
      description: 'Click the menu (⋯) to edit this card and explore the features',
      columnId: 'column-1',
      position: 0,
      tags: ['welcome', 'getting-started'],
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      checklist: [
        {
          id: 'check-1',
          text: 'Explore the card editing features',
          completed: false
        }
      ]
    }

    render(
      <Card 
        card={realWorldCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    // Check if all card content renders
    expect(screen.getByText('Welcome to your Kanban board! 🎉')).toBeInTheDocument()
    expect(screen.getByText('Click the menu (⋯) to edit this card and explore the features')).toBeInTheDocument()
    expect(screen.getByText('welcome')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()

    // Check menu functionality
    const menuButton = screen.getByTitle('Card options')
    expect(menuButton).toBeInTheDocument()

    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    // Click edit
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    // Verify modal opens with all content
    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Welcome to your Kanban board! 🎉')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Click the menu (⋯) to edit this card and explore the features')).toBeInTheDocument()
      expect(screen.getByText('Explore the card editing features')).toBeInTheDocument()
    })
  })
})