import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiLifeBuoy } from 'react-icons/fi'
import { api } from '../services/api'
import { SupportStatusBadge } from '../components/support/SupportStatusBadge'
import { formatSupportDate } from '../data/supportCenter'

export function MySupportTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .mySupportTickets()
      .then((payload) => setTickets(payload.tickets || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link to="/account" className="text-sm font-medium text-orange-600 hover:underline">
          ← My Account
        </Link>
        <div className="mt-4 rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-widest text-orange-100">My Account</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">My Support Tickets</h1>
          <p className="mt-3 max-w-2xl text-orange-50">Review your support requests and continue the conversation with our team.</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/support/new" className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Raise a Ticket
          </Link>
          <Link to="/support/track" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Track Ticket
          </Link>
        </div>

        {error ? <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading tickets…</div>
        ) : !tickets.length ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <FiLifeBuoy size={28} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-800">No support tickets yet</h2>
            <p className="mt-2 text-sm text-slate-500">When you raise a ticket, it will appear here.</p>
            <Link to="/support/new" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
              Raise a Ticket
            </Link>
          </div>
        ) : (
          <div className="mt-8 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ticket ID</th>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Subject</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Updated</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td className="px-5 py-4 font-semibold text-slate-900">#{ticket.ticketId}</td>
                    <td className="px-5 py-4 text-slate-600">{ticket.orderNo ? `#${ticket.orderNo}` : '—'}</td>
                    <td className="px-5 py-4 text-slate-700">{ticket.subject}</td>
                    <td className="px-5 py-4 text-slate-600">{ticket.issueType}</td>
                    <td className="px-5 py-4 text-slate-500">{formatSupportDate(ticket.createdAt)}</td>
                    <td className="px-5 py-4 text-slate-500">{formatSupportDate(ticket.updatedAt)}</td>
                    <td className="px-5 py-4">
                      <SupportStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/support/tickets/${ticket.ticketId}`} className="font-semibold text-orange-600 hover:underline">
                        View Ticket
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tickets.length ? (
          <div className="mt-6 grid gap-4 md:hidden">
            {tickets.map((ticket) => (
              <article key={ticket._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-slate-900">#{ticket.ticketId}</p>
                    <p className="mt-1 text-sm text-slate-600">{ticket.issueType}</p>
                    <p className="text-sm text-slate-500">{ticket.orderNo ? `Order #${ticket.orderNo}` : 'No order attached'}</p>
                    <p className="mt-2 text-xs text-slate-400">Created: {formatSupportDate(ticket.createdAt)}</p>
                  </div>
                  <SupportStatusBadge status={ticket.status} />
                </div>
                <Link
                  to={`/support/tickets/${ticket.ticketId}`}
                  className="mt-4 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  View Ticket
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
