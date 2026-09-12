import { useRef, useState } from 'react'
import { Film, ImagePlus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { resolveMediaUrl } from '../../../../utils/mediaUrl'

export function DescriptionMediaSection({
  items = [],
  onChange,
  onUpload,
  uploading = false,
}) {
  const imageInputRef = useRef(null)
  const reelInputRef = useRef(null)
  const [busyType, setBusyType] = useState('')

  const updateItem = (index, patch) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const moveItem = (index, direction) => {
    const next = [...items]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const handleUpload = async (files, type) => {
    if (!files?.length) return
    setBusyType(type)
    try {
      await onUpload(files, type)
    } finally {
      setBusyType('')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="peditor-hint">
        These images and reels appear in the product description on the storefront. Upload what you want customers to see.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="prod-btn prod-btn--ghost"
          disabled={uploading}
          onClick={() => imageInputRef.current?.click()}
        >
          <ImagePlus size={14} /> {busyType === 'image' ? 'Uploading…' : 'Add description image'}
        </button>
        <button
          type="button"
          className="prod-btn prod-btn--ghost"
          disabled={uploading}
          onClick={() => reelInputRef.current?.click()}
        >
          <Film size={14} /> {busyType === 'reel' ? 'Uploading…' : 'Add description reel'}
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            handleUpload(e.target.files, 'image')
            e.target.value = ''
          }}
        />
        <input
          ref={reelInputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            handleUpload(e.target.files, 'reel')
            e.target.value = ''
          }}
        />
      </div>

      {!items.length ? (
        <p className="peditor-empty">No description media yet. Add images or reels for the product details section.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item, index) => {
            const src = resolveMediaUrl(item.url)
            const isReel = item.type === 'reel' || item.type === 'video'
            return (
              <li key={`${item.url}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="aspect-[16/10] bg-slate-100">
                  {isReel ? (
                    <video src={src} poster={resolveMediaUrl(item.posterUrl) || undefined} controls playsInline className="h-full w-full object-cover" />
                  ) : (
                    <img src={src} alt={item.caption || 'Description media'} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex flex-col gap-2 p-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {isReel ? 'Reel' : 'Image'}
                  </span>
                  <input
                    type="text"
                    value={item.caption || ''}
                    onChange={(e) => updateItem(index, { caption: e.target.value })}
                    placeholder="Caption (optional)"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <button type="button" className="prod-btn prod-btn--ghost" onClick={() => moveItem(index, -1)} disabled={index === 0} title="Move up">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" className="prod-btn prod-btn--ghost" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} title="Move down">
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      className="prod-btn prod-btn--ghost ml-auto text-rose-600"
                      onClick={() => onChange(items.filter((_, i) => i !== index))}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
