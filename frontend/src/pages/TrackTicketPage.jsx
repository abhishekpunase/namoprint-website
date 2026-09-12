import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { SupportStatusBadge } from '../components/support/SupportStatusBadge'
import { TicketTimeline } from '../components/support/TicketTimeline'
import { TicketCustomerDetails } from '../components/support/TicketCustomerDetails'
import { TicketAttachments, collectTicketAttachments } from '../components/support/TicketAttachments'
import { formatTicketId } from '../data/supportCenter'

export function TrackTicketPage() {
  const [searchParams] = useSearchParams()
  const [ticketId, setTicketId] = useState(searchParams.get('id') || '')
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const track = async (id = ticketId) => {
    const normalized = formatTicketId(id)
    if (!normalized) {
      setError('Enter a Ticket ID, for example NP-10245.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = await api.trackSupportTicket(normalized)
      setTicket(payload.ticket)
    } catch (err) {
      setTicket(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initial = searchParams.get('id')
    if (initial) track(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link to="/support" className="text-sm font-medium text-orange-600 hover:underline">
          ← Back to Support Center
        </Link>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Track Support Ticket</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your Ticket ID to see the latest status.</p>

          <label htmlFor="ticket-id" className="mt-6 block text-sm font-medium text-slate-700">
            Enter Ticket ID
          </label>
          <form
            className="mt-2 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              track()
            }}
          >
            <input
              id="ticket-id"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="NP-10245"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? 'Checking…' : 'Track Ticket'}
            </button>
          </form>

          {error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          {ticket ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Ticket #{ticket.ticketId}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Order: {ticket.orderNo ? `#${ticket.orderNo}` : '—'}
                  </p>
                  <p className="text-sm text-slate-600">Issue: {ticket.issueType}</p>
                </div>
                <SupportStatusBadge status={ticket.status} />
              </div>
              <TicketCustomerDetails ticket={ticket} />
              <TicketAttachments urls={collectTicketAttachments(ticket)} />
              <div className="mt-6 rounded-2xl bg-white p-4">
                <TicketTimeline status={ticket.status} />
              </div>
              <Link
                to={`/support/tickets/${ticket.ticketId}`}
                className="mt-5 inline-flex text-sm font-semibold text-orange-600 hover:underline"
              >
                View ticket details →
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
