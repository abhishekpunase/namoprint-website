import { useEffect, useState } from 'react'
import { LegalPageView } from '../components/LegalPageView'
import { api } from '../services/api'

export function useLegalPage(slug) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api
      .legalPage(slug)
      .then((payload) => {
        if (!cancelled) setPage(payload.item || null)
      })
      .catch((err) => {
        if (!cancelled) {
          setPage(null)
          setError(err.message || 'Failed to load page')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  return { page, loading, error }
}

export function LegalPageBySlug({ slug }) {
  const { page, loading, error } = useLegalPage(slug)
  return <LegalPageView page={page} loading={loading} error={error} />
}
