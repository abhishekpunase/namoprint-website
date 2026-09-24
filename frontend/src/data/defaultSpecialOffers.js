export const SPECIAL_OFFER_GRADIENTS = [
  { value: 'from-orange-500 via-orange-400 to-yellow-400', label: 'Orange / Yellow' },
  { value: 'from-slate-900 via-slate-800 to-gray-700', label: 'Dark Navy' },
  { value: 'from-orange-400 via-red-400 to-orange-600', label: 'Pink / Orange' },
  { value: 'from-emerald-500 via-teal-500 to-cyan-500', label: 'Teal' },
  { value: 'from-indigo-600 via-violet-600 to-purple-500', label: 'Indigo' },
  { value: 'from-rose-500 via-pink-500 to-orange-400', label: 'Rose' },
]

export const SPECIAL_OFFER_ICONS = [
  { value: 'percent', label: 'Percent' },
  { value: 'gift', label: 'Gift' },
  { value: 'truck', label: 'Truck' },
  { value: 'sparkles', label: 'Sparkles' },
]

export const DEFAULT_SPECIAL_OFFERS = {
  eyebrow: 'Limited Time Exclusive Deals',
  title: 'Unlock Premium',
  titleAccent: 'Furniture Savings',
  subtitle:
    'Transform your space with handcrafted furniture and enjoy exclusive offers designed especially for you.',
  isActive: true,
  cards: [
    {
      title: '10% OFF',
      subtitle: 'Welcome Offer',
      description: 'Create your first order today and enjoy an instant discount on premium furniture.',
      code: 'WELCOME10',
      icon: 'percent',
      gradient: 'from-orange-500 via-orange-400 to-yellow-400',
      action: 'claim',
      cta: 'Claim Offer',
      href: '',
      sortOrder: 0,
      isActive: true,
    },
    {
      title: 'Bulk Orders',
      subtitle: 'Custom Pricing',
      description: 'Planning a hotel, office or cafe setup? Get exclusive pricing on bulk orders.',
      code: '',
      icon: 'gift',
      gradient: 'from-slate-900 via-slate-800 to-gray-700',
      action: 'bulk',
      cta: 'Bulk Order',
      href: '/bulk-orders',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Free Delivery',
      subtitle: 'Above ₹999',
      description: 'Shop more and save more with complimentary doorstep delivery across India.',
      code: 'FREESHIP',
      icon: 'truck',
      gradient: 'from-orange-400 via-red-400 to-orange-600',
      action: 'claim',
      cta: 'Claim Offer',
      href: '',
      sortOrder: 2,
      isActive: true,
    },
  ],
}

export function mapApiSpecialOffers(item) {
  const source = item || {}
  return {
    eyebrow: source.eyebrow || DEFAULT_SPECIAL_OFFERS.eyebrow,
    title: source.title || DEFAULT_SPECIAL_OFFERS.title,
    titleAccent: source.titleAccent || DEFAULT_SPECIAL_OFFERS.titleAccent,
    subtitle: source.subtitle || DEFAULT_SPECIAL_OFFERS.subtitle,
    isActive: source.isActive !== false,
    cards: Array.isArray(source.cards)
      ? source.cards.map((card, index) => ({
          _id: card._id,
          title: card.title || '',
          subtitle: card.subtitle || '',
          description: card.description || '',
          code: card.code || '',
          icon: card.icon || 'gift',
          gradient: card.gradient || SPECIAL_OFFER_GRADIENTS[0].value,
          action: card.action || 'claim',
          cta: card.cta || 'Claim Offer',
          href: card.href || '',
          sortOrder: card.sortOrder ?? index,
          isActive: card.isActive !== false,
        }))
      : DEFAULT_SPECIAL_OFFERS.cards.map((card) => ({ ...card })),
  }
}
