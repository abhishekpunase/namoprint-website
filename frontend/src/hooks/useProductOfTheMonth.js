import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function useProductOfTheMonth() {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api
      .productOfTheMonth()
      .then((payload) => {
        if (active) setItem(payload.item || null)
      })
      .catch(() => {
        if (active) setItem(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { item, loading }
}
