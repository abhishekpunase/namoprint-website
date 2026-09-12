import { useEffect, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { api } from '../../services/api'
import { DEFAULT_FOOTER, mapApiFooter } from '../../data/defaultFooter'
import { HEADER_MENU_PATH_PRESETS } from '../../data/defaultHeaderMenu'
import { notifyFooterChanged } from '../../hooks/useFooter'

const GROUPS = [
  { id: 'categories', label: 'Categories column' },
  { id: 'quick', label: 'Quick Links column' },
  { id: 'policies', label: 'Policies column' },
  { id: 'bottom', label: 'Bottom bar links' },
]

const emptyLink = (group, sortOrder) => ({
  label: '',
  path: '/',
  group,
  sortOrder,
  isActive: true,
})

export function AdminFooterPage() {
  const [form, setForm] = useState(() => mapApiFooter(DEFAULT_FOOTER))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    return api
      .adminFooter()
      .then((payload) => setForm(mapApiFooter(payload.item)))
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

  const updateHeading = (key, value) => {
    setForm((prev) => ({ ...prev, headings: { ...prev.headings, [key]: value } }))
    setMessage('')
  }

  const updateSocial = (key, value) => {
    setForm((prev) => ({ ...prev, socials: { ...prev.socials, [key]: value } }))
    setMessage('')
  }

  const updateLink = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    }))
    setMessage('')
  }

  const addLink = (group) => {
    setForm((prev) => ({
      ...prev,
      links: [...prev.links, emptyLink(group, prev.links.filter((link) => link.group === group).length)],
    }))
    setMessage('')
  }

  const removeLink = (index) => {
    setForm((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }))
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    const links = form.links
      .map((link, index) => ({
        label: String(link.label || '').trim(),
        path: String(link.path || '').trim() || '/',
        group: link.group,
        sortOrder: index,
        isActive: link.isActive !== false,
      }))
      .filter((link) => link.label)

    if (links.some((link) => !link.path.startsWith('/'))) {
      setError('Every footer path must start with /')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.adminUpdateFooter({
        aboutText: form.aboutText.trim(),
        copyright: form.copyright.trim(),
        headings: form.headings,
        socials: form.socials,
        links,
      })
      notifyFooterChanged()
      setMessage('Footer updated. The website footer will show the new content.')
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
        <h1 className="admin-v2-page-header__title">Footer</h1>
        <p className="admin-v2-page-header__description">
          Edit the website footer: about text, social links, and every column. Changes go live after you save.
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
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Company & social</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2 space-y-1">
              <span className="text-sm font-medium text-slate-700">About text</span>
              <textarea
                rows={3}
                value={form.aboutText}
                onChange={(e) => updateField('aboutText', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Copyright</span>
              <input
                value={form.copyright}
                onChange={(e) => updateField('copyright', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Facebook URL</span>
              <input
                value={form.socials.facebook}
                onChange={(e) => updateSocial('facebook', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Instagram URL</span>
              <input
                value={form.socials.instagram}
                onChange={(e) => updateSocial('instagram', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">YouTube URL</span>
              <input
                value={form.socials.youtube}
                onChange={(e) => updateSocial('youtube', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        {GROUPS.map((group) => {
          const headingKey = group.id === 'bottom' ? null : group.id
          return (
            <section key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{group.label}</h2>
                <button type="button" onClick={() => addLink(group.id)} className="admin-btn admin-btn--ghost text-sm">
                  <FiPlus className="mr-1 inline" /> Add link
                </button>
              </div>
              {headingKey ? (
                <label className="mb-4 block max-w-sm space-y-1">
                  <span className="text-sm font-medium text-slate-700">Column heading</span>
                  <input
                    value={form.headings[headingKey] || ''}
                    onChange={(e) => updateHeading(headingKey, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              ) : null}
              <div className="space-y-3">
                {form.links.map((link, index) =>
                  link.group === group.id ? (
                    <div key={`${group.id}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={link.label}
                        onChange={(e) => updateLink(index, { label: e.target.value })}
                        placeholder="Label"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <input
                        value={link.path}
                        onChange={(e) => updateLink(index, { path: e.target.value })}
                        placeholder="/about"
                        list="footer-path-presets"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="admin-btn admin-btn--ghost p-2 text-red-600"
                        aria-label={`Remove ${link.label || 'link'}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ) : null,
                )}
              </div>
            </section>
          )
        })}

        <datalist id="footer-path-presets">
          {HEADER_MENU_PATH_PRESETS.map((preset) => (
            <option key={preset.path} value={preset.path}>
              {preset.label}
            </option>
          ))}
        </datalist>

        <button type="submit" disabled={saving || loading} className="admin-btn admin-btn--primary">
          {saving ? 'Saving…' : 'Save & update footer'}
        </button>
      </form>
    </div>
  )
}
