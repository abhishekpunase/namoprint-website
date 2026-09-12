import { resolveMediaUrl } from '../../utils/mediaUrl'

function isDocument(url) {
  return /\.(pdf|doc|docx|xls|xlsx|zip|txt)(\?|#|$)/i.test(String(url || ''))
}

function isVideo(url) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(String(url || ''))
}

export function collectTicketAttachments(ticket) {
  const fromTicket = ticket?.attachments || []
  const fromMessages = (ticket?.messages || []).flatMap((message) => message.attachments || [])
  return [...new Set([...fromTicket, ...fromMessages].filter(Boolean))]
}

export function TicketAttachments({ urls = [], title = 'Uploaded images / documents', compact = false }) {
  const items = (urls || []).filter(Boolean)
  if (!items.length) return null

  return (
    <div className="mt-4">
      {title ? <p className="mb-2 text-sm font-semibold text-slate-800">{title}</p> : null}
      <div className="flex flex-wrap gap-3">
        {items.map((url) => {
          const src = resolveMediaUrl(url)
          if (isDocument(url)) {
            return (
              <a
                key={url}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-orange-600 hover:border-orange-300"
              >
                View document
              </a>
            )
          }
          if (isVideo(url)) {
            return (
              <a key={url} href={src} target="_blank" rel="noreferrer" className="text-xs font-semibold text-orange-600">
                View video
              </a>
            )
          }
          return (
            <a
              key={url}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <img
                src={src}
                alt="Uploaded support attachment"
                className={compact ? 'h-20 w-20 object-cover' : 'h-28 w-28 object-cover sm:h-32 sm:w-32'}
              />
            </a>
          )
        })}
      </div>
    </div>
  )
}
