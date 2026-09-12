import { useEffect, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { api } from '../../services/api'
import { DEFAULT_HOME_OFFER_MARQUEE } from '../../data/defaultHomeOfferMarquee'
import { notifyOfferMarqueeChanged } from '../../hooks/useHomeOfferMarquee'

const twoSlots = (texts = []) => {
  const next = texts.filter(Boolean)
  while (next.length < 2) next.push('')
  return next
}

export function AdminHomeOfferMarqueePage() {
  const [lines, setLines] = useState(() => twoSlots(DEFAULT_HOME_OFFER_MARQUEE.map((item) => item.text)))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadItems = () => {
    setLoading(true)
    return api
      .adminHomeOfferMarquee()
      .then((payload) => {
        const texts = (payload.items || [])
          .filter((item) => item.isActive !== false)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((item) => item.text || '')
        setLines(twoSlots(texts))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [])

  const updateLine = (index, value) => {
    setLines((prev) => prev.map((line, i) => (i === index ? value : line)))
    setMessage('')
  }

  const addLine = () => {
    setLines((prev) => [...prev, ''])
    setMessage('')
  }

  const removeLine = (index) => {
    setLines((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return twoSlots(next)
    })
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    const cleaned = lines.map((line) => line.trim()).filter(Boolean)
    if (!cleaned.length) {
      setError('Enter at least one marquee line.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.adminReplaceHomeOfferMarquee({ lines: cleaned })
      notifyOfferMarqueeChanged()
      setLines(twoSlots(cleaned))
      setMessage('Marquee updated. Header, homepage, and footer will show the new lines.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const previewLines = lines.map((line) => line.trim()).filter(Boolean)

  return (
    <div className="admin-v2-content__inner space-y-6 p-4 sm:p-6">
      <header className="admin-v2-page-header">
        <p className="admin-v2-page-header__eyebrow">Content</p>
        <h1 className="admin-v2-page-header__title">Offer Marquee</h1>
        <p className="admin-v2-page-header__description">
          Edit the two scrolling offer lines. They update on the header, homepage, and footer as soon as you save.
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

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Marquee lines</h2>
            <button type="button" onClick={addLine} className="admin-btn admin-btn--ghost text-sm">
              <FiPlus className="mr-1 inline" /> Add line
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="space-y-4">
              {lines.map((line, index) => (
                <label key={`marquee-line-${index}`} className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700">Line {index + 1}</span>
                  <div className="flex gap-2">
                    <input
                      value={line}
                      onChange={(e) => updateLine(index, e.target.value)}
                      placeholder={index === 0 ? 'Free Shipping on Orders Above ₹999' : 'Flat 10% OFF on First Order'}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    {lines.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="admin-btn admin-btn--ghost p-2 text-red-600"
                        aria-label={`Remove line ${index + 1}`}
                      >
                        <FiTrash2 />
                      </button>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button type="submit" disabled={saving || loading} className="admin-btn admin-btn--primary">
              {saving ? 'Saving…' : 'Save & update site'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Live preview</h2>
          <p className="mb-3 text-sm text-slate-500">Header / footer bar</p>
          <div className="overflow-hidden rounded-xl bg-gradient-to-l from-black via-zinc-900 to-yellow-700 px-4 py-2 text-sm font-medium text-white">
            {previewLines.join('   •   ') || 'Your marquee text'}
          </div>
          <p className="mb-3 mt-5 text-sm text-slate-500">Homepage bar</p>
          <div className="overflow-hidden rounded-xl bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-gray-900">
            {previewLines.join('   •   ') || 'Your marquee text'}
          </div>
        </section>
      </form>
    </div>
  )
}
