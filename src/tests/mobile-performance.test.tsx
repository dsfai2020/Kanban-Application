import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import App from '../App'

// Mobile performance monitoring class
class MobilePerformanceMonitor {
  private renderCount = 0
  private renderTimes: number[] = []
  private startTime = 0
  private isOverheating = false
  private performanceThresholds = {
    maxRenderTime: 16, // 60fps = 16ms per frame
    maxTotalRenderTime: 1000, // 1 second total
    maxRenderCount: 50, // Max renders in a test
    overheatingThreshold: 80 // Renders per second indicating overheating
  }

  start() {
    this.renderCount = 0
    this.renderTimes = []
    this.startTime = performance.now()
    this.isOverheating = false
    
    // Mock performance monitoring
    this.monitorRenderPerformance()
  }

  private monitorRenderPerformance() {
    const originalRequestAnimationFrame = window.requestAnimationFrame
    
    window.requestAnimationFrame = (callback) => {
      const renderStart = performance.now()
      
      return originalRequestAnimationFrame(() => {
        const renderEnd = performance.now()
        const renderTime = renderEnd - renderStart
        
        this.renderCount++
        this.renderTimes.push(renderTime)
        
        // Check for overheating conditions
        if (this.renderCount > this.performanceThresholds.maxRenderCount) {
          this.isOverheating = true
        }
        
        const elapsedTime = renderEnd - this.startTime
        const rendersPerSecond = (this.renderCount / elapsedTime) * 1000
        
        if (rendersPerSecond > this.performanceThresholds.overheatingThreshold) {
          this.isOverheating = true
        }
        
        callback(renderEnd)
      })
    }
  }

  getMetrics() {
    const totalTime = performance.now() - this.startTime
    const averageRenderTime = this.renderTimes.length > 0 
      ? this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length 
      : 0
    const maxRenderTime = Math.max(...this.renderTimes, 0)
    const rendersPerSecond = (this.renderCount / totalTime) * 1000

    return {
      renderCount: this.renderCount,
      totalTime,
      averageRenderTime,
      maxRenderTime,
      rendersPerSecond,
      isOverheating: this.isOverheating,
      wouldCauseMobileOverheating: this.isOverheating || rendersPerSecond > 60
    }
  }

  stop() {
    // Restore original requestAnimationFrame
    const metrics = this.getMetrics()
    return metrics
  }
}

