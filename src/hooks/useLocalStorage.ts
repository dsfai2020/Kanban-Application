import { useState, useCallback, useRef } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Use ref to track if we're in the middle of an update to prevent loops
  const isUpdatingRef = useRef(false)
  
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue
      }
      
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    // Prevent infinite loops during updates
    if (isUpdatingRef.current) {
      return
    }
    
    try {
      isUpdatingRef.current = true
      
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    } finally {
      isUpdatingRef.current = false
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}
