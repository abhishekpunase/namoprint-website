import { useEffect, useMemo, useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { api } from '../../services/api'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'closed', label: 'Closed' },
]

const STATUS_CLASS = {
  new: 'bg-amber-100 text-amber-800',
  contacted: 'bg-sky-100 text-sky-800',
  quoted: 'bg-violet-100 text-violet-800',
  closed: 'bg-slate-200 text-slate-700',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminBulkOrdersPage() {
  const [inquiries, setInquiries] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingId, setSavingId] = useState('')

  const load = () =>
    api
      .adminBulkOrders()
      .then((payload) => setInquiries(payload.inquiries || []))
      .catch((err) => setError(err.message))

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () => inquiries.filter((item) => filter === 'all' || item.status === filter),
    [filter, inquiries],
  )

  const selected = inquiries.find((item) => item._id === selectedId) || filtered[0] || null

  const updateStatus = async (id, status) => {
    setSavingId(id)
    setError('')
    setMessage('')
    try {
      await api.adminUpdateBulkOrder(id, { status })
      setMessage('Status updated.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId('')
    }
  }

  const saveNote = async (inquiry, adminNote) => {
    setSavingId(inquiry._id)
    setError('')
    setMessage('')
    try {
      await api.adminUpdateBulkOrder(inquiry._id, { adminNote })
      setMessage('Note saved.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId('')
    }
  }

  const remove = async (inquiry) => {
    if (!window.confirm(`Delete inquiry from ${inquiry.name}?`)) return
    try {
      await api.adminDeleteBulkOrder(inquiry._id)
      if (selectedId === inquiry._id) setSelectedId('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Customer inquiries submitted from the Bulk Order form.</p>
        </div>
        <p className="text-sm font-semibold text-slate-600">{inquiries.length} total</p>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
            filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
          }`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              filter === option.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
          No bulk order inquiries yet.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    className={`cursor-pointer border-t border-slate-100 ${
                      selected?._id === item._id ? 'bg-orange-50' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedId(item._id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.productInterest || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[item.status] || ''}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected ? (
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-sm text-slate-500">{formatDate(selected.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(selected)}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  aria-label="Delete inquiry"
                >
                  <FiTrash2 />
                </button>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Email</dt>
                  <dd>
                    <a href={`mailto:${selected.email}`} className="font-medium text-orange-600">
                      {selected.email}
                    </a>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Phone</dt>
                  <dd>
                    <a href={`tel:${selected.phone}`} className="font-medium text-slate-800">
                      {selected.phone}
                    </a>
                  </dd>
                </div>
                {selected.company ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Company</dt>
                    <dd className="font-medium text-slate-800">{selected.company}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Product</dt>
                  <dd className="font-medium text-slate-800">{selected.productInterest || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Quantity</dt>
                  <dd className="font-medium text-slate-800">{selected.quantity || '—'}</dd>
                </div>
              </dl>

              {selected.message ? (
                <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">{selected.message}</p>
              ) : null}

              <label className="mt-4 block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <select
                  value={selected.status}
                  disabled={savingId === selected._id}
                  onChange={(event) => updateStatus(selected._id, event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <AdminNoteForm
                key={selected._id}
                inquiry={selected}
                saving={savingId === selected._id}
                onSave={saveNote}
              />
            </article>
          ) : null}
        </div>
      )}
    </section>
  )
}

function AdminNoteForm({ inquiry, saving, onSave }) {
  const [note, setNote] = useState(inquiry.adminNote || '')

  return (
    <form
      className="mt-4 space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(inquiry, note.trim())
      }}
    >
      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save note'}
      </button>
    </form>
  )
}
