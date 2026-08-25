import { api } from '../services/api'

/** Same demo IDs as storefront cart — not stored in MongoDB until published. */
export function isCatalogDemoProduct(productOrId) {
  const id = typeof productOrId === 'string' ? productOrId : productOrId?._id
  return !id || String(id).startsWith('demo-') || String(id).startsWith('local-')
}

/** Load every page from existing admin API (max 100 per request). */
export async function fetchAllAdminProducts() {
  const all = []
  let page = 1
  let total = Infinity

  while (all.length < total) {
    const payload = await api.adminProducts(`?limit=100&page=${page}`)
    const items = payload.items || []
    all.push(...items)
    total = payload.pagination?.total ?? items.length
    if (!items.length || items.length < 100) break
    page += 1
  }

  return all
}

/**
 * Database only. Hardcoded catalog entries were merged in here before, but they have
 * no MongoDB _id, so every delete/deactivate action had to refuse them.
 */
export function mergeAdminProductCatalog(apiItems = []) {
  return apiItems.map((product) => ({
    ...product,
    _catalogSource: isCatalogDemoProduct(product) ? 'demo' : 'database',
  }))
}

export async function loadAdminProductCatalog() {
  try {
    const apiItems = await fetchAllAdminProducts()
    return mergeAdminProductCatalog(apiItems)
  } catch {
    return mergeAdminProductCatalog([])
  }
}

export function findAdminProductById(id, catalog = null) {
  if (!id) return null
  return catalog?.find((item) => item._id === id) || null
}

export function countCatalogSources(products = []) {
  const demo = products.filter((p) => p._catalogSource === 'demo').length
  return { total: products.length, database: products.length - demo, demo }
}