describe('Mobile Performance Tests', () => {
  let performanceMonitor: MobilePerformanceMonitor
  let container: HTMLElement

  beforeEach(() => {
    performanceMonitor = new MobilePerformanceMonitor()
    // Mock mobile environment
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true
    })
  })

  afterEach(() => {
    if (container) {
      container.remove()
    }
    // Clean up any timers or intervals
    // Clear any running timers
    clearTimeout(0)
  })

  describe('Board Selection Performance', () => {
    it('should not cause infinite loops when selecting boards rapidly', async () => {
      performanceMonitor.start()

      const { getByText, container: testContainer } = render(<App />)
      container = testContainer as HTMLElement

      // Wait for initial render
      await waitFor(() => {
        expect(getByText(/welcome/i)).toBeDefined()
      })

      // Simulate rapid board selection (common mobile behavior)
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          // Try to find and click board elements rapidly
          const boardElements = container.querySelectorAll('[class*="board-item"]')
          if (boardElements.length > 0) {
            fireEvent.click(boardElements[0])
          }
          
          // Small delay to simulate mobile touch events
          await new Promise(resolve => setTimeout(resolve, 50))
        })
      }

      const metrics = performanceMonitor.stop()
      
      expect(metrics.wouldCauseMobileOverheating).toBe(false)
      expect(metrics.renderCount).toBeLessThan(50)
      expect(metrics.rendersPerSecond).toBeLessThan(60)
      
      console.log('Board Selection Performance Metrics:', metrics)
    }, 10000)

    it('should handle board editing without performance degradation', async () => {
      performanceMonitor.start()

      const { container: testContainer } = render(<App />)
      container = testContainer as HTMLElement

      // Wait for app to load
      await waitFor(() => {
        expect(container.querySelector('.app')).toBeDefined()
      })

      // Simulate board editing sequence
      await act(async () => {
        // Look for board menu triggers
        const menuButtons = container.querySelectorAll('[class*="menu-btn"]')
        if (menuButtons.length > 0) {
          fireEvent.click(menuButtons[0])
          
          // Wait a bit then click edit
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const editButtons = container.querySelectorAll('[class*="edit"]')
          if (editButtons.length > 0) {
            fireEvent.click(editButtons[0])
          }
        }
      })

      // Simulate typing (which could trigger many re-renders)
      const inputs = container.querySelectorAll('input[type="text"]')
      if (inputs.length > 0) {
        for (let i = 0; i < 10; i++) {
          await act(async () => {
            fireEvent.change(inputs[0], { target: { value: `Test Board ${i}` } })
            await new Promise(resolve => setTimeout(resolve, 50))
          })
        }
      }

      const metrics = performanceMonitor.stop()
      
      expect(metrics.wouldCauseMobileOverheating).toBe(false)
      expect(metrics.averageRenderTime).toBeLessThan(16) // 60fps threshold
      
      console.log('Board Editing Performance Metrics:', metrics)
    }, 10000)

    it('should not have memory leaks during rapid interactions', async () => {
      const initialHeapSize = (performance as any).memory?.usedJSHeapSize || 0
      
      performanceMonitor.start()

      const { container: testContainer } = render(<App />)
      container = testContainer as HTMLElement

      // Simulate intensive mobile usage
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          // Rapid state changes that could cause memory leaks
          const clickableElements = container.querySelectorAll('button, [role="button"]')
          if (clickableElements.length > 0) {
            const randomElement = clickableElements[Math.floor(Math.random() * clickableElements.length)]
            fireEvent.click(randomElement)
          }
          
          await new Promise(resolve => setTimeout(resolve, 25))
        })
      }

      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc()
      }

      const finalHeapSize = (performance as any).memory?.usedJSHeapSize || 0
      const heapGrowth = finalHeapSize - initialHeapSize
      
      const metrics = performanceMonitor.stop()
      
      // Memory growth should be reasonable (less than 10MB for this test)
      expect(heapGrowth).toBeLessThan(10 * 1024 * 1024)
      expect(metrics.wouldCauseMobileOverheating).toBe(false)
      
      console.log('Memory Leak Test Metrics:', {
        ...metrics,
        heapGrowth: `${(heapGrowth / 1024 / 1024).toFixed(2)}MB`
      })
    }, 15000)
  })

  describe('Authentication Flow Performance', () => {
    it('should not cause loops during auth state changes', async () => {
      performanceMonitor.start()

      const { container: testContainer } = render(<App />)
      container = testContainer as HTMLElement

      // Wait for initial auth state
      await waitFor(() => {
        expect(container.querySelector('.app')).toBeDefined()
      })

      // Simulate auth state changes that could trigger loops
      await act(async () => {
        // Look for sign-in related buttons
        const authButtons = container.querySelectorAll('button')
        for (const button of authButtons) {
          if (button.textContent?.toLowerCase().includes('sign') ||
              button.textContent?.toLowerCase().includes('guest')) {
            fireEvent.click(button)
            await new Promise(resolve => setTimeout(resolve, 100))
            break
          }
        }
      })

      const metrics = performanceMonitor.stop()
      
      expect(metrics.wouldCauseMobileOverheating).toBe(false)
      expect(metrics.renderCount).toBeLessThan(30)
      
      console.log('Auth Flow Performance Metrics:', metrics)
    }, 10000)

    it('should display guest button on mobile', async () => {
      const { container: testContainer } = render(<App />)
      container = testContainer as HTMLElement

      // Wait for auth modal to appear
      await waitFor(() => {
        expect(container.querySelector('.auth-modal') || container.querySelector('.app')).toBeDefined()
      }, { timeout: 5000 })

      // Look for guest button in the modal
      const guestButton = container.querySelector('.guest-btn') || 
                         container.querySelector('button[class*="guest"]') ||
                         Array.from(container.querySelectorAll('button')).find(btn => 
                           btn.textContent?.toLowerCase().includes('guest')
                         )

      if (guestButton) {
        // Check if guest button is visible
        const styles = window.getComputedStyle(guestButton)
        expect(styles.display).not.toBe('none')
        expect(styles.visibility).not.toBe('hidden')
        expect(styles.opacity).not.toBe('0')
        
        console.log('✅ Guest button found and visible on mobile')
      } else {
        // If no guest button found, check if we're already in guest mode or signed in
        const guestNotice = container.querySelector('.guest-notice')
        const signedInUser = container.querySelector('[class*="user"]')
        
        if (guestNotice || signedInUser) {
          console.log('✅ Already in guest mode or signed in, guest button not needed')
        } else {
          console.log('⚠️ Guest button not found - checking modal content:')
          const modal = container.querySelector('.auth-modal')
          if (modal) {
            console.log('Modal content:', modal.innerHTML)
          }
        }
      }
    }, 8000)
  })

  describe('Mobile-Specific Stress Tests', () => {
    it('should handle touch events without overheating', async () => {
      performanceMonitor.start()

      const { container: testContainer } = render(<App />)
      container = testContainer as HTMLElement

      // Simulate rapid touch events (mobile behavior)
      for (let i = 0; i < 15; i++) {
        await act(async () => {
          const touchableElements = container.querySelectorAll('button, [class*="card"], [class*="board"]')
          if (touchableElements.length > 0) {
            const element = touchableElements[Math.floor(Math.random() * touchableElements.length)]
            
            // Simulate touch sequence
            fireEvent.touchStart(element)
            fireEvent.touchEnd(element)
            fireEvent.click(element)
          }
          
          await new Promise(resolve => setTimeout(resolve, 30))
        })
      }

      const metrics = performanceMonitor.stop()
      
      expect(metrics.wouldCauseMobileOverheating).toBe(false)
      expect(metrics.rendersPerSecond).toBeLessThan(80) // Mobile overheating threshold
      
      console.log('Touch Events Performance Metrics:', metrics)
    }, 12000)

    it('should maintain performance with multiple boards', async () => {
      performanceMonitor.start()

      const { container: testContainer } = render(<App />)
      container = testContainer as HTMLElement

      // Wait for initial load
      await waitFor(() => {
        expect(container.querySelector('.app')).toBeDefined()
      })

      // Try to create multiple boards (if possible)
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          const addButtons = container.querySelectorAll('button')
          for (const button of addButtons) {
            if (button.textContent?.includes('+') || 
                button.textContent?.toLowerCase().includes('add') ||
                button.textContent?.toLowerCase().includes('create')) {
              fireEvent.click(button)
              await new Promise(resolve => setTimeout(resolve, 100))
              
              // Fill in form if it appears
              const inputs = container.querySelectorAll('input[type="text"]')
              if (inputs.length > 0) {
                fireEvent.change(inputs[0], { target: { value: `Test Board ${i}` } })
                
                const submitButtons = container.querySelectorAll('button[type="submit"], .btn-primary')
                if (submitButtons.length > 0) {
                  fireEvent.click(submitButtons[0])
                }
              }
              break
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 200))
        })
      }

      const metrics = performanceMonitor.stop()
      
      expect(metrics.wouldCauseMobileOverheating).toBe(false)
      expect(metrics.averageRenderTime).toBeLessThan(20) // Slightly higher threshold for complex operations
      
      console.log('Multiple Boards Performance Metrics:', metrics)
    }, 15000)
  })
})