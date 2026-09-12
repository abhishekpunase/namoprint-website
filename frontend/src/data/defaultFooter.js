export const DEFAULT_FOOTER = {
  aboutText:
    "India's trusted online printing partner for T-Shirts, Photo Frames, Mugs, Stickers, Corporate Gifts, Packaging Boxes and Custom Printing Solutions.",
  copyright: '© 2026 Namo Print. All Rights Reserved.',
  headings: {
    categories: 'Categories',
    quick: 'Quick Links',
    policies: 'Policies',
  },
  socials: {
    facebook: 'https://www.facebook.com/share/19Acuco8uY/',
    instagram: 'https://www.instagram.com/namoprint_official?igsh=MTNnOWxtOWljbzBnYw==',
    youtube: 'https://youtube.com/@namoprints-j1l?si=xKzKzvh7uMov4trE',
  },
  links: [
    { label: 'Acrylic Products', path: '/products?type=acrylic-wall-photo', group: 'categories', sortOrder: 0 },
    { label: 'God Photo Frames', path: '/god-photo-frames', group: 'categories', sortOrder: 1 },
    { label: 'Name Plates', path: '/name-plates', group: 'categories', sortOrder: 2 },
    { label: 'Pen Print', path: '/pen-print', group: 'categories', sortOrder: 3 },
    { label: 'QR Standees', path: '/products?type=logo-stickers', group: 'categories', sortOrder: 4 },
    { label: 'UV DTF Stickers', path: '/uv-dtf-stickers', group: 'categories', sortOrder: 5 },
    { label: 'Product Labels', path: '/product-label-stickers', group: 'categories', sortOrder: 6 },
    { label: 'Trophies & Mementos', path: '/trophies', group: 'categories', sortOrder: 7 },
    { label: 'Baby Birth Frames', path: '/baby-birth-frames', group: 'categories', sortOrder: 8 },
    { label: 'Corporate Gifts', path: '/corporate-gifts', group: 'categories', sortOrder: 9 },
    { label: 'T-Shirts', path: '/t-shirt-printing', group: 'categories', sortOrder: 10 },
    { label: 'Wall Watches', path: '/custom-wall-watches', group: 'categories', sortOrder: 11 },
    { label: 'About Us', path: '/about', group: 'quick', sortOrder: 0 },
    { label: 'Contact Us', path: '/contact', group: 'quick', sortOrder: 1 },
    { label: 'Support Center', path: '/support', group: 'quick', sortOrder: 2 },
    { label: 'Track Ticket', path: '/support/track', group: 'quick', sortOrder: 3 },
    { label: 'Bulk Orders', path: '/bulk-orders', group: 'quick', sortOrder: 4 },
    { label: 'Privacy Policy', path: '/privacy-policy', group: 'policies', sortOrder: 0 },
    { label: 'Terms & Conditions', path: '/terms-and-conditions', group: 'policies', sortOrder: 1 },
    { label: 'Refund Policy', path: '/refund-policy', group: 'policies', sortOrder: 2 },
    { label: 'Shipping Policy', path: '/shipping-policy', group: 'policies', sortOrder: 3 },
    { label: 'FAQs', path: '/faq', group: 'bottom', sortOrder: 0 },
    { label: 'Terms', path: '/terms-and-conditions', group: 'bottom', sortOrder: 1 },
    { label: 'Privacy', path: '/privacy-policy', group: 'bottom', sortOrder: 2 },
    { label: 'Contact', path: '/contact', group: 'bottom', sortOrder: 3 },
  ],
}

export function mapApiFooter(item) {
  if (!item) return { ...DEFAULT_FOOTER, links: DEFAULT_FOOTER.links.map((link) => ({ ...link })) }
  return {
    aboutText: item.aboutText || DEFAULT_FOOTER.aboutText,
    copyright: item.copyright || DEFAULT_FOOTER.copyright,
    headings: {
      categories: item.headings?.categories || DEFAULT_FOOTER.headings.categories,
      quick: item.headings?.quick || DEFAULT_FOOTER.headings.quick,
      policies: item.headings?.policies || DEFAULT_FOOTER.headings.policies,
    },
    socials: {
      facebook: item.socials?.facebook || '',
      instagram: item.socials?.instagram || '',
      youtube: item.socials?.youtube || '',
    },
    links: (item.links || []).map((link, index) => ({
      _id: link._id,
      label: link.label || '',
      path: link.path || '/',
      group: link.group || 'categories',
      sortOrder: link.sortOrder ?? index,
      isActive: link.isActive !== false,
    })),
  }
}
