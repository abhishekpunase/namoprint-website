import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiPaperclip } from 'react-icons/fi'
import { api } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { SupportStatusBadge } from '../components/support/SupportStatusBadge'
import { TicketTimeline } from '../components/support/TicketTimeline'
import { TicketCustomerDetails } from '../components/support/TicketCustomerDetails'
import { TicketAttachments, collectTicketAttachments } from '../components/support/TicketAttachments'
import { formatSupportDateTime } from '../data/supportCenter'

export function SupportTicketDetailPage() {
  const { ticketId } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [files, setFiles] = useState([])
  const [sending, setSending] = useState(false)

  const load = () =>
    api
      .getSupportTicket(ticketId, user?.email)
      .then((payload) => setTicket(payload.ticket))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  const sendReply = async (event) => {
    event.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    setError('')
    try {
      const attachments = []
      for (const file of files.slice(0, 5)) {
        const payload = await api.uploadPhoto(file)
        const url = payload?.asset?.previewUrl || payload?.asset?.optimizedUrl || payload?.asset?.url || payload?.url
        if (url) attachments.push(url)
      }
      const payload = await api.replySupportTicket(ticketId, {
        message: reply.trim(),
        attachments,
        email: user?.email || ticket?.email,
      })
      setTicket(payload.ticket)
      setReply('')
      setFiles([])
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <section className="min-h-screen bg-slate-50 py-10">
        <div className="mx-auto max-w-3xl px-4 text-sm text-slate-500">Loading ticket…</div>
      </section>
    )
  }

  if (!ticket) {
    return (
      <section className="min-h-screen bg-slate-50 py-10">
        <div className="mx-auto max-w-3xl px-4">
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || 'Ticket not found.'}</p>
          <Link to="/support/track" className="mt-4 inline-block text-sm font-semibold text-orange-600">
            Track another ticket
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex flex-wrap gap-4">
          <Link to="/account/support" className="text-sm font-medium text-orange-600 hover:underline">
            ← My Support Tickets
          </Link>
          <Link to="/support/track" className="text-sm font-medium text-slate-500 hover:text-orange-600">
            Track Ticket
          </Link>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Ticket #{ticket.ticketId}</h1>
              <p className="mt-2 text-sm text-slate-600">Order: {ticket.orderNo ? `#${ticket.orderNo}` : '—'}</p>
              <p className="text-sm text-slate-600">Category: {ticket.issueType}</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{ticket.subject}</p>
            </div>
            <SupportStatusBadge status={ticket.status} />
          </div>

          <TicketCustomerDetails ticket={ticket} />
          <TicketAttachments urls={collectTicketAttachments(ticket)} />

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <TicketTimeline status={ticket.status} />
          </div>

          {error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="mt-8 space-y-4">
            {(ticket.messages || []).map((message) => {
              const isSupport = message.sender === 'support'
              return (
                <article
                  key={message._id || message.createdAt}
                  className={`rounded-2xl border p-4 ${isSupport ? 'border-orange-100 bg-orange-50/60' : 'border-slate-200 bg-slate-50'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {isSupport ? 'Namo Print Support' : message.name || 'You'}
                    </p>
                    <p className="text-xs text-slate-400">{formatSupportDateTime(message.createdAt)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{message.message}</p>
                  <TicketAttachments urls={message.attachments} title="" compact />
                </article>
              )
            })}
          </div>

          {ticket.status === 'Closed' ? (
            <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">This ticket is closed.</p>
          ) : (
            <form onSubmit={sendReply} className="mt-8 grid gap-3">
              <label className="sr-only" htmlFor="support-reply">
                Write a message to our support team
              </label>
              <textarea
                id="support-reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder="Write a message to our support team..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-orange-300">
                  <FiPaperclip />
                  Attach File
                  <input type="file" accept="image/*,.pdf" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))} />
                </label>
                {files.length ? <span className="text-xs text-slate-500">{files.length} file(s) selected</span> : null}
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="ml-auto rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Send Reply'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
