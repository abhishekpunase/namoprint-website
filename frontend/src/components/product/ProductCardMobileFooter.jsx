import { FiEdit2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export function ProductCardMobileFooter({ to, title, label = 'CUSTOMISE' }) {
  return (
    <div className="flex flex-col items-center px-2 pb-3 pt-2 sm:hidden">
      <Link to={to} className="w-full min-w-0">
        <h3 className="truncate text-center text-[13px] font-bold leading-tight text-slate-900">{title}</h3>
      </Link>
      <Link
        to={to}
        className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#fde8e8] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#e11d48]"
      >
        <FiEdit2 className="h-3 w-3" />
        {label}
      </Link>
    </div>
  )
}
