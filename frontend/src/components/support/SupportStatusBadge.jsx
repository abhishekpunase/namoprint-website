import { SUPPORT_STATUS_STYLES } from '../../data/supportCenter'

export function SupportStatusBadge({ status = 'Open' }) {
  const style = SUPPORT_STATUS_STYLES[status] || SUPPORT_STATUS_STYLES.Open
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style}`}>
      {status}
    </span>
  )
}
