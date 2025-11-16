import { useRef, useCallback, useEffect } from 'react'

/**
 * Returns a throttled version of the callback that only executes once per wait period
 * @param callback Function to throttle
 * @param wait Milliseconds to wait between executions
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  wait: number
): T {
  const lastRan = useRef(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRan = now - lastRan.current

      if (timeSinceLastRan >= wait) {
        callback(...args)
        lastRan.current = now
      } else {
        // Clear any pending timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Schedule execution for the remaining time
        timeoutRef.current = setTimeout(() => {
          callback(...args)
          lastRan.current = Date.now()
        }, wait - timeSinceLastRan)
      }
    }) as T,
    [callback, wait]
  )
}
