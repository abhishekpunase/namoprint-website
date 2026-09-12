function hashString(value = '') {
  let hash = 2166136261
  const text = String(value)
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const REVIEWERS = [
  'Riya Sharma',
  'Aarav Mehta',
  'Neha Patel',
  'Kabir Singh',
  'Ananya Gupta',
  'Rohan Joshi',
  'Priya Nair',
  'Vikram Rao',
  'Sneha Iyer',
  'Aditya Verma',
  'Meera Kapoor',
  'Karan Malhotra',
]

const TITLES = [
  'Looks exactly like the preview',
  'Perfect gift',
  'Great print quality',
  'Worth every rupee',
  'Fast delivery',
  'Highly recommended',
]

const COMMENTS = [
  (name) => `Ordered the ${name} last week and it looks premium in person. Colours matched the preview perfectly.`,
  (name) => `Gifted this ${name} and everyone asked where we got it from. Print is sharp and packing was safe.`,
  (name) => `Very happy with the ${name}. Finish feels clean and it sits well on the wall.`,
  (name) => `The ${name} quality is better than expected for the price. Will order again for another room.`,
  (name) => `Received the ${name} in a few days. Looks classy and the photo came out crystal clear.`,
  (name) => `Parents loved the ${name}. Easy to customise and the final product looks expensive.`,
]

function pick(list, seed, offset = 0) {
  return list[(seed + offset) % list.length]
}

function makeDate(seed, index) {
  const day = 2 + ((seed + index * 7) % 26)
  const monthIndex = (seed + index) % 6
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  return `${day} ${months[monthIndex]} 2026`
}

/** Stable fake reviews generated from the product name — updates automatically for new products. */
export function generateProductReviews(product) {
  const title = String(product?.title || 'this product').trim() || 'this product'
  const seed = hashString(product?._id || product?.slug || title)
  const count = 4 + (seed % 3)

  return Array.from({ length: count }, (_, index) => {
    const rating = index === 2 && seed % 4 === 0 ? 4 : 5
    return {
      id: `auto-${seed}-${index}`,
      name: pick(REVIEWERS, seed, index * 3),
      rating,
      date: makeDate(seed, index),
      title: pick(TITLES, seed, index * 2),
      comment: pick(COMMENTS, seed, index)(title),
      verified: index !== count - 1,
      helpful: 4 + ((seed + index * 5) % 28),
    }
  })
}

export function resolveProductReviews(product, reviews = []) {
  if (Array.isArray(reviews) && reviews.length) return reviews
  return generateProductReviews(product)
}
