import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { SUPPORT_STATUSES, formatSupportDateTime } from '../../data/supportCenter'
import { SupportStatusBadge } from '../../components/support/SupportStatusBadge'
import { TicketCustomerDetails } from '../../components/support/TicketCustomerDetails'
import { TicketAttachments, collectTicketAttachments } from '../../components/support/TicketAttachments'

export function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () =>
    api
      .adminSupportTickets()
      .then((payload) => setTickets(payload.tickets || []))
      .catch((err) => setError(err.message))

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () => tickets.filter((ticket) => filter === 'all' || ticket.status === filter),
    [filter, tickets],
  )
  const selected = tickets.find((ticket) => ticket._id === selectedId) || filtered[0] || null

  const updateStatus = async (id, status) => {
    setSaving(true)
    setError('')
    try {
      const payload = await api.adminUpdateSupportTicket(id, { status })
      setTickets((prev) => prev.map((ticket) => (ticket._id === id ? payload.ticket : ticket)))
      setMessage('Status updated')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const sendReply = async (event) => {
    event.preventDefault()
    if (!selected || !reply.trim()) return
    setSaving(true)
    setError('')
    try {
      const payload = await api.adminReplySupportTicket(selected._id, { message: reply.trim() })
      setTickets((prev) => prev.map((ticket) => (ticket._id === selected._id ? payload.ticket : ticket)))
      setReply('')
      setMessage('Reply sent')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-sm text-slate-500">Review customer tickets and send support replies.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          {SUPPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {!filtered.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No tickets in this filter.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((ticket) => (
                <li key={ticket._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ticket._id)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left ${
                      selected?._id === ticket._id ? 'bg-orange-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">#{ticket.ticketId}</p>
                      <p className="text-xs text-slate-500">{ticket.issueType}</p>
                      <p className="text-xs text-slate-400">{ticket.customerName}</p>
                    </div>
                    <SupportStatusBadge status={ticket.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">#{selected.ticketId}</h2>
                <p className="text-sm text-slate-600">{selected.subject}</p>
              </div>
              <select
                value={selected.status}
                disabled={saving}
                onChange={(e) => updateStatus(selected._id, e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {SUPPORT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <TicketCustomerDetails ticket={selected} />
            <TicketAttachments urls={collectTicketAttachments(selected)} />

            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
              {(selected.messages || []).map((item) => (
                <div key={item._id || item.createdAt} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-800">
                    {item.sender === 'support' ? 'Support' : item.name}{' '}
                    <span className="font-normal text-slate-400">{formatSupportDateTime(item.createdAt)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{item.message}</p>
                  <TicketAttachments urls={item.attachments} title="" compact />
                </div>
              ))}
            </div>

            <form onSubmit={sendReply} className="mt-4 grid gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Write a support reply..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={saving || !reply.trim()}
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Send Reply
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  )
}
