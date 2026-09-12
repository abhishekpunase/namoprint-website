import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { DEFAULT_HEADER_MENU, mapApiHeaderMenuItem } from '../data/defaultHeaderMenu'

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
        return []
      })
  }
  return pending
}

export function useHeaderMenu() {
  const [items, setItems] = useState(() => DEFAULT_HEADER_MENU.map(mapApiHeaderMenuItem))

  useEffect(() => {
    let active = true
    loadMenu().then((result) => {
      if (active && result.length > 0) setItems(result)
    })
    return () => {
      active = false
    }
  }, [])

  return useMemo(() => {
    const primary = items.filter((item) => item.group !== 'more')
    const more = items.filter((item) => item.group === 'more')
    return { primary, more, all: items }
  }, [items])
}
