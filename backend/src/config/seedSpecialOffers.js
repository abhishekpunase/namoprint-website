import { SpecialOffersSettings } from '../models/SpecialOffersSettings.js';

export const DEFAULT_SPECIAL_OFFERS = {
  key: 'default',
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
};

export async function ensureSpecialOffers() {
  let doc = await SpecialOffersSettings.findOne({ key: 'default' });
  if (!doc) {
    doc = await SpecialOffersSettings.create(DEFAULT_SPECIAL_OFFERS);
  }
  return doc;
}
