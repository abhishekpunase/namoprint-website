import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiAlertCircle, FiPaperclip, FiX } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { SUPPORT_ISSUE_TYPES } from '../data/supportCenter'

const emptyForm = {
  customerName: '',
  email: '',
  phone: '',
  orderNo: '',
  issueType: '',
  subject: '',
  description: '',
}

export function RaiseTicketPage() {
  const { user, isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    customerName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    orderNo: searchParams.get('orderNo') || '',
    issueType: searchParams.get('issue') || '',
  }))
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const prefilledOrder = Boolean(searchParams.get('orderNo'))

  useEffect(() => {
    setForm((current) => ({
      ...current,
      customerName: current.customerName || user?.name || '',
      email: current.email || user?.email || '',
      phone: current.phone || user?.phone || '',
      orderNo: searchParams.get('orderNo') || current.orderNo,
      issueType: searchParams.get('issue') || current.issueType,
    }))
  }, [searchParams, user])

  const validate = () => {
    const next = {}
    if (form.customerName.trim().length < 2) next.customerName = 'Please enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (form.phone.replace(/\D/g, '').length < 8) next.phone = 'Enter a valid mobile number.'
    if (!form.issueType) next.issueType = 'Select an issue type.'
    if (form.subject.trim().length < 4) next.subject = 'Subject should be at least 4 characters.'
    if (form.description.trim().length < 10) next.description = 'Please describe your problem in more detail.'
    return next
  }

  const fileNames = useMemo(() => files.map((file) => file.name), [files])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setSubmitError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      const attachments = []
      for (const file of files.slice(0, 5)) {
        const payload = file.type.startsWith('video/') ? await api.uploadVideo(file) : await api.uploadPhoto(file)
        if (payload.asset?.url) attachments.push(payload.asset.url)
      }

      const payload = await api.createSupportTicket({
        customerName: form.customerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        orderNo: form.orderNo.trim(),
        issueType: form.issueType,
        subject: form.subject.trim(),
        description: form.description.trim(),
        attachments,
      })

      navigate(`/support/success/${payload.ticket.ticketId}`, { replace: true, state: { ticket: payload.ticket } })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass = (name) =>
    `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 ${
      errors[name] ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-orange-400 focus:ring-orange-100'
    }`

  return (
    <section className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link to="/support" className="text-sm font-medium text-orange-600 hover:underline">
          ← Back to Support Center
        </Link>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Raise a Ticket</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Submit a support request</h1>
          <p className="mt-2 text-sm text-slate-500">
            Share your order or product issue and our team will get back to you shortly.
          </p>

          {isAuthenticated ? (
            <p className="mt-4 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800">
              Signed in as {user?.email}. This ticket will be saved to My Support Tickets.
            </p>
          ) : (
            <p className="mt-4 text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" state={{ from: '/support/new' }} className="font-semibold text-orange-600">
                Login
              </Link>{' '}
              to track tickets faster.
            </p>
          )}

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Customer Name
              <input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className={fieldClass('customerName')}
                autoComplete="name"
              />
              {errors.customerName ? <span className="font-normal text-rose-600">{errors.customerName}</span> : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Email Address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={fieldClass('email')}
                  autoComplete="email"
                />
                {errors.email ? <span className="font-normal text-rose-600">{errors.email}</span> : null}
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Mobile Number
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={fieldClass('phone')}
                  autoComplete="tel"
                />
                {errors.phone ? <span className="font-normal text-rose-600">{errors.phone}</span> : null}
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Order Number
              <input
                value={form.orderNo}
                onChange={(e) => setForm({ ...form, orderNo: e.target.value })}
                className={fieldClass('orderNo')}
                placeholder="Optional — e.g. 100245"
                readOnly={prefilledOrder}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Select Issue Type
              <select
                value={form.issueType}
                onChange={(e) => setForm({ ...form, issueType: e.target.value })}
                className={fieldClass('issueType')}
              >
                <option value="">Choose an issue</option>
                {SUPPORT_ISSUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.issueType ? <span className="font-normal text-rose-600">{errors.issueType}</span> : null}
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Subject
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className={fieldClass('subject')}
                placeholder="Short summary of your issue"
              />
              {errors.subject ? <span className="font-normal text-rose-600">{errors.subject}</span> : null}
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Describe Your Problem
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                className={`${fieldClass('description')} resize-y`}
                placeholder="Tell us what happened, including dates or product details if useful."
              />
              {errors.description ? <span className="font-normal text-rose-600">{errors.description}</span> : null}
            </label>

            <div className="grid gap-2">
              <p className="text-sm font-medium text-slate-700">Upload Image / Document</p>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:border-orange-300 hover:bg-orange-50/50">
                <FiPaperclip />
                Attach up to 5 files
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  multiple
                  hidden
                  onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
                />
              </label>
              {fileNames.length ? (
                <ul className="flex flex-wrap gap-2">
                  {fileNames.map((name) => (
                    <li key={name} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {name}
                    </li>
                  ))}
                  <button type="button" onClick={() => setFiles([])} className="text-xs text-rose-600">
                    <FiX className="inline" /> Clear
                  </button>
                </ul>
              ) : null}
            </div>

            {submitError ? (
              <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <FiAlertCircle /> {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
