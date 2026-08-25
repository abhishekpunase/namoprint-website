import { useEffect, useState } from 'react'
import { api } from '../services/api'
import {
  DEFAULT_HOME_OFFER_MARQUEE,
  mapApiHomeOfferMarqueeItem,
} from '../data/defaultHomeOfferMarquee'

const defaultLines = DEFAULT_HOME_OFFER_MARQUEE.map((item) => item.text)

// The header bar and the homepage section both show these lines, so share one
// in-flight request instead of hitting the API twice on every page load.
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
        return []
      })
  }
  return pending
}

/** Admin-managed offer lines, with the built-in defaults as a fallback. */
export function useHomeOfferMarquee() {
  const [lines, setLines] = useState(defaultLines)

  useEffect(() => {
    let active = true
    loadLines().then((result) => {
      if (active && result.length > 0) setLines(result)
    })
    return () => {
      active = false
    }
  }, [])

  return lines
}
