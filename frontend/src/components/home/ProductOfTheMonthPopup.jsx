import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useProductOfTheMonth } from '../../hooks/useProductOfTheMonth'
import { getProductDetailPath } from '../../config/categoryRoutes'
import { formatCurrency, getCompareAtPrice, getProductPrice } from '../../utils/format'
import { resolveMediaUrl } from '../../utils/mediaUrl'

function popupImage(product) {
  return resolveMediaUrl(
    product?.thumbnail || product?.images?.[0] || product?.mockup?.baseImageUrl || product?.mockup?.frameImage || '',
  )
}

export function ProductOfTheMonthPopup() {
  const { item, loading } = useProductOfTheMonth()
  const [open, setOpen] = useState(false)

  const product = item?.product

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (loading || !product?.slug) return undefined
    const timer = window.setTimeout(() => setOpen(true), 400)
    return () => window.clearTimeout(timer)
  }, [loading, product?.slug])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') close()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const detailPath = useMemo(() => (product ? getProductDetailPath(product) : '/products'), [product])
  const price = product ? getProductPrice(product) : 0
  const compareAt = product ? getCompareAtPrice(product) : 0
  const image = popupImage(product)

  if (!open || !product || typeof document === 'undefined') return null

  return createPortal(
    <div className="potm-overlay" role="dialog" aria-modal="true" aria-labelledby="potm-title">
      <button type="button" className="potm-overlay__backdrop" aria-label="Close popup" onClick={close} />
      <div className="potm-modal">
        <button type="button" className="potm-modal__close" onClick={close} aria-label="Close">
          <X size={18} />
        </button>
        <p className="potm-modal__eyebrow">{item.headline || 'Product of the Month'}</p>
        <div className="potm-modal__media">
          {image ? (
            <img src={image} alt={product.title} />
          ) : (
            <div className="potm-modal__placeholder">{product.title?.slice(0, 2)}</div>
          )}
        </div>
        <h2 id="potm-title" className="potm-modal__title">{product.title}</h2>
        {item.subtitle ? <p className="potm-modal__subtitle">{item.subtitle}</p> : null}
        {price > 0 ? (
          <div className="potm-modal__price">
            <strong>{formatCurrency(price)}</strong>
            {compareAt > price ? <span>{formatCurrency(compareAt)}</span> : null}
          </div>
        ) : null}
        <Link to={detailPath} className="potm-modal__cta" onClick={close}>
          Shop Now
        </Link>
      </div>
    </div>,
    document.body,
  )
}
