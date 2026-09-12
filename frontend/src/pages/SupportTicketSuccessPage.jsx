import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { SupportStatusBadge } from '../components/support/SupportStatusBadge'
import { TicketCustomerDetails } from '../components/support/TicketCustomerDetails'
import { TicketAttachments, collectTicketAttachments } from '../components/support/TicketAttachments'
import { formatSupportDate } from '../data/supportCenter'

export function SupportTicketSuccessPage() {
  const { ticketId } = useParams()
  const location = useLocation()
  const [ticket, setTicket] = useState(location.state?.ticket || null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ticket || !ticketId) return undefined
    api
      .trackSupportTicket(ticketId)
      .then((payload) => setTicket(payload.ticket))
      .catch((err) => setError(err.message))
    return undefined
  }, [ticket, ticketId])

  return (
    <section className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="text-3xl" aria-hidden>
            🎉
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Ticket Raised Successfully</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Your support request has been submitted successfully.
          </p>

          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

          {ticket ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
              <p className="text-lg font-bold text-slate-900">Ticket ID: #{ticket.ticketId}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Issue Type</dt>
                  <dd className="font-semibold text-slate-800">{ticket.issueType}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Order Number</dt>
                  <dd className="font-semibold text-slate-800">{ticket.orderNo || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Created Date</dt>
                  <dd className="font-semibold text-slate-800">{formatSupportDate(ticket.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Current Status</dt>
                  <dd className="mt-1">
                    <SupportStatusBadge status={ticket.status} />
                  </dd>
                </div>
              </dl>
              <TicketCustomerDetails ticket={ticket} />
              <TicketAttachments urls={collectTicketAttachments(ticket)} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Loading ticket details…</p>
          )}

          <p className="mt-6 text-sm text-slate-500">
            Our support team will review your request and get back to you shortly.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={`/support/track?id=${encodeURIComponent(ticketId || ticket?.ticketId || '')}`}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Track Ticket
            </Link>
            <Link
              to="/products"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-300"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
