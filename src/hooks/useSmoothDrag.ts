import { useCallback, useRef } from 'react'

export function useSmoothDrag() {
  const frameRef = useRef<number | null>(null)

  const requestSmoothUpdate = useCallback((callback: () => void) => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    
    frameRef.current = requestAnimationFrame(() => {
      callback()
    })
  }, [])

  const cancelSmoothUpdate = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  return { requestSmoothUpdate, cancelSmoothUpdate }
}