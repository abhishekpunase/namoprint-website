import { Link, useLocation } from 'react-router-dom'
import { FiHeadphones } from 'react-icons/fi'

const HIDDEN_PREFIXES = ['/admin', '/checkout', '/cart', '/support']

export function FloatingSupportButton() {
  const { pathname } = useLocation()
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null

  return (
    <Link
      to="/support"
      className="fixed bottom-[11.5rem] right-6 z-[9998] inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-lg transition hover:border-orange-400 hover:bg-orange-50 sm:bottom-6 sm:right-[5.75rem]"
      aria-label="Need Help? Open support center"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white">
        <FiHeadphones className="h-4 w-4" />
      </span>
      Need Help?
    </Link>
  )
}
