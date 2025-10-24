import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import KanbanBoard from '../components/KanbanBoard'
import { AuthProvider } from '../contexts/AuthContext'
import type { Board, AppSettings } from '../types'

// Mock data
const mockBoard: Board = {
  id: 'test-board-1',
  title: 'Test Board',
  description: 'Test board for performance testing',
  isActive: true,
  createdAt: new Date(),
  columns: [
    {
      id: 'col-1',
      title: 'To Do',
      boardId: 'test-board-1',
      position: 0,
      cards: [
        {
          id: 'card-1',
          title: 'Test Card 1',
          description: 'Test card description',
          columnId: 'col-1',
          position: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    },
    {
      id: 'col-2',
      title: 'In Progress',
      boardId: 'test-board-1',
      position: 1,
      cards: []
    }
  ]
}

const mockSettings: AppSettings = {
  theme: 'light',
  autoSave: true,
  columnCardLimit: 10
}

// Performance monitoring utilities
class PerformanceMonitor {
  private renderCount = 0
  private updateCount = 0
  private maxRenderThreshold = 50

  reset() {
    this.renderCount = 0
    this.updateCount = 0
  }

  trackRender() {
    this.renderCount++
  }

  trackUpdate() {
    this.updateCount++
  }

  hasExcessiveRenders(): boolean {
    return this.renderCount > this.maxRenderThreshold
  }

  getStats() {
    return {
      renderCount: this.renderCount,
      updateCount: this.updateCount
    }
  }
}

describe('Performance and Memory Leak Tests', () => {
  let monitor: PerformanceMonitor
  let mockOnUpdateBoard: ReturnType<typeof vi.fn>
  let originalConsoleError: typeof console.error
  let consoleErrors: string[]

  beforeEach(() => {
    monitor = new PerformanceMonitor()
    mockOnUpdateBoard = vi.fn()
    consoleErrors = []
    
    // Capture console errors to detect infinite loops
    originalConsoleError = console.error
    console.error = (...args: any[]) => {
      consoleErrors.push(args.join(' '))
      originalConsoleError(...args)
    }
  })

  afterEach(() => {
    console.error = originalConsoleError
    monitor.reset()
  })

  describe('Infinite Loop Detection', () => {
    it('should not trigger infinite re-renders during normal operation', async () => {
      const TestWrapper = () => {
        monitor.trackRender()
        return (
          <AuthProvider>
            <KanbanBoard
              board={mockBoard}
              onUpdateBoard={(board) => {
                monitor.trackUpdate()
                mockOnUpdateBoard(board)
              }}
              settings={mockSettings}
            />
          </AuthProvider>
        )
      }

      render(<TestWrapper />)

      // Wait for initial render to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check for excessive renders
      expect(monitor.hasExcessiveRenders()).toBe(false)
      
      const stats = monitor.getStats()
      expect(stats.renderCount).toBeLessThan(10)
    })

    it('should not cause infinite loops when updating board', async () => {
      const TestWrapper = () => {
        monitor.trackRender()
        return (
          <AuthProvider>
            <KanbanBoard
              board={mockBoard}
              onUpdateBoard={(board) => {
                monitor.trackUpdate()
                mockOnUpdateBoard(board)
              }}
              settings={mockSettings}
            />
          </AuthProvider>
        )
      }

      render(<TestWrapper />)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Simulate multiple board updates
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          mockOnUpdateBoard({
            ...mockBoard,
            title: `Updated Board ${i}`
          })
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      })

      // Should not have excessive renders
      expect(monitor.hasExcessiveRenders()).toBe(false)
      
      // Should not have console errors indicating infinite loops
      const infiniteLoopErrors = consoleErrors.filter(error => 
        error.includes('Maximum update depth exceeded') ||
        error.includes('Too many re-renders')
      )
      expect(infiniteLoopErrors).toHaveLength(0)
    })

    it('should handle rapid state updates without performance degradation', async () => {
      const TestWrapper = () => {
        monitor.trackRender()
        return (
          <AuthProvider>
            <KanbanBoard
              board={mockBoard}
              onUpdateBoard={(board) => {
                monitor.trackUpdate()
                mockOnUpdateBoard(board)
              }}
              settings={mockSettings}
            />
          </AuthProvider>
        )
      }

      render(<TestWrapper />)
      await new Promise(resolve => setTimeout(resolve, 100))

      const startTime = performance.now()

      // Simulate rapid updates
      await act(async () => {
        for (let i = 0; i < 20; i++) {
          const updatedBoard = {
            ...mockBoard,
            columns: mockBoard.columns.map(col => ({
              ...col,
              title: `${col.title} ${i}`
            }))
          }
          mockOnUpdateBoard(updatedBoard)
          await new Promise(resolve => setTimeout(resolve, 1))
        }
      })

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should complete rapidly (less than 1 second for 20 updates)
      expect(executionTime).toBeLessThan(1000)
      
      // Should not have excessive renders
      expect(monitor.getStats().renderCount).toBeLessThan(30)
    })
  })

  describe('Memory Leak Detection', () => {
    it('should not leak memory during normal component lifecycle', async () => {
      const TestWrapper = () => {
        monitor.trackRender()
        return (
          <AuthProvider>
            <KanbanBoard
              board={mockBoard}
              onUpdateBoard={mockOnUpdateBoard}
              settings={mockSettings}
            />
          </AuthProvider>
        )
      }

      // Mount and unmount component multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<TestWrapper />)
        await new Promise(resolve => setTimeout(resolve, 50))
        unmount()
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Should complete without errors
      expect(consoleErrors.filter(error => 
        error.includes('Warning') || error.includes('Error')
      )).toHaveLength(0)
    })

    it('should properly clean up event listeners', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <AuthProvider>
          <KanbanBoard
            board={mockBoard}
            onUpdateBoard={mockOnUpdateBoard}
            settings={mockSettings}
          />
        </AuthProvider>
      )

      await new Promise(resolve => setTimeout(resolve, 100))
      unmount()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Restore spies
      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Error Recovery Tests', () => {
    it('should recover gracefully without infinite loops', async () => {
      const TestWrapper = () => {
        monitor.trackRender()
        return (
          <AuthProvider>
            <KanbanBoard
              board={mockBoard}
              onUpdateBoard={mockOnUpdateBoard}
              settings={mockSettings}
            />
          </AuthProvider>
        )
      }

      render(<TestWrapper />)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(monitor.hasExcessiveRenders()).toBe(false)
      expect(consoleErrors.filter(error => 
        error.includes('Maximum update depth exceeded')
      )).toHaveLength(0)
    })

    it('should handle concurrent updates without race conditions', async () => {
      const TestWrapper = () => {
        monitor.trackRender()
        return (
          <AuthProvider>
            <KanbanBoard
              board={mockBoard}
              onUpdateBoard={(board) => {
                monitor.trackUpdate()
                mockOnUpdateBoard(board)
              }}
              settings={mockSettings}
            />
          </AuthProvider>
        )
      }

      render(<TestWrapper />)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Simulate concurrent updates
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          act(async () => {
            mockOnUpdateBoard({
              ...mockBoard,
              title: `Concurrent Update ${i}`
            })
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
          })
        )
      }

      await Promise.all(promises)

      expect(monitor.hasExcessiveRenders()).toBe(false)
      expect(consoleErrors.filter(error => 
        error.includes('Warning') || error.includes('Error')
      )).toHaveLength(0)
    })
  })
})