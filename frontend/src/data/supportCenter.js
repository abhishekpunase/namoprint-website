export const SUPPORT_ISSUE_TYPES = [
  'Order Issue',
  'Delivery Issue',
  'Product Damaged',
  'Wrong Product Received',
  'Missing Product',
  'Payment Issue',
  'Refund Issue',
  'Return / Replacement',
  'Product Question',
  'Other',
]

export const SUPPORT_STATUSES = [
  'Open',
  'Under Review',
  'In Progress',
  'Waiting for Customer',
  'Resolved',
  'Closed',
]

export const SUPPORT_STATUS_STYLES = {
  Open: 'bg-sky-50 text-sky-800 border-sky-200',
  'Under Review': 'bg-amber-50 text-amber-800 border-amber-200',
  'In Progress': 'bg-orange-50 text-orange-800 border-orange-200',
  'Waiting for Customer': 'bg-violet-50 text-violet-800 border-violet-200',
  Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Closed: 'bg-slate-100 text-slate-600 border-slate-200',
}

export const SUPPORT_TIMELINE = [
  { key: 'created', label: 'Ticket Created' },
  { key: 'review', label: 'Under Review' },
  { key: 'responded', label: 'Support Responded' },
  { key: 'resolved', label: 'Resolved' },
]

export function timelineStepIndex(status) {
  if (status === 'Closed' || status === 'Resolved') return 3
  if (status === 'In Progress' || status === 'Waiting for Customer') return 2
  if (status === 'Under Review') return 1
  return 0
}

export const SUPPORT_TOPICS = [
  {
    key: 'order',
    title: '📦 Order Support',
    description: 'Track order, delivery problems, missing or damaged products.',
    issueType: 'Order Issue',
    icon: 'package',
  },
  {
    key: 'payment',
    title: '💳 Payment Support',
    description: 'Payment failed, payment deducted but order not confirmed, refund issues.',
    issueType: 'Payment Issue',
    icon: 'card',
  },
  {
    key: 'returns',
    title: '🔄 Returns & Replacement',
    description: 'Request return, replacement or exchange.',
    issueType: 'Return / Replacement',
    icon: 'return',
  },
  {
    key: 'refund',
    title: '💰 Refund Support',
    description: 'Check refund status or report a refund issue.',
    issueType: 'Refund Issue',
    icon: 'refund',
  },
  {
    key: 'product',
    title: '🛍 Product Support',
    description: 'Product-related questions or problems.',
    issueType: 'Product Question',
    icon: 'bag',
  },
  {
    key: 'ticket',
    title: '🎫 Raise a Support Ticket',
    description: 'Create a ticket and get help from our support team.',
    issueType: '',
    icon: 'ticket',
  },
]

export function formatTicketId(value) {
  const id = String(value || '').trim().toUpperCase().replace(/^#/, '')
  return id.startsWith('NP-') ? id : id ? `NP-${id.replace(/^NP-?/i, '')}` : ''
}

export function formatSupportDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatSupportDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
