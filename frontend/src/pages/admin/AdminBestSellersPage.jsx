import { useEffect, useMemo, useState } from 'react'
import { FiRefreshCw, FiStar, FiTrash2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { fetchAllAdminProducts, isCatalogDemoProduct } from '../../utils/adminProductCatalog'
import { formatCurrency, getProductPrice } from '../../utils/format'
import { resolveMediaUrl } from '../../utils/mediaUrl'

function productImage(product) {
  return resolveMediaUrl(
    product?.thumbnail || product?.images?.[0] || product?.mockup?.baseImageUrl || product?.mockup?.frameImage || '',
  )
}

export function AdminBestSellersPage() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const items = await fetchAllAdminProducts()
      setProducts(items.filter((product) => !isCatalogDemoProduct(product) && product.isActive !== false))
    } catch (err) {
      setError(err.message || 'Could not load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const bestSellers = useMemo(
    () => products.filter((product) => product.isFeatured),
    [products],
  )

  const catalog = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = products.filter((product) => !product.isFeatured)
    if (!q) return list
    return list.filter((product) => {
      const hay = `${product.title || ''} ${product.slug || ''} ${product.productType || ''} ${product.category?.name || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [products, search])

  const setBestSeller = async (product, nextValue) => {
    if (!product?._id) return
    setSavingId(String(product._id))
    setError('')
    setMessage('')
    try {
      await api.adminUpdateProduct(product._id, { isFeatured: nextValue })
      setProducts((current) =>
        current.map((entry) =>
          entry._id === product._id ? { ...entry, isFeatured: nextValue } : entry,
        ),
      )
      setMessage(
        nextValue
          ? `"${product.title}" added to Best Sellers on the home page.`
          : `"${product.title}" removed from Best Sellers.`,
      )
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="space-y-6">
      <header className="admin-v2-page-header">
        <p className="admin-v2-page-header__eyebrow">Home page</p>
        <h1 className="admin-v2-page-header__title">Best Sellers</h1>
        <p className="admin-v2-page-header__description">
          Choose which products appear in the Best Seller section on the home page. Add or remove anytime — changes show after a storefront refresh.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          <strong>{bestSellers.length}</strong> product{bestSellers.length === 1 ? '' : 's'} on Best Seller
        </p>
        <button
          type="button"
          className="admin-btn admin-btn--ghost inline-flex items-center gap-2"
          onClick={load}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading products…</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">On home page</h2>
              <p className="text-sm text-slate-500">These products show in Best Seller. Remove any you do not want.</p>
            </div>

            {bestSellers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No Best Sellers yet. Add products from the catalog on the right.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {bestSellers.map((product) => {
                  const img = productImage(product)
                  const busy = savingId === String(product._id)
                  return (
                    <li key={product._id} className="flex items-center gap-3 p-3">
                      {img ? (
                        <img src={img} alt="" className="h-14 w-14 rounded-lg object-cover bg-slate-100" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                          {(product.title || '?').slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{product.title}</p>
                        <p className="text-xs text-slate-500">
                          {product.productType?.replaceAll('-', ' ') || 'Product'} · {formatCurrency(getProductPrice(product))}
                        </p>
                      </div>
                      <Link
                        to={`/admin/products/${product._id}`}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setBestSeller(product, false)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <FiTrash2 />
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add from catalog</h2>
              <p className="text-sm text-slate-500">Search and add any published product to Best Sellers.</p>
            </div>

            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Search products
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, type, or category"
                className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
              />
            </label>

            <div className="max-h-[520px] overflow-auto rounded-xl border border-slate-200">
              {catalog.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  {search.trim()
                    ? 'No matching products left to add.'
                    : 'Every published product is already a Best Seller, or the catalog is empty.'}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {catalog.map((product) => {
                    const img = productImage(product)
                    const busy = savingId === String(product._id)
                    return (
                      <li key={product._id} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                        {img ? (
                          <img src={img} alt="" className="h-12 w-12 rounded-lg object-cover bg-slate-100" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                            {(product.title || '?').slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{product.title}</p>
                          <p className="text-xs text-slate-500">
                            {product.category?.name || product.productType?.replaceAll('-', ' ') || 'Product'}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setBestSeller(product, true)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-[#FFF7D6] px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-[#F5B400]/30 disabled:opacity-50"
                        >
                          <FiStar />
                          Add
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
