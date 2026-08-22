const fs = require('fs')
const f = 'frontend/src/data/defaultCategoryCarousel.js'
let s = fs.readFileSync(f, 'utf8')
if (!s.includes("from '../utils/mediaUrl'")) {
  s = s.replace(
    /import \{[^}]+\} from '\.\.\/config\/categoryRoutes'\r?\n/,
    (m) => `${m}import { sanitizeCarouselVideoUrl } from '../utils/mediaUrl'\n`,
  )
  fs.writeFileSync(f, s)
  console.log('import added')
} else {
  console.log('import already present')
}
console.log(s.slice(0, 250))
console.log('---')
console.log('uses sanitize in map', s.includes('sanitizeCarouselVideoUrl(rawVideo'))
