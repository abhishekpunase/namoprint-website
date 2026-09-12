import { Link } from 'react-router-dom'
import { FiPackage, FiCreditCard, FiRefreshCw, FiDollarSign, FiShoppingBag, FiLifeBuoy } from 'react-icons/fi'
import { SUPPORT_TOPICS } from '../data/supportCenter'

const ICONS = {
  package: FiPackage,
  card: FiCreditCard,
  return: FiRefreshCw,
  refund: FiDollarSign,
  bag: FiShoppingBag,
  ticket: FiLifeBuoy,
}

export function SupportCenterPage() {
  return (
    <section className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm sm:px-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">Customer Support</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">How can we help you?</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            We&apos;re here to help with your orders, payments, delivery and products.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/support/new"
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            >
              Raise a Ticket
            </Link>
            <Link
              to="/support/track"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-300"
            >
              Track Ticket
            </Link>
            <Link
              to="/account/support"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-300"
            >
              My Support Tickets
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SUPPORT_TOPICS.map((topic) => {
            const Icon = ICONS[topic.icon] || FiLifeBuoy
            const to = topic.issueType
              ? `/support/new?issue=${encodeURIComponent(topic.issueType)}`
              : '/support/new'
            return (
              <Link
                key={topic.key}
                to={to}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-slate-900">{topic.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{topic.description}</p>
                <p className="mt-5 text-sm font-semibold text-orange-600">Get help →</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
