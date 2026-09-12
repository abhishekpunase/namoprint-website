import { Link, useLocation } from 'react-router-dom'
import { FiHeadphones } from 'react-icons/fi'

const HIDDEN_PREFIXES = ['/admin', '/checkout', '/cart', '/support']

export function FloatingSupportButton() {
  const { pathname } = useLocation()
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null

  return (
    <Link
      to="/support"
      className="fixed bottom-[11.5rem] right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:bg-orange-600 sm:bottom-6 sm:right-[5.75rem]"
      aria-label="Need Help? Open support center"
    >
      <FiHeadphones className="h-7 w-7" />
    </Link>
  )
}
