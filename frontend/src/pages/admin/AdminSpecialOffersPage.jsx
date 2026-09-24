import { useEffect, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { api } from '../../services/api'
import {
  DEFAULT_SPECIAL_OFFERS,
  SPECIAL_OFFER_GRADIENTS,
  SPECIAL_OFFER_ICONS,
  mapApiSpecialOffers,
} from '../../data/defaultSpecialOffers'
import { notifySpecialOffersChanged } from '../../hooks/useSpecialOffers'

const emptyCard = (sortOrder) => ({
  title: '',
  subtitle: '',
  description: '',
  code: '',
  icon: 'gift',
  gradient: SPECIAL_OFFER_GRADIENTS[0].value,
  action: 'claim',
  cta: 'Claim Offer',
  href: '',
  sortOrder,
  isActive: true,
})

export function AdminSpecialOffersPage() {
  const [form, setForm] = useState(() => mapApiSpecialOffers(DEFAULT_SPECIAL_OFFERS))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    return api
      .adminSpecialOffers()
      .then((payload) => setForm(mapApiSpecialOffers(payload.item)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setMessage('')
  }

  const updateCard = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      cards: prev.cards.map((card, i) => (i === index ? { ...card, ...patch } : card)),
    }))
    setMessage('')
  }

  const addCard = () => {
    setForm((prev) => ({
      ...prev,
      cards: [...prev.cards, emptyCard(prev.cards.length)],
    }))
    setMessage('')
  }

  const removeCard = (index) => {
    setForm((prev) => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index),
    }))
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    const cards = form.cards
      .map((card, index) => ({
        title: String(card.title || '').trim(),
        subtitle: String(card.subtitle || '').trim(),
        description: String(card.description || '').trim(),
        code: String(card.code || '').trim().toUpperCase(),
        icon: card.icon || 'gift',
        gradient: card.gradient || SPECIAL_OFFER_GRADIENTS[0].value,
        action: card.action || 'claim',
        cta: String(card.cta || 'Claim Offer').trim(),
        href: String(card.href || '').trim(),
        sortOrder: index,
        isActive: card.isActive !== false,
      }))
      .filter((card) => card.title)

    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.adminUpdateSpecialOffers({
        eyebrow: form.eyebrow.trim(),
        title: form.title.trim(),
        titleAccent: form.titleAccent.trim(),
        subtitle: form.subtitle.trim(),
        isActive: form.isActive !== false,
        cards,
      })
      notifySpecialOffersChanged()
      setMessage('Special offers updated. Homepage section will show the new content.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-v2-content__inner space-y-6 p-4 sm:p-6">
      <header className="admin-v2-page-header">
        <p className="admin-v2-page-header__eyebrow">Content</p>
        <h1 className="admin-v2-page-header__title">Special Offers</h1>
        <p className="admin-v2-page-header__description">
          Edit the homepage offers section: heading, cards, coupon codes, and button actions.
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

      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Section header</h2>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="rounded border-slate-300"
              />
              Show section on homepage
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Badge text</span>
              <input
                value={form.eyebrow}
                onChange={(e) => updateField('eyebrow', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Limited Time Exclusive Deals"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Title</span>
              <input
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Unlock Premium"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Title accent (orange line)</span>
              <input
                value={form.titleAccent}
                onChange={(e) => updateField('titleAccent', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Furniture Savings"
              />
            </label>
            <label className="md:col-span-2 space-y-1">
              <span className="text-sm font-medium text-slate-700">Subtitle</span>
              <textarea
                rows={2}
                value={form.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Offer cards</h2>
            <button type="button" onClick={addCard} className="admin-btn admin-btn--ghost text-sm">
              <FiPlus className="mr-1 inline" /> Add card
            </button>
          </div>

          {form.cards.map((card, index) => (
            <div key={card._id || `card-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-800">Card {index + 1}</h3>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={card.isActive !== false}
                      onChange={(e) => updateCard(index, { isActive: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCard(index)}
                    className="admin-btn admin-btn--ghost p-2 text-red-600"
                    aria-label={`Remove card ${index + 1}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Label (small)</span>
                  <input
                    value={card.subtitle}
                    onChange={(e) => updateCard(index, { subtitle: e.target.value })}
                    placeholder="WELCOME OFFER"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Title</span>
                  <input
                    value={card.title}
                    onChange={(e) => updateCard(index, { title: e.target.value })}
                    placeholder="10% OFF"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="md:col-span-2 space-y-1">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea
                    rows={2}
                    value={card.description}
                    onChange={(e) => updateCard(index, { description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Coupon code (optional)</span>
                  <input
                    value={card.code}
                    onChange={(e) => updateCard(index, { code: e.target.value })}
                    placeholder="WELCOME10"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Button text</span>
                  <input
                    value={card.cta}
                    onChange={(e) => updateCard(index, { cta: e.target.value })}
                    placeholder="Claim Offer"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Icon</span>
                  <select
                    value={card.icon}
                    onChange={(e) => updateCard(index, { icon: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {SPECIAL_OFFER_ICONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Gradient</span>
                  <select
                    value={card.gradient}
                    onChange={(e) => updateCard(index, { gradient: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {SPECIAL_OFFER_GRADIENTS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                    {!SPECIAL_OFFER_GRADIENTS.some((g) => g.value === card.gradient) && card.gradient ? (
                      <option value={card.gradient}>Custom</option>
                    ) : null}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Button action</span>
                  <select
                    value={card.action}
                    onChange={(e) => updateCard(index, { action: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="claim">Claim coupon → checkout</option>
                    <option value="bulk">Bulk orders page</option>
                    <option value="link">Custom link</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Link URL (bulk / custom)</span>
                  <input
                    value={card.href}
                    onChange={(e) => updateCard(index, { href: e.target.value })}
                    placeholder="/bulk-orders"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className={`mt-4 h-3 rounded-full bg-gradient-to-r ${card.gradient}`} title="Gradient preview" />
            </div>
          ))}
        </section>

        <button type="submit" disabled={saving || loading} className="admin-btn admin-btn--primary">
          {saving ? 'Saving…' : 'Save special offers'}
        </button>
      </form>
    </div>
  )
}
