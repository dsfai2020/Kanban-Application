import { useState, useCallback, useRef, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Track last saved value to prevent unnecessary writes
  const lastSavedRef = useRef<string>('')
  
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue
      }
      
      const item = window.localStorage.getItem(key)
      if (item) {
        lastSavedRef.current = item
        return JSON.parse(item)
      }
      return initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Debounced save to prevent excessive writes
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state immediately
      setStoredValue(valueToStore)
      
      // Debounce localStorage writes
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        try {
          if (typeof window !== 'undefined') {
            const serialized = JSON.stringify(valueToStore)
            // Only save if the data has actually changed
            if (serialized !== lastSavedRef.current) {
              window.localStorage.setItem(key, serialized)
              lastSavedRef.current = serialized
              console.log(`Saved to localStorage: ${key}`) // Debug log
            }
          }
        } catch (error) {
          console.error(`Error saving to localStorage key "${key}":`, error)
        }
      }, 100) // 100ms debounce
      
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return [storedValue, setValue] as const
}
