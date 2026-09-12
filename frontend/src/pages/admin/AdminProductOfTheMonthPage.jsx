import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { AdminToggle } from '../../components/admin/ui/AdminToggle'
import { formatCurrency, getProductPrice } from '../../utils/format'
import { resolveMediaUrl } from '../../utils/mediaUrl'

function productImage(product) {
  return resolveMediaUrl(
    product?.thumbnail || product?.images?.[0] || product?.mockup?.baseImageUrl || product?.mockup?.frameImage || '',
  )
}

export function AdminProductOfTheMonthPage() {
  const [item, setItem] = useState(null)
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [headline, setHeadline] = useState('Product of the Month')
  const [subtitle, setSubtitle] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [productId, setProductId] = useState('')
  const [productSource, setProductSource] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const applySettings = (next) => {
    setItem(next)
    setHeadline(next?.headline || 'Product of the Month')
    setSubtitle(next?.subtitle || '')
    setIsActive(next?.isActive !== false)
    setProductId(next?.product?._id ? String(next.product._id) : '')
    setProductSource(next?.product?.source || '')
  }

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([api.adminProductOfTheMonth(), api.adminProductOfTheMonthCatalog()])
      .then(([settings, catalog]) => {
        applySettings(settings.item)
        setProducts((catalog.items || []).filter((product) => product.isActive !== false))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((product) => {
      const hay = `${product.title || ''} ${product.slug || ''} ${product.productType || ''} ${product.source || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [products, search])

  const selected = products.find((p) => String(p._id) === productId) || item?.product || null
  const liveOnSite = Boolean(item?.isActive !== false && item?.product)

  const selectProduct = (product) => {
    setProductId(String(product._id))
    setProductSource(product.source || '')
    setIsActive(true)
    setMessage('')
  }

  const clearProduct = () => {
    setProductId('')
    setProductSource('')
    setIsActive(false)
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (isActive && !productId) throw new Error('Select a product, then click Update popup.')
      const payload = await api.adminUpdateProductOfTheMonth({
        productId: productId || null,
        productSource: productSource || selected?.source || '',
        headline: headline.trim() || 'Product of the Month',
        subtitle: subtitle.trim(),
        isActive,
      })
      applySettings(payload.item)
      setMessage(
        isActive
          ? 'Updated. The website popup now shows this product. Refresh the storefront to see it.'
          : 'Updated. The website popup is hidden.',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="admin-v2-page-header">
        <p className="admin-v2-page-header__eyebrow">Content</p>
        <h1 className="admin-v2-page-header__title">Product of the Month</h1>
        <p className="admin-v2-page-header__description">
          Manage and update the center popup on the website. Select a product, edit the title, then click Update popup.
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

      {loading ? (
        <p className="text-sm text-slate-500">Loading products…</p>
      ) : (
        <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className={`rounded-xl border px-4 py-3 text-sm ${liveOnSite ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              {liveOnSite ? (
                <>
                  <strong>Live on website:</strong> {item.product.title}
                </>
              ) : (
                <>Popup is hidden until you select a product and click <strong>Update popup</strong>.</>
              )}
            </div>

            <AdminToggle
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              label="Show popup on website"
              description="Turn off to hide the popup without deleting the selected product."
            />

            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Popup title
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Short line (optional)
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Limited offer this month"
                className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
              />
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid min-w-[200px] flex-1 gap-1 text-sm font-semibold text-slate-600">
                Search catalog
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, type, or category"
                  className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
                />
              </label>
              {productId ? (
                <button type="button" className="admin-btn admin-btn--ghost" onClick={clearProduct}>
                  Clear selection
                </button>
              ) : null}
            </div>

            <div className="max-h-[440px] overflow-auto rounded-xl border border-slate-200">
              {filtered.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No products match. Add products in the catalog first.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((product) => {
                    const id = String(product._id)
                    const active = id === productId
                    const img = productImage(product)
                    return (
                      <li key={`${product.source || 'product'}-${id}`}>
                        <button
                          type="button"
                          onClick={() => selectProduct(product)}
                          className={`flex w-full items-center gap-3 p-3 text-left transition ${
                            active ? 'bg-orange-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          {img ? (
                            <img src={img} alt="" className="h-12 w-12 rounded-lg object-cover bg-slate-100" />
                          ) : (
                            <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                              {product.title?.slice(0, 2)}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate text-sm text-slate-900">{product.title}</strong>
                            <small className="text-xs text-slate-500">
                              {product.productType?.replaceAll('-', ' ')} · {formatCurrency(getProductPrice(product))}
                            </small>
                          </span>
                          {active ? <span className="text-xs font-semibold text-orange-600">Selected</span> : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                {saving ? 'Updating…' : 'Update popup'}
              </button>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={load} disabled={loading || saving}>
                Refresh list
              </button>
            </div>
          </section>

          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">Website preview</h2>
            {!selected ? (
              <p className="text-sm text-slate-500">Select a product to update the popup.</p>
            ) : (
              <div className="rounded-2xl border border-slate-200 p-4 text-center">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-700">
                  {headline || 'Product of the Month'}
                </p>
                {productImage(selected) ? (
                  <img
                    src={productImage(selected)}
                    alt=""
                    className="mx-auto mb-3 h-44 w-44 rounded-xl object-contain bg-slate-50"
                  />
                ) : null}
                <p className="font-bold text-slate-900">{selected.title}</p>
                {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
                <p className="mt-2 text-lg font-bold">{formatCurrency(getProductPrice(selected))}</p>
                <span className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-semibold text-white">
                  Shop Now
                </span>
              </div>
            )}
            <p className="text-xs leading-5 text-slate-500">
              After you click Update popup, open the website and refresh. Visitors will see this product in the center popup.
            </p>
          </aside>
        </form>
      )}
    </div>
  )
}
