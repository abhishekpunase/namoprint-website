import { useEffect, useState } from 'react'
import { api } from '../services/api'
import {
  DEFAULT_HOME_OFFER_MARQUEE,
  mapApiHomeOfferMarqueeItem,
} from '../data/defaultHomeOfferMarquee'

const defaultLines = DEFAULT_HOME_OFFER_MARQUEE.map((item) => item.text)
export const OFFER_MARQUEE_CHANGED = 'namo:offer-marquee-changed'

let pending = null

function loadLines() {
  if (!pending) {
    pending = api
      .homeOfferMarquee()
      .then((payload) =>
        (payload.items || []).map((item) => mapApiHomeOfferMarqueeItem(item).text).filter(Boolean),
      )
      .catch(() => {
        pending = null
        return null
      })
  }
  return pending
}

export function notifyOfferMarqueeChanged() {
  pending = null
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OFFER_MARQUEE_CHANGED))
  }
}

/** Admin-managed offer lines shared by header, homepage, and footer. */
export function useHomeOfferMarquee() {
  const [lines, setLines] = useState(defaultLines)

  useEffect(() => {
    let active = true

    const refresh = (force = false) => {
      if (force) pending = null
      loadLines().then((result) => {
        if (!active || result == null) return
        setLines(result)
      })
    }

    const onChanged = () => refresh(true)

    refresh()
    window.addEventListener(OFFER_MARQUEE_CHANGED, onChanged)

    return () => {
      active = false
      window.removeEventListener(OFFER_MARQUEE_CHANGED, onChanged)
    }
  }, [])

  return lines
}
