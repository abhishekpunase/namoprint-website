const fs = require('fs')
const path = require('path')

const RELIABLE = [
  'https://rqnknqgpqttjqqhaejmt.supabase.co/storage/v1/object/public/reel-videos/videos/1766941654703-romtz.mp4',
  'https://rqnknqgpqttjqqhaejmt.supabase.co/storage/v1/object/public/reel-videos/videos/1766938943981-d5vchq.mp4',
  'https://rqnknqgpqttjqqhaejmt.supabase.co/storage/v1/object/public/reel-videos/videos/1766942064646-wtya9i.mp4',
]

const FLAKY =
  /https:\/\/(?:test-videos\.co\.uk|filesamples\.com|www\.learningcontainer\.com|samplelib\.com)[^"'\s]+/g

const files = [
  'frontend/src/data/defaultCategoryCarousel.js',
  'frontend/src/data/fallbackCatalog.js',
  'frontend/src/data/defaultProductReels.js',
  'backend/src/config/seedCategoryCarousel.js',
  'backend/src/config/seedProductReels.js',
]

let n = 0
for (const rel of files) {
  const file = path.join(process.cwd(), rel)
  if (!fs.existsSync(file)) {
    console.log('skip missing', rel)
    continue
  }
  let i = 0
  let src = fs.readFileSync(file, 'utf8')
  const next = src.replace(FLAKY, () => {
    const url = RELIABLE[i % RELIABLE.length]
    i += 1
    n += 1
    return url
  })
  if (next !== src) {
    fs.writeFileSync(file, next)
    console.log('OK', rel, 'replacements', i)
  } else {
    console.log('no flaky urls', rel)
  }
}
console.log('total', n)
