import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { DEFAULT_FOOTER, mapApiFooter } from '../data/defaultFooter'

export const FOOTER_CHANGED = 'namo:footer-changed'

let pending = null

function loadFooter() {
  if (!pending) {
    pending = api
      .footer()
      .then((payload) => mapApiFooter(payload.item))
      .catch(() => {
        pending = null
        return null
      })
  }
  return pending
}

export function notifyFooterChanged() {
  pending = null
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(FOOTER_CHANGED))
  }
}

export function useFooter() {
  const [footer, setFooter] = useState(() => mapApiFooter(DEFAULT_FOOTER))

  useEffect(() => {
    let active = true

    const refresh = (force = false) => {
      if (force) pending = null
      loadFooter().then((result) => {
        if (!active || result == null) return
        setFooter(result)
      })
    }

    const onChanged = () => refresh(true)

    refresh()
    window.addEventListener(FOOTER_CHANGED, onChanged)
    window.addEventListener('focus', onChanged)

    return () => {
      active = false
      window.removeEventListener(FOOTER_CHANGED, onChanged)
      window.removeEventListener('focus', onChanged)
    }
  }, [])

  return footer
}
