export const DEFAULT_HEADER_MENU = [
  { label: 'Home', path: '/', group: 'primary', sortOrder: 0 },
  { label: 'Shop', path: '/products', group: 'primary', sortOrder: 1 },
  { label: 'Canvas Frame', path: '/god-photo-frames', group: 'primary', sortOrder: 2 },
  { label: 'Name Plate', path: '/name-plates', group: 'primary', sortOrder: 3 },
  { label: 'Baby Frames', path: '/baby-birth-frames', group: 'primary', sortOrder: 4 },
  { label: 'T-Shirt Print', path: '/t-shirt-printing', group: 'primary', sortOrder: 5 },
  { label: 'Wall Watches', path: '/custom-wall-watches', group: 'primary', sortOrder: 6 },
  { label: 'Pen Print', path: '/pen-print', group: 'more', sortOrder: 7 },
  { label: 'UV DTF Stickers', path: '/uv-dtf-stickers', group: 'more', sortOrder: 8 },
  { label: 'Product Labels', path: '/product-label-stickers', group: 'more', sortOrder: 9 },
  { label: 'Corporate Gifts', path: '/corporate-gifts', group: 'more', sortOrder: 10 },
  { label: 'Trophies', path: '/trophies', group: 'more', sortOrder: 11 },
]

export const HEADER_MENU_PATH_PRESETS = [
  { label: 'Home', path: '/' },
  { label: 'Shop / All products', path: '/products' },
  { label: 'Canvas Frame', path: '/god-photo-frames' },
  { label: 'Name Plates', path: '/name-plates' },
  { label: 'Baby Birth Frames', path: '/baby-birth-frames' },
  { label: 'T-Shirt Printing', path: '/t-shirt-printing' },
  { label: 'Wall Watches', path: '/custom-wall-watches' },
  { label: 'Pen Print', path: '/pen-print' },
  { label: 'UV DTF Stickers', path: '/uv-dtf-stickers' },
  { label: 'Product Labels', path: '/product-label-stickers' },
  { label: 'Corporate Gifts', path: '/corporate-gifts' },
  { label: 'Trophies', path: '/trophies' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Bulk Orders', path: '/bulk-orders' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Support Center', path: '/support' },
  { label: 'Raise a Ticket', path: '/support/new' },
  { label: 'Track Ticket', path: '/support/track' },
]

function displayHeaderLabel(label, path) {
  if (String(path || '').startsWith('/god-photo-frames')) return 'Canvas Frame'
  return String(label || '').trim()
}

export function mapApiHeaderMenuItem(item) {
  const path = String(item.path || item.to || '').trim()
  return {
    id: item._id || item.id,
    label: displayHeaderLabel(item.label, path),
    path,
    to: path,
    group: item.group === 'more' ? 'more' : 'primary',
    sortOrder: item.sortOrder ?? 0,
    isActive: item.isActive !== false,
  }
}
