import { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import { api } from '../../services/api'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  productInterest: '',
  quantity: '',
  message: '',
}

const FALLBACK_WHATSAPP = '919098570277'

const PRODUCT_OPTIONS = [
  'Photo Frames',
  'Name Plates',
  'T-Shirt Printing',
  'Wall Watches',
  'Corporate Gifts',
  'Canvas Frames',
  'Trophies',
  'Stickers / Labels',
  'Mixed / Other',
]

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

function buildWhatsAppText(form) {
  const lines = [
    'Hi Namo Print, I want to place a bulk order.',
    form.name ? `Name: ${form.name}` : null,
    form.phone ? `Phone: ${form.phone}` : null,
    form.company ? `Company: ${form.company}` : null,
    form.productInterest ? `Product: ${form.productInterest}` : null,
    form.quantity ? `Quantity: ${form.quantity}` : null,
    form.message ? `Details: ${form.message}` : null,
  ].filter(Boolean)
  return lines.join('\n')
}

export function BulkOrderInquiryForm({ onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [whatsappNumber, setWhatsappNumber] = useState(FALLBACK_WHATSAPP)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    api
      .contactSettings()
      .then((payload) => {
        const number = digitsOnly(payload.contact?.whatsappNumber)
        if (number) setWhatsappNumber(number)
      })
      .catch(() => {})
  }, [])

  const whatsappLink = useMemo(
    () => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildWhatsAppText(form))}`,
    [form, whatsappNumber],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.submitBulkOrder({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        productInterest: form.productInterest.trim(),
        quantity: form.quantity.trim(),
        message: form.message.trim(),
      })
      setSent(true)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.message || 'Could not submit the form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100'

  return (
    <div className="space-y-4">
      {onClose ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">Bulk Orders</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Tell us your requirement</h3>
            <p className="mt-1 text-sm text-slate-500">Share your details and our team will get back with pricing.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close form"
          >
            <FiX />
          </button>
        </div>
      ) : null}

      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
            <FiCheck />
          </div>
          <p className="font-semibold text-emerald-800">Request received</p>
          <p className="mt-1 text-sm text-emerald-700">We will contact you shortly with bulk pricing.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full name *</span>
              <input name="name" value={form.name} onChange={handleChange} required minLength={2} className={fieldClass} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone *</span>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                minLength={8}
                className={fieldClass}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email *</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className={fieldClass}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company (optional)</span>
              <input name="company" value={form.company} onChange={handleChange} className={fieldClass} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product interest</span>
              <select name="productInterest" value={form.productInterest} onChange={handleChange} className={fieldClass}>
                <option value="">Select a product</option>
                {PRODUCT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approx. quantity</span>
              <input
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g. 50, 100+"
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requirement</span>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              placeholder="Sizes, designs, delivery city, timeline..."
              className={fieldClass}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Submit bulk order request'}
          </button>
        </form>
      )}

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.87 9.87 0 0 0 4.62 1.17h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.64-1.03-5.13-2.9-7-1.87-1.87-4.36-2.84-7.01-2.84Zm0 18.07h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.3c0-4.52 3.68-8.2 8.24-8.2 2.2 0 4.27.86 5.83 2.42a8.14 8.14 0 0 1 2.42 5.79c0 4.52-3.69 8.15-8.25 8.15Zm4.52-6.14c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.65.81-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.65-1.23-1.46-1.38-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.36-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.41 1.02 2.58.12.17 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
        </svg>
        Connect with WhatsApp
        <span className="text-xs font-medium text-emerald-600">(optional)</span>
      </a>
    </div>
  )
}

export function BulkOrderInquiryModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
        <BulkOrderInquiryForm onClose={onClose} />
      </div>
    </div>
  )
}
