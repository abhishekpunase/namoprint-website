import { STOREFRONT_PAGE_SIZE } from '../config/storefront';

const MAX_PAGES = 50;

/** Fetch every active product across paginated list endpoints. */
export async function fetchAllPaginated(requestPage, query = '') {
  const raw = query.startsWith('?') ? query.slice(1) : query;
  const base = new URLSearchParams(raw);
  base.set('limit', String(STOREFRONT_PAGE_SIZE));

  let page = 1;
  let allItems = [];
  let total = Infinity;
  let lastPayload = null;
  const seenFirstIds = new Set();
  const pageLimit = Number(base.get('limit')) || STOREFRONT_PAGE_SIZE;

  while (page <= MAX_PAGES && allItems.length < total) {
    base.set('page', String(page));
    const qs = `?${base.toString()}`;
    const payload = await requestPage(qs);
    lastPayload = payload;
    const items = payload?.items || [];
    const firstId = items[0]?._id || items[0]?.id || items[0]?.slug;
    if (firstId && seenFirstIds.has(firstId)) break;
    if (firstId) seenFirstIds.add(firstId);
    total = Number(payload?.pagination?.total);
    if (!Number.isFinite(total) || total < 0) total = allItems.length + items.length;
    allItems = allItems.concat(items);
    if (!items.length || allItems.length >= total || items.length < pageLimit) break;
    page += 1;
  }

  return {
    ...(lastPayload || { success: true }),
    items: allItems,
    pagination: { page: 1, limit: allItems.length, total: allItems.length },
  };
}

export function createStorefrontList(apiRequest, endpoint) {
  return (query = '') =>
    fetchAllPaginated((q) => apiRequest(`${endpoint}${q}`), query);
}
