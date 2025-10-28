import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Column as ColumnType, Card as CardType } from '../types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Replace the global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Data Persistence Fix - useLocalStorage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce localStorage writes to prevent data loss', () => {
    const testKey = 'test-counter'
    const initialValue = 0
    
    localStorageMock.getItem.mockReturnValue('0')
    
    const { result } = renderHook(() => useLocalStorage(testKey, initialValue))
    
    // Rapid updates (simulating drag operations)
    act(() => {
      result.current[1](1)
      result.current[1](2)
      result.current[1](3)
    })
    
    // Should not have saved yet (debounced)
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
    
    // Fast-forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(150)
    })
    
    // Should have saved only once with the final value
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(testKey, JSON.stringify(3))
  })

  it('should not save unchanged data', () => {
    const testKey = 'test-string'
    const initialValue = 'unchanged'
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(initialValue))
    
    const { result } = renderHook(() => useLocalStorage(testKey, initialValue))
    
    // Set the same value multiple times
    act(() => {
      result.current[1]('unchanged')
      result.current[1]('unchanged')
      result.current[1]('unchanged')
    })
    
    // Fast-forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(150)
    })
    
    // Should not have saved since data didn't change
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
  })

  it('should handle rapid successive updates without data loss', () => {
    const testKey = 'test-array'
    const initialValue: string[] = []
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(initialValue))
    
    const { result } = renderHook(() => useLocalStorage(testKey, initialValue))
    
    // Simulate rapid updates
    const updates = [
      ['A'],
      ['A', 'B'],
      ['B', 'A'],
      ['B', 'A', 'C'],
    ]
    
    // Apply updates rapidly
    act(() => {
      updates.forEach(update => {
        result.current[1](update)
      })
    })
    
    // Verify state is updated immediately
    expect(result.current[0]).toEqual(updates[updates.length - 1])
    
    // Fast-forward past debounce
    act(() => {
      vi.advanceTimersByTime(150)
    })
    
    // Should save the final state
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      testKey,
      JSON.stringify(updates[updates.length - 1])
    )
  })

  it('should cleanup timeouts on unmount', () => {
    const testKey = 'test-cleanup'
    const initialValue = 'initial'
    
    const { result, unmount } = renderHook(() => useLocalStorage(testKey, initialValue))
    
    // Make an update
    act(() => {
      result.current[1]('updated')
    })
    
    // Unmount before debounce completes
    unmount()
    
    // Fast-forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(150)
    })
    
    // Should not have saved since component was unmounted
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
  })
})