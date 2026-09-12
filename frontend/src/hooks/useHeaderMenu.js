import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { DEFAULT_HEADER_MENU, mapApiHeaderMenuItem } from '../data/defaultHeaderMenu'

export const HEADER_MENU_CHANGED = 'namo:header-menu-changed'

const defaultItems = DEFAULT_HEADER_MENU.map(mapApiHeaderMenuItem)
let pending = null

function loadMenu() {
  if (!pending) {
    pending = api
      .headerMenu()
      .then((payload) =>
        (payload.items || [])
          .map(mapApiHeaderMenuItem)
          .filter((item) => item.label && item.path),
      )
      .catch(() => {
        pending = null
        return null
      })
  }
  return pending
}

export function notifyHeaderMenuChanged() {
  pending = null
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(HEADER_MENU_CHANGED))
  }
}

export function useHeaderMenu() {
  const [items, setItems] = useState(defaultItems)

  useEffect(() => {
    let active = true

    const refresh = (force = false) => {
      if (force) pending = null
      loadMenu().then((result) => {
        if (!active || result == null) return
        if (result.length > 0) setItems(result)
      })
    }

    const onChanged = () => refresh(true)

    refresh()
    window.addEventListener(HEADER_MENU_CHANGED, onChanged)
    window.addEventListener('focus', onChanged)

    return () => {
      active = false
      window.removeEventListener(HEADER_MENU_CHANGED, onChanged)
      window.removeEventListener('focus', onChanged)
    }
  }, [])

  return useMemo(() => {
    const primary = items.filter((item) => item.group !== 'more')
    const more = items.filter((item) => item.group === 'more')
    return { primary, more, all: items }
  }, [items])
}
