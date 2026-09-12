import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { formatCurrency } from '../../utils/format'
import { AdminToggle } from '../../components/admin/ui/AdminToggle'

const emptyForm = {
  name: '',
  code: '',
  type: 'percent',
  value: '10',
  maxUses: '10',
  minSubtotal: '',
  expiresAt: '',
  notes: '',
  isActive: true,
}

function randomCode() {
  const part = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `FRIEND${part}`
}

function formatWhen(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function AdminPrivateCouponsPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [openUsageId, setOpenUsageId] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api
      .adminManagedCoupons()
      .then((payload) => setItems(payload.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId('')
  }

  const editCoupon = (coupon) => {
    setEditingId(coupon._id)
    setForm({
      name: coupon.name || '',
      code: coupon.code || '',
      type: coupon.type || 'percent',
      value: String(coupon.value ?? 10),
      maxUses: String(coupon.maxUses ?? 10),
      minSubtotal: coupon.minSubtotal ? String(coupon.minSubtotal) : '',
      expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : '',
      notes: coupon.notes || '',
      isActive: coupon.isActive !== false,
    })
    setMessage('')
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const body = {
        name: form.name.trim(),
        type: form.type,
        value: Number(form.value),
        maxUses: Number(form.maxUses),
        isActive: Boolean(form.isActive),
        minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : null,
        expiresAt: form.expiresAt || null,
        notes: form.notes.trim(),
      }
      if (!body.name) throw new Error('Coupon name is required')
      if (!body.maxUses || body.maxUses < 1) throw new Error('Max uses must be at least 1')
      if (form.type === 'percent' && (body.value <= 0 || body.value > 100)) {
        throw new Error('Percent value must be between 1 and 100')
      }
      if (form.type === 'fixed' && body.value <= 0) throw new Error('Fixed discount must be greater than 0')

      if (editingId) {
        await api.adminUpdateManagedCoupon(editingId, body)
        setMessage('Coupon updated. Usage history is unchanged.')
      } else {
        const code = form.code.trim().toUpperCase().replace(/\s+/g, '')
        if (code.length < 3) throw new Error('Enter a coupon code to share with your friend')
        await api.adminCreateManagedCoupon({ ...body, code })
        setMessage(`Coupon ${code} created. Share this code privately — it will not appear on the website.`)
      }
      resetForm()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const disableCoupon = async (coupon) => {
    try {
      await api.adminDeleteManagedCoupon(coupon._id)
      if (editingId === coupon._id) resetForm()
      load()
      setMessage(`${coupon.code} is now inactive.`)
    } catch (err) {
      setError(err.message)
    }
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setMessage(`Copied ${code}`)
    } catch {
      setError('Could not copy code')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) =>
      `${item.code} ${item.name} ${item.notes}`.toLowerCase().includes(q),
    )
  }, [items, search])

  return (
    <div className="space-y-6">
      <header className="admin-v2-page-header">
        <p className="admin-v2-page-header__eyebrow">Marketing</p>
        <h1 className="admin-v2-page-header__title">Private Coupons</h1>
        <p className="admin-v2-page-header__description">
          Create a code for a friend. It is not listed on the website. They type it at checkout. After the max uses (for example 10), it stops working. Usage and the user who applied it show here.
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Update coupon' : 'Create coupon'}</h2>
            {editingId ? (
              <button type="button" className="admin-btn admin-btn--ghost" onClick={resetForm}>
                New coupon
              </button>
            ) : null}
          </div>

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Friend 10% off"
              className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Coupon code
            <div className="flex gap-2">
              <input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="FRIEND10"
                disabled={Boolean(editingId)}
                className="min-h-10 flex-1 rounded-lg border border-slate-200 px-3 font-normal uppercase tracking-wider text-slate-900 disabled:bg-slate-50"
              />
              {!editingId ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setForm((prev) => ({ ...prev, code: randomCode() }))}
                >
                  Generate
                </button>
              ) : null}
            </div>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Discount type
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              {form.type === 'percent' ? 'Percent value' : 'Rupee value'}
              <input
                type="number"
                min="1"
                max={form.type === 'percent' ? '100' : undefined}
                value={form.value}
                onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            How many times it can be used
            <input
              type="number"
              min="1"
              value={form.maxUses}
              onChange={(e) => setForm((prev) => ({ ...prev, maxUses: e.target.value }))}
              className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
            />
            <small className="font-normal text-slate-500">After this many successful paid checkouts, the code stops working.</small>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Min order ₹ (optional)
              <input
                type="number"
                min="0"
                value={form.minSubtotal}
                onChange={(e) => setForm((prev) => ({ ...prev, minSubtotal: e.target.value }))}
                className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Expiry date (optional)
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Internal note
            <input
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="For Rahul — 10 uses"
              className="min-h-10 rounded-lg border border-slate-200 px-3 font-normal text-slate-900"
            />
          </label>

          <AdminToggle
            checked={form.isActive}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            label="Coupon is active"
            description="Inactive codes cannot be applied at checkout."
          />

          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update coupon' : 'Create coupon'}
          </button>
        </form>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Created codes ({items.length})</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or name"
              className="min-h-10 min-w-[200px] rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No private coupons yet. Create one and share the code with your friend.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((coupon) => {
                const exhausted = coupon.usageCount >= coupon.maxUses
                const usageOpen = openUsageId === coupon._id
                return (
                  <li key={coupon._id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-base font-bold tracking-wide text-slate-900">{coupon.code}</p>
                        <p className="text-sm text-slate-600">{coupon.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {coupon.type === 'percent' ? `${coupon.value}% off` : `${formatCurrency(coupon.value)} off`}
                          {' · '}
                          Used {coupon.usageCount}/{coupon.maxUses}
                          {exhausted ? ' · limit reached' : coupon.isActive ? ' · active' : ' · inactive'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => copyCode(coupon.code)}>
                          Copy
                        </button>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => editCoupon(coupon)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() => setOpenUsageId(usageOpen ? '' : coupon._id)}
                        >
                          {usageOpen ? 'Hide uses' : 'Who used'}
                        </button>
                        {coupon.isActive ? (
                          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => disableCoupon(coupon)}>
                            Disable
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {coupon.usedBy?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {coupon.usedBy.map((user) => (
                          <span
                            key={`${coupon._id}-${user.customerEmail || user.customerName}`}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                          >
                            {user.customerName || user.customerEmail || 'Customer'} · {user.uses} time{user.uses === 1 ? '' : 's'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">Not used yet.</p>
                    )}

                    {usageOpen ? (
                      <div className="mt-3 overflow-auto rounded-lg border border-slate-100">
                        <table className="min-w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-3 py-2 font-semibold">When</th>
                              <th className="px-3 py-2 font-semibold">User</th>
                              <th className="px-3 py-2 font-semibold">Email</th>
                              <th className="px-3 py-2 font-semibold">Discount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(coupon.usages || []).map((usage) => (
                              <tr key={usage._id} className="border-t border-slate-100">
                                <td className="px-3 py-2 whitespace-nowrap">{formatWhen(usage.usedAt)}</td>
                                <td className="px-3 py-2">{usage.customerName || 'Customer'}</td>
                                <td className="px-3 py-2">{usage.customerEmail || '—'}</td>
                                <td className="px-3 py-2">{formatCurrency(usage.discountAmount || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
