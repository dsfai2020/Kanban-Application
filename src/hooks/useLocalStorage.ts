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
      
      // Check if localStorage is available and working
      try {
        const testKey = '__localStorage_test__'
        window.localStorage.setItem(testKey, 'test')
        window.localStorage.removeItem(testKey)
      } catch (storageError) {
        console.error(`❌ localStorage not available or disabled for key "${key}":`, storageError)
        console.error('This might be due to:')
        console.error('- Private browsing mode')
        console.error('- localStorage disabled in browser settings')
        console.error('- Storage quota exceeded')
        console.error('- Firefox security settings')
        return initialValue
      }
      
      const item = window.localStorage.getItem(key)
      if (item) {
        lastSavedRef.current = item
        console.log(`📖 Loaded from localStorage: ${key} (${item.length} chars)`)
        return JSON.parse(item)
      }
      console.log(`🆕 No existing localStorage data for key: ${key}`)
      return initialValue
    } catch (error) {
      console.warn(`⚠️ Error reading localStorage key "${key}":`, error)
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
              console.log(`✅ Saved to localStorage: ${key} (${serialized.length} chars)`) // Debug log
              
              // Verify the save worked
              const verification = window.localStorage.getItem(key)
              if (verification !== serialized) {
                console.error(`❌ localStorage save verification failed for key "${key}"`)
                console.error('Expected:', serialized.substring(0, 100) + '...')
                console.error('Got:', verification?.substring(0, 100) + '...')
              } else {
                console.log(`✅ localStorage save verified for key "${key}"`)
              }
            } else {
              console.log(`⏭️ Skipped localStorage save for "${key}" (no changes)`)
            }
          } else {
            console.warn(`⚠️ Window not available for localStorage save: ${key}`)
          }
        } catch (error) {
          console.error(`❌ Error saving to localStorage key "${key}":`, error)
          console.error('Error details:', {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : String(error),
            dataSize: JSON.stringify(valueToStore).length,
            userAgent: navigator.userAgent,
            isFirefox: navigator.userAgent.toLowerCase().includes('firefox')
          })
        }
      }, 100) // 100ms debounce
      
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Force immediate save function
  const forceImmediateSave = useCallback((value: T) => {
    try {
      if (typeof window !== 'undefined') {
        const serialized = JSON.stringify(value)
        window.localStorage.setItem(key, serialized)
        lastSavedRef.current = serialized
        console.log(`🚨 Force saved to localStorage: ${key} (${serialized.length} chars)`)
      }
    } catch (error) {
      console.error(`❌ Force save failed for key "${key}":`, error)
    }
  }, [key])

  // Cleanup timeout on unmount and setup beforeunload handler
  useEffect(() => {
    // Force save on page unload (critical for desktop browsers)
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        forceImmediateSave(storedValue)
      }
    }

    // Force save on visibility change (tab switching, mobile background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        forceImmediateSave(storedValue)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        forceImmediateSave(storedValue)
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [forceImmediateSave, storedValue])

  return [storedValue, setValue] as const
}
