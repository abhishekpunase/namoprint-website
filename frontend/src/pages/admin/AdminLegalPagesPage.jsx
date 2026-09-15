import { useEffect, useMemo, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { api } from '../../services/api'

const TABS = [
  { slug: 'privacy-policy', label: 'Privacy Policy' },
  { slug: 'terms-and-conditions', label: 'Terms & Conditions' },
  { slug: 'refund-policy', label: 'Refund Policy' },
  { slug: 'shipping-policy', label: 'Shipping Policy' },
]

const emptyForm = {
  title: '',
  titleAccent: '',
  updatedLabel: '',
  intro: '',
  highlightTitle: '',
  highlightContent: '',
  sections: [],
  bulletsTitle: '',
  bullets: [],
  ctaTitle: '',
  ctaContent: '',
  ctaButtonLabel: '',
  ctaButtonHref: '',
}

function mapItem(item) {
  return {
    ...emptyForm,
    ...(item || {}),
    sections: Array.isArray(item?.sections) ? item.sections.map((s) => ({ title: s.title || '', content: s.content || '' })) : [],
    bullets: Array.isArray(item?.bullets) ? item.bullets.map((b) => String(b || '')) : [],
  }
}

export function AdminLegalPagesPage() {
  const [activeSlug, setActiveSlug] = useState(TABS[0].slug)
  const [forms, setForms] = useState(() => Object.fromEntries(TABS.map((tab) => [tab.slug, { ...emptyForm }])))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useMemo(() => forms[activeSlug] || emptyForm, [forms, activeSlug])

  const load = () => {
    setLoading(true)
    return api
      .adminLegalPages()
      .then((payload) => {
        const next = Object.fromEntries(TABS.map((tab) => [tab.slug, { ...emptyForm }]))
        for (const item of payload.items || []) {
          if (next[item.slug]) next[item.slug] = mapItem(item)
        }
        setForms(next)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const updateField = (key, value) => {
    setForms((prev) => ({
      ...prev,
      [activeSlug]: { ...prev[activeSlug], [key]: value },
    }))
    setMessage('')
  }

  const updateSection = (index, patch) => {
    setForms((prev) => ({
      ...prev,
      [activeSlug]: {
        ...prev[activeSlug],
        sections: prev[activeSlug].sections.map((section, i) =>
          i === index ? { ...section, ...patch } : section,
        ),
      },
    }))
    setMessage('')
  }

  const addSection = () => {
    setForms((prev) => ({
      ...prev,
      [activeSlug]: {
        ...prev[activeSlug],
        sections: [...prev[activeSlug].sections, { title: '', content: '' }],
      },
    }))
    setMessage('')
  }

  const removeSection = (index) => {
    setForms((prev) => ({
      ...prev,
      [activeSlug]: {
        ...prev[activeSlug],
        sections: prev[activeSlug].sections.filter((_, i) => i !== index),
      },
    }))
    setMessage('')
  }

  const updateBullet = (index, value) => {
    setForms((prev) => ({
      ...prev,
      [activeSlug]: {
        ...prev[activeSlug],
        bullets: prev[activeSlug].bullets.map((item, i) => (i === index ? value : item)),
      },
    }))
    setMessage('')
  }

  const addBullet = () => {
    setForms((prev) => ({
      ...prev,
      [activeSlug]: {
        ...prev[activeSlug],
        bullets: [...prev[activeSlug].bullets, ''],
      },
    }))
    setMessage('')
  }

  const removeBullet = (index) => {
    setForms((prev) => ({
      ...prev,
      [activeSlug]: {
        ...prev[activeSlug],
        bullets: prev[activeSlug].bullets.filter((_, i) => i !== index),
      },
    }))
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    const current = forms[activeSlug]
    if (!String(current.title || '').trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        title: String(current.title || '').trim(),
        titleAccent: String(current.titleAccent || '').trim(),
        updatedLabel: String(current.updatedLabel || '').trim(),
        intro: String(current.intro || '').trim(),
        highlightTitle: String(current.highlightTitle || '').trim(),
        highlightContent: String(current.highlightContent || '').trim(),
        sections: (current.sections || [])
          .map((section) => ({
            title: String(section.title || '').trim(),
            content: String(section.content || '').trim(),
          }))
          .filter((section) => section.title || section.content),
        bulletsTitle: String(current.bulletsTitle || '').trim(),
        bullets: (current.bullets || []).map((item) => String(item || '').trim()).filter(Boolean),
        ctaTitle: String(current.ctaTitle || '').trim(),
        ctaContent: String(current.ctaContent || '').trim(),
        ctaButtonLabel: String(current.ctaButtonLabel || '').trim(),
        ctaButtonHref: String(current.ctaButtonHref || '').trim(),
      }
      const result = await api.adminUpdateLegalPage(activeSlug, payload)
      setForms((prev) => ({ ...prev, [activeSlug]: mapItem(result.item) }))
      setMessage('Legal page saved. Changes are live on the website.')
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
        <h1 className="admin-v2-page-header__title">Legal Pages</h1>
        <p className="admin-v2-page-header__description">
          Edit Privacy Policy, Terms & Conditions, Refund Policy, and Shipping Policy. Changes go live after you save.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => {
              setActiveSlug(tab.slug)
              setMessage('')
              setError('')
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeSlug === tab.slug
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading…</div>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Page header</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Accent title</span>
                <input
                  value={form.titleAccent}
                  onChange={(e) => updateField('titleAccent', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g. Policy"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Updated label</span>
                <input
                  value={form.updatedLabel}
                  onChange={(e) => updateField('updatedLabel', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Last updated: July 14, 2026"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Intro</span>
                <textarea
                  rows={3}
                  value={form.intro}
                  onChange={(e) => updateField('intro', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Highlight box (optional)</h2>
            <div className="grid gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Highlight title</span>
                <input
                  value={form.highlightTitle}
                  onChange={(e) => updateField('highlightTitle', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Highlight content</span>
                <textarea
                  rows={4}
                  value={form.highlightContent}
                  onChange={(e) => updateField('highlightContent', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Sections</h2>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300"
              >
                <FiPlus /> Add section
              </button>
            </div>
            <div className="space-y-4">
              {form.sections.map((section, index) => (
                <div key={`section-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600">Section {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 /> Remove
                    </button>
                  </div>
                  <div className="grid gap-3">
                    <input
                      value={section.title}
                      onChange={(e) => updateSection(index, { title: e.target.value })}
                      placeholder="Section title"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <textarea
                      rows={4}
                      value={section.content}
                      onChange={(e) => updateSection(index, { content: e.target.value })}
                      placeholder="Section content"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
              {!form.sections.length ? (
                <p className="text-sm text-slate-500">No sections yet. Add one to start writing this policy.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Bullet list (optional)</h2>
              <button
                type="button"
                onClick={addBullet}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300"
              >
                <FiPlus /> Add bullet
              </button>
            </div>
            <label className="mb-4 block space-y-1">
              <span className="text-sm font-medium text-slate-700">Bullets heading</span>
              <input
                value={form.bulletsTitle}
                onChange={(e) => updateField('bulletsTitle', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="space-y-3">
              {form.bullets.map((item, index) => (
                <div key={`bullet-${index}`} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(e) => updateBullet(index, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Bullet text"
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(index)}
                    className="inline-flex items-center rounded-xl border border-red-100 px-3 text-red-600 hover:bg-red-50"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Call to action</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">CTA title</span>
                <input
                  value={form.ctaTitle}
                  onChange={(e) => updateField('ctaTitle', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">CTA content</span>
                <textarea
                  rows={2}
                  value={form.ctaContent}
                  onChange={(e) => updateField('ctaContent', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Button label</span>
                <input
                  value={form.ctaButtonLabel}
                  onChange={(e) => updateField('ctaButtonLabel', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Button link</span>
                <input
                  value={form.ctaButtonHref}
                  onChange={(e) => updateField('ctaButtonHref', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="/contact or https://wa.me/..."
                />
              </label>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save page'}
            </button>
            <a
              href={`/${activeSlug}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
            >
              Preview on website
            </a>
          </div>
        </form>
      )}
    </div>
  )
}
