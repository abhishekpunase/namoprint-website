import { useMemo } from 'react'
import { FiArrowRight, FiStar } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'
import { resolveMediaUrl } from '../../utils/mediaUrl'
import { ProductCardMobileFooter } from '../product/ProductCardMobileFooter'

export function PenPrintProductCard({ product }) {
  const prices = (product.qualityOptions || []).map((o) => o.price).filter(Number.isFinite)
  const compareAts = (product.qualityOptions || []).map((o) => o.compareAtPrice).filter(Number.isFinite)
  const price = prices.length ? Math.min(...prices) : 0
  const compareAt = compareAts.length ? Math.min(...compareAts) : 0

  const mainSrc = useMemo(() => {
    const first = (product.images || []).map((url) => resolveMediaUrl(url)).find(Boolean)
    return first || ''
  }, [product.images])

  const detailPath = `/pen-print/${product.slug}`

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-amber-400 hover:shadow-md sm:rounded-2xl sm:border-orange-100 sm:shadow-md sm:hover:-translate-y-1 sm:hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 z-10 hidden h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 sm:block" />

      <Link to={detailPath} className="relative block shrink-0 overflow-hidden bg-white sm:bg-neutral-900">
        <span className="absolute right-3 top-3 z-10 hidden rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white sm:inline-flex">
          Custom
        </span>
        {mainSrc ? (
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden p-2 sm:aspect-[4/3] sm:p-0">
            <img
              src={mainSrc}
              alt={product.title}
              className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105 sm:absolute sm:inset-0 sm:h-full sm:w-full sm:object-cover sm:object-center"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500 sm:aspect-[4/3]">
            No image
          </div>
        )}
      </Link>

      <ProductCardMobileFooter to={detailPath} title={product.title} />

      <div className="hidden flex-1 flex-col gap-3 p-4 sm:flex">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            Pen Print
          </span>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5">
            <FiStar className="h-3.5 w-3.5 fill-orange-400 text-orange-500" />
            <span className="text-xs font-semibold text-gray-700">4.9</span>
          </div>
        </div>

        <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-orange-600">
          {product.title}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] text-gray-500">Starting at</div>
            <div className="text-xl font-extrabold text-orange-600">{formatCurrency(price)}</div>
            {compareAt > price && (
              <div className="text-xs text-gray-400 line-through">{formatCurrency(compareAt)}</div>
            )}
          </div>

          <Link
            to={detailPath}
            className="group/button inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-orange-400/40"
          >
            Customize
            <FiArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
