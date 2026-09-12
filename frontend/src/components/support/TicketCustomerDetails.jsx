export function TicketCustomerDetails({ ticket }) {
  if (!ticket) return null

  const rows = [
    { label: 'Customer Name', value: ticket.customerName },
    { label: 'Email Address', value: ticket.email },
    { label: 'Mobile Number', value: ticket.phone },
    { label: 'Order Number', value: ticket.orderNo ? `#${ticket.orderNo}` : '—' },
  ]

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <p className="text-sm font-semibold text-slate-900">Customer details</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{row.label}</dt>
            <dd className="mt-0.5 break-words text-sm font-semibold text-slate-800">{row.value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
