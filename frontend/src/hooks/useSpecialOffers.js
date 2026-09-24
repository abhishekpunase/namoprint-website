import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { DEFAULT_SPECIAL_OFFERS, mapApiSpecialOffers } from '../data/defaultSpecialOffers'

export const SPECIAL_OFFERS_CHANGED = 'namo:special-offers-changed'

let pending = null

function loadSpecialOffers() {
  if (!pending) {
    pending = api
      .specialOffers()
      .then((payload) => mapApiSpecialOffers(payload.item))
      .catch(() => {
        pending = null
        return null
      })
  }
  return pending
}

export function notifySpecialOffersChanged() {
  pending = null
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SPECIAL_OFFERS_CHANGED))
  }
}

export function useSpecialOffers() {
  const [offers, setOffers] = useState(() => mapApiSpecialOffers(DEFAULT_SPECIAL_OFFERS))

  useEffect(() => {
    let active = true

    const refresh = (force = false) => {
      if (force) pending = null
      loadSpecialOffers().then((result) => {
        if (!active || result == null) return
        setOffers(result)
      })
    }

    const onChanged = () => refresh(true)

    refresh()
    window.addEventListener(SPECIAL_OFFERS_CHANGED, onChanged)

    return () => {
      active = false
      window.removeEventListener(SPECIAL_OFFERS_CHANGED, onChanged)
    }
  }, [])

  return offers
}
