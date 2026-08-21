import { useEffect, useState } from 'react'
import { checkApiHealth } from '../services/api'

/** Polls `{API}/health` (e.g. http://host/api/health) — true when API + DB are ready. */
export function useApiHealth() {
  const [apiOnline, setApiOnline] = useState(null)

  useEffect(() => {
    let cancelled = false
    let timer

    const verify = async () => {
      const ok = await checkApiHealth()
      if (cancelled) return
      setApiOnline(ok)
      clearInterval(timer)
      timer = setInterval(verify, ok ? 60000 : 8000)
    }

    verify()

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return apiOnline
}
