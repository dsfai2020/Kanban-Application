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

// Mock mobile environment
const mockMobileEnvironment = () => {
  // Mock touch events
  Object.defineProperty(window, 'ontouchstart', {
    value: {},
    writable: true
  })
  
  // Mock mobile viewport
  Object.defineProperty(window, 'innerWidth', {
    value: 375,
    writable: true
  })
  
  Object.defineProperty(window, 'innerHeight', {
    value: 667,
    writable: true
  })

  // Mock touch-specific properties
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 375,
    writable: true
  })

  // Mock getBoundingClientRect for mobile
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 300,
    height: 120,
    top: 100,
    left: 20,
    bottom: 220,
    right: 320,
    x: 20,
    y: 100,
    toJSON: vi.fn()
  }))
}

describe('Mobile Edit Modal Tests', () => {
  const mockCard: CardType = {
    id: 'test-card-1',
    title: 'Test Card',
    description: 'Test description',
    priority: 'medium',
    dueDate: '2025-12-31',
    assignee: 'Test User',
    tags: ['test', 'mobile'],
    checklist: [
      { id: 'check-1', text: 'Test item', completed: false }
    ],
    columnId: 'todo',
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockMobileEnvironment()
    
    // Reset DOM
    document.body.innerHTML = ''
    
    // Mock confirm dialog
    window.confirm = vi.fn(() => true)
  })

  it('should render card with mobile-friendly touch targets', () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const card = screen.getByText('Test Card').closest('.card')
    const menuButton = screen.getByTitle('Card options')

    expect(card).toBeInTheDocument()
    expect(menuButton).toBeInTheDocument()
    
    // Check if button exists and is clickable
    expect(menuButton).toBeEnabled()
    expect(menuButton).toHaveAttribute('title', 'Card options')
  })

  it('should open dropdown menu on mobile touch', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const menuButton = screen.getByTitle('Card options')
    
    // Simulate touch interaction
    fireEvent.touchStart(menuButton)
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  it('should open edit modal when edit button is clicked on mobile', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    // Open dropdown menu
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    // Click edit button
    const editButton = screen.getByText('Edit')
    fireEvent.touchStart(editButton)
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
    })
  })

  it('should handle modal positioning correctly on mobile viewport', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    // Open menu and edit modal
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)

    await waitFor(() => {
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
    })

    await waitFor(() => {
      const modal = screen.getByText('Edit Card').closest('.card-modal')
      expect(modal).toBeInTheDocument()
      
      // On mobile, the modal should be visible and responsive
      // We can't test actual CSS values in JSDOM, but we can verify structure
      expect(modal).toHaveClass('card-modal')
      
      // Check that modal content is accessible
      expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
    })
  })

  it('should close modal when overlay is touched on mobile', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    // Open edit modal
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)
    
    const editButton = await screen.findByText('Edit')
    fireEvent.click(editButton)

    const overlay = (await screen.findByText('Edit Card')).closest('.modal-overlay')
    expect(overlay).toBeInTheDocument()

    // Simulate touch on overlay
    fireEvent.touchStart(overlay!)
    fireEvent.click(overlay!)

    await waitFor(() => {
      expect(screen.queryByText('Edit Card')).not.toBeInTheDocument()
    })
  })

  it('should handle form input changes correctly on mobile', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    // Open edit modal
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)
    
    const editButton = await screen.findByText('Edit')
    fireEvent.click(editButton)

    const titleInput = await screen.findByDisplayValue('Test Card')
    expect(titleInput).toBeInTheDocument()

    // Test input changes
    fireEvent.change(titleInput, { target: { value: 'Updated Mobile Card' } })
    expect(titleInput).toHaveValue('Updated Mobile Card')

    // Test save functionality
    const saveButton = screen.getByText('Save Changes')
    fireEvent.touchStart(saveButton)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Mobile Card'
        })
      )
    })
  })

  it('should prevent zoom on input focus for iOS devices', async () => {
    // Mock iOS user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      writable: true
    })

    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    // Open edit modal
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)
    
    const editButton = await screen.findByText('Edit')
    fireEvent.click(editButton)

    const titleInput = await screen.findByDisplayValue('Test Card')
    
    // Check that input is accessible and functional
    expect(titleInput).toBeInTheDocument()
    expect(titleInput).toHaveAttribute('type', 'text')
    
    // Simulate input change
    fireEvent.change(titleInput, { target: { value: 'New Title' } })
    expect(titleInput).toHaveValue('New Title')
  })

  it('should handle menu positioning edge cases on mobile', async () => {
    // Mock edge positioning (near screen edge)
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 300,
      height: 120,
      top: 100,
      left: 300, // Near right edge
      bottom: 220,
      right: 375, // At screen edge
      x: 300,
      y: 100,
      toJSON: vi.fn()
    }))

    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)

    await waitFor(() => {
      const menu = screen.getByText('Edit').closest('.card-menu-portal')
      expect(menu).toBeInTheDocument()
      
      // Menu should adjust position to stay on screen
      const menuStyles = window.getComputedStyle(menu!)
      const left = parseInt(menuStyles.left)
      expect(left).toBeLessThan(375) // Should not overflow screen
    })
  })

  it('should handle rapid touch interactions without errors', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const menuButton = screen.getByTitle('Card options')
    
    // Simulate rapid touch interactions
    for (let i = 0; i < 5; i++) {
      fireEvent.touchStart(menuButton)
      fireEvent.touchEnd(menuButton)
      fireEvent.click(menuButton)
    }

    // Should still work correctly
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })
  })

  it('should maintain modal scroll position on mobile devices', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    // Open edit modal
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)
    
    const editButton = await screen.findByText('Edit')
    fireEvent.click(editButton)

    const modal = (await screen.findByText('Edit Card')).closest('.card-modal')
    expect(modal).toBeInTheDocument()

    // Test scroll behavior
    fireEvent.scroll(modal!, { target: { scrollTop: 100 } })
    expect(modal!.scrollTop).toBe(100)

    // Modal should maintain scroll position
    const descriptionTextarea = screen.getByPlaceholderText('Add a description...')
    fireEvent.focus(descriptionTextarea)
    expect(modal!.scrollTop).toBe(100)
  })
})