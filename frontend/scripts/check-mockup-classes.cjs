const fs = require('fs')
const css = fs.readFileSync('frontend/src/index.css', 'utf8')
const jsx = fs.readFileSync('frontend/src/components/admin/MockupEditor.jsx', 'utf8')
const classes = [...jsx.matchAll(/className="([^"]+)"/g)]
  .flatMap((m) => m[1].split(/\s+/))
  .filter((c) => c.startsWith('admin-mockup'))
;[...new Set(classes)].forEach((c) => {
  console.log(css.includes('.' + c) ? 'OK' : 'MISS', c)
})
const i = css.indexOf('.admin-mockup-resize-handle')
console.log('---')
console.log(css.slice(i, i + 500))
