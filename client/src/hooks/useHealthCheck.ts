import { useState, useEffect, useCallback } from 'react'
import { healthService } from '@/services/healthService'

export type HealthStatus = 'checking' | 'online' | 'offline'

export function useHealthCheck() {
  const [status, setStatus] = useState<HealthStatus>('checking')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const check = useCallback(async () => {
    try {
      await healthService.checkHealth()
      setStatus('online')
      setLastChecked(new Date())
    } catch {
      setStatus('offline')
      setLastChecked(new Date())
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    healthService
      .checkHealth()
      .then(() => {
        if (isMounted) {
          setStatus('online')
          setLastChecked(new Date())
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus('offline')
          setLastChecked(new Date())
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return { status, lastChecked, recheck: check }
}
