import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiPackage } from 'react-icons/fi'
import { api } from '../services/api'
import { formatCurrency } from '../utils/format'
import { formatSupportDate } from '../data/supportCenter'

export function AccountOrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .order(orderId)
      .then((payload) => setOrder(payload.order))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [orderId])

  const helpUrl = order?.orderNo
    ? `/support/new?orderNo=${encodeURIComponent(order.orderNo)}&issue=${encodeURIComponent('Order Issue')}`
    : '/support/new'

  return (
    <section className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Link to="/account/orders" className="text-sm font-medium text-orange-600 hover:underline">
          ← My Orders
        </Link>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Loading order details…
          </div>
        ) : error || !order ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error || 'Order not found.'}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 p-8 text-white shadow-xl">
              <p className="text-sm uppercase tracking-widest text-orange-100">Order Details</p>
              <h1 className="mt-2 text-3xl font-bold">#{order.orderNo}</h1>
              <p className="mt-2 text-orange-50">
                Placed on {formatSupportDate(order.createdAt)} · {order.status}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {order.shipment?.trackingUrl ? (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Track Order
                </a>
              ) : (
                <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">
                  Track Order
                </span>
              )}
              <Link
                to={`/support/new?orderNo=${encodeURIComponent(order.orderNo)}&issue=${encodeURIComponent('Return / Replacement')}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-300"
              >
                Return Product
              </Link>
              <Link
                to={helpUrl}
                className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100"
              >
                Need Help?
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <FiPackage size={22} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                  <p className="text-sm text-slate-500">{order.items?.length || 0} item(s)</p>
                </div>
              </div>
              <ul className="mt-5 divide-y divide-slate-100">
                {(order.items || []).map((item) => (
                  <li key={item._id || item.title} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{item.title}</p>
                      <p className="text-sm text-slate-500">Qty {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-800">{formatCurrency(item.unitPrice || 0)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-500">Total Amount</span>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(order.totals?.total || 0)}</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
                <p className="mt-3 text-sm text-slate-600">Status: {order.payment?.status || '—'}</p>
                <p className="text-sm text-slate-600">Method: {order.payment?.provider || '—'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Delivery</h2>
                <p className="mt-3 text-sm text-slate-600">
                  {order.shippingAddress?.line1 || 'Address on file'}
                  {order.shippingAddress?.city ? `, ${order.shippingAddress.city}` : ''}
                </p>
                {order.shipment?.awbCode ? (
                  <p className="mt-2 text-sm text-slate-600">AWB: {order.shipment.awbCode}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Tracking will appear after dispatch.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
