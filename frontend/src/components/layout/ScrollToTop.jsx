import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Storefront SPA keeps the previous scroll position on route change, so opening a
 * product from the bottom of a list shows the footer first. Jump to the header.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ''))
      const target = id ? document.getElementById(id) : null
      if (target) {
        target.scrollIntoView()
        return undefined
      }
    }

    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    return undefined
  }, [pathname, hash])

  return null
}
