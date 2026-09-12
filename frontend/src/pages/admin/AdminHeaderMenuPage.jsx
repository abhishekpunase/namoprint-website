import { useEffect, useState } from 'react'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { api } from '../../services/api'
import { DEFAULT_HEADER_MENU, HEADER_MENU_PATH_PRESETS } from '../../data/defaultHeaderMenu'
import { notifyHeaderMenuChanged } from '../../hooks/useHeaderMenu'
import { AdminToggle } from '../../components/admin/ui/AdminToggle'

const emptyForm = {
  label: '',
  path: '/',
  group: 'primary',
  sortOrder: '0',
  isActive: true,
}

export function AdminHeaderMenuPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const loadItems = () =>
    api
      .adminHeaderMenu()
      .then((payload) => setItems(payload.items || []))
      .catch((err) => setError(err.message))

  useEffect(() => {
    loadItems()
  }, [])

  const resetForm = () => {
    setForm({ ...emptyForm, sortOrder: String(items.length) })
    setEditingId('')
  }

  const editItem = (item) => {
    setEditingId(item._id)
    setForm({
      label: item.label || '',
      path: item.path || '/',
      group: item.group === 'more' ? 'more' : 'primary',
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive !== false,
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
        label: form.label.trim(),
        path: form.path.trim() || '/',
        group: form.group === 'more' ? 'more' : 'primary',
        sortOrder: Number(form.sortOrder) || 0,
        isActive: Boolean(form.isActive),
      }
      if (!body.label) throw new Error('Menu label is required.')
      if (!body.path.startsWith('/')) throw new Error('Path must start with /')
      if (editingId) {
        await api.adminUpdateHeaderMenuItem(editingId, body)
        setMessage('Menu item updated.')
      } else {
        await api.adminCreateHeaderMenuItem(body)
        setMessage('Menu item added.')
      }
      notifyHeaderMenuChanged()
      resetForm()
      loadItems()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (item) => {
    if (!window.confirm(`Hide "${item.label}" from the header menu?`)) return
    try {
      await api.adminDeleteHeaderMenuItem(item._id)
      if (editingId === item._id) resetForm()
      notifyHeaderMenuChanged()
      loadItems()
      setMessage('Menu item hidden from the storefront header.')
    } catch (err) {
      setError(err.message)
    }
  }

  const seedDefaults = async () => {
    if (!window.confirm('Add default header links that are not already in the list?')) return
    setSaving(true)
    setError('')
    try {
      const existing = new Set(items.map((item) => String(item.path || '').toLowerCase()))
      let order = items.length
      for (const item of DEFAULT_HEADER_MENU) {
        if (existing.has(item.path.toLowerCase())) continue
        await api.adminCreateHeaderMenuItem({
          ...item,
          sortOrder: order,
          isActive: true,
        })
        existing.add(item.path.toLowerCase())
        order += 1
      }
      setMessage('Default header links added.')
      notifyHeaderMenuChanged()
      loadItems()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const primaryCount = items.filter((item) => item.group !== 'more' && item.isActive !== false).length
  const moreCount = items.filter((item) => item.group === 'more' && item.isActive !== false).length

  return (
    <div className="admin-v2-content__inner space-y-6 p-4 sm:p-6">
      <header className="admin-v2-page-header">
        <p className="admin-v2-page-header__eyebrow">Content</p>
        <h1 className="admin-v2-page-header__title">Header Menu</h1>
        <p className="admin-v2-page-header__description">
          Control the website header links. Main bar items show on desktop; More items go in the dropdown.
          Hidden items stay in this list but do not appear on the storefront.
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

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Menu items ({items.length})
              <span className="ml-2 text-sm font-normal text-slate-500">
                {primaryCount} main · {moreCount} more
              </span>
            </h2>
            <div className="flex gap-2">
              <button type="button" onClick={seedDefaults} className="admin-btn admin-btn--ghost text-sm">
                Add defaults
              </button>
              <button type="button" onClick={resetForm} className="admin-btn admin-btn--ghost text-sm">
                <FiPlus className="mr-1 inline" /> New item
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              <p>No header links yet. The storefront is using the default menu.</p>
              <button type="button" onClick={seedDefaults} className="admin-btn admin-btn--primary mt-4">
                Load default menu
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item._id}
                  className="flex gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-yellow-300"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="truncate text-xs text-slate-500">{item.path}</p>
                    <p className="text-xs text-slate-500">
                      {item.group === 'more' ? 'More dropdown' : 'Main bar'} · Order {item.sortOrder ?? 0}
                      {item.isActive === false ? ' · Hidden' : ' · Live'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button type="button" onClick={() => editItem(item)} className="admin-btn admin-btn--ghost p-2">
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      className="admin-btn admin-btn--ghost p-2 text-red-600"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editingId ? 'Edit menu item' : 'Add menu item'}
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Label *</span>
              <input
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Shop"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Quick path</span>
              <select
                value={HEADER_MENU_PATH_PRESETS.some((preset) => preset.path === form.path) ? form.path : ''}
                onChange={(e) => {
                  const next = e.target.value
                  if (!next) return
                  const preset = HEADER_MENU_PATH_PRESETS.find((item) => item.path === next)
                  setForm((prev) => ({
                    ...prev,
                    path: next,
                    label: prev.label || preset?.label || '',
                  }))
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Custom / keep current</option>
                {HEADER_MENU_PATH_PRESETS.map((preset) => (
                  <option key={preset.path} value={preset.path}>
                    {preset.label} ({preset.path})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Path *</span>
              <input
                value={form.path}
                onChange={(e) => setForm((prev) => ({ ...prev, path: e.target.value }))}
                placeholder="/products"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Show in</span>
              <select
                value={form.group}
                onChange={(e) => setForm((prev) => ({ ...prev, group: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="primary">Main header bar</option>
                <option value="more">More dropdown</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Sort order</span>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                className="w-full max-w-[120px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <AdminToggle
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              label="Show in website header"
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              Preview: <span className="font-semibold">{form.label.trim() || 'Menu label'}</span>{' '}
              <span className="text-slate-400">→ {form.path.trim() || '/'}</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                {saving ? 'Saving…' : editingId ? 'Update item' : 'Add item'}
              </button>
              {editingId ? (
                <button type="button" onClick={resetForm} className="admin-btn admin-btn--ghost">
                  Cancel
                </button>
              ) : null}
              {items.length === 0 ? (
                <button type="button" onClick={seedDefaults} className="admin-btn admin-btn--ghost">
                  Load defaults
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
