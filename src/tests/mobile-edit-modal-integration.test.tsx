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

describe('Mobile Edit Modal Integration Test', () => {
  const mockCard: CardType = {
    id: 'test-card-1',
    title: 'Mobile Test Card',
    description: 'This card should open edit modal on mobile',
    priority: 'high',
    dueDate: '2025-12-31',
    assignee: 'Mobile User',
    tags: ['mobile', 'test', 'edit'],
    checklist: [
      { id: 'check-1', text: 'Test edit modal', completed: false },
      { id: 'check-2', text: 'Verify mobile functionality', completed: true }
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
    
    // Mock mobile environment
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    })
    
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
      writable: true
    })

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

    window.confirm = vi.fn(() => true)
  })

  it('should complete full mobile edit modal workflow', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    // Step 1: Verify card renders with all content
    expect(screen.getByText('Mobile Test Card')).toBeInTheDocument()
    expect(screen.getByText('This card should open edit modal on mobile')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('Mobile User')).toBeInTheDocument()
    expect(screen.getByText('mobile')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument() // checklist progress

    // Step 2: Open menu
    const menuButton = screen.getByTitle('Card options')
    expect(menuButton).toBeInTheDocument()
    expect(menuButton).toBeEnabled()

    fireEvent.click(menuButton)

    // Step 3: Verify menu appears
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    // Step 4: Click edit button
    const editButton = screen.getByText('Edit')
    fireEvent.click(editButton)

    // Step 5: Verify modal opens with all form fields
    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
      
      // Check all form fields are present and populated
      expect(screen.getByDisplayValue('Mobile Test Card')).toBeInTheDocument()
      expect(screen.getByDisplayValue('This card should open edit modal on mobile')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Mobile User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2025-12-31')).toBeInTheDocument()
      
      // Check tags (use getAllByText for duplicates)
      const mobileTags = screen.getAllByText('mobile')
      expect(mobileTags.length).toBeGreaterThan(0) // Should appear in both card and modal
      
      const testTags = screen.getAllByText('test')
      expect(testTags.length).toBeGreaterThan(0)
      
      const editTags = screen.getAllByText('edit')
      expect(editTags.length).toBeGreaterThan(0)
      
      // Check checklist items
      expect(screen.getByText('Test edit modal')).toBeInTheDocument()
      expect(screen.getByText('Verify mobile functionality')).toBeInTheDocument()
      
      // Check action buttons
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Delete Card')).toBeInTheDocument()
    })

    // Step 6: Test form interaction
    const titleInput = screen.getByDisplayValue('Mobile Test Card')
    fireEvent.change(titleInput, { target: { value: 'Updated Mobile Card' } })
    expect(titleInput).toHaveValue('Updated Mobile Card')

    const descriptionTextarea = screen.getByDisplayValue('This card should open edit modal on mobile')
    fireEvent.change(descriptionTextarea, { target: { value: 'Updated description for mobile' } })
    expect(descriptionTextarea).toHaveValue('Updated description for mobile')

    // Step 7: Test save functionality
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Mobile Card',
          description: 'Updated description for mobile'
        })
      )
    })

    // Step 8: Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText('Edit Card')).not.toBeInTheDocument()
    })
  })

  it('should handle touch events properly on mobile', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const menuButton = screen.getByTitle('Card options')

    // Simulate touch events
    fireEvent.touchStart(menuButton)
    fireEvent.touchEnd(menuButton)
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    // Touch the edit button
    const editButton = screen.getByText('Edit')
    fireEvent.touchStart(editButton)
    fireEvent.touchEnd(editButton)
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })
  })

  it('should handle modal overlay touch correctly', async () => {
    render(
      <Card 
        card={mockCard} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    // Open modal
    const menuButton = screen.getByTitle('Card options')
    fireEvent.click(menuButton)
    
    const editButton = await screen.findByText('Edit')
    fireEvent.click(editButton)

    const modalOverlay = await screen.findByText('Edit Card').then(el => el.closest('.modal-overlay'))
    expect(modalOverlay).toBeInTheDocument()

    // Touch outside modal (on overlay)
    fireEvent.touchStart(modalOverlay!)
    fireEvent.click(modalOverlay!)

    await waitFor(() => {
      expect(screen.queryByText('Edit Card')).not.toBeInTheDocument()
    })
  })

  it('should handle mobile viewport edge cases', async () => {
    // Test near screen edge
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
      // Menu should still be accessible even at screen edge
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })
})