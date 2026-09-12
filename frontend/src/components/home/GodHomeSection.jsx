import { useEffect, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { godApi } from '../../services/godApi'
import { GodProductCard } from '../god/GodProductCard'

export default function GodHomeSection() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    godApi
      .list('?limit=8')
      .then((payload) => setProducts(payload.items || []))
      .catch(() => setProducts([]))
  }, [])

  if (!products.length) return null

  return (
    <section className="mx-auto max-w-7xl px-3 py-10 sm:px-5 sm:py-20">
      <div className="mb-6 flex items-end justify-between sm:mb-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[3px] text-yellow-500 sm:text-base">
            Canvas Collection
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-5xl">
            Canvas{' '}
            <span className="italic text-yellow-500">Frames</span>
          </h2>
        </div>

        <Link
          to="/god-photo-frames"
          className="hidden items-center gap-2 rounded-full bg-[#F5B400] px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-[#D89B00] hover:shadow-md sm:inline-flex"
        >
          View All
          <FiArrowRight />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <GodProductCard key={product._id} product={product} />
        ))}
      </div>

      <div className="mt-10 flex justify-center sm:hidden">
        <Link
          to="/god-photo-frames"
          className="inline-flex items-center gap-2 rounded-full bg-[#F5B400] px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-[#D89B00]"
        >
          View All Canvas Frames
          <FiArrowRight />
        </Link>
      </div>
    </section>
  )
}
