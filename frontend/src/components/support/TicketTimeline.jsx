import { SUPPORT_TIMELINE, timelineStepIndex } from '../../data/supportCenter'

export function TicketTimeline({ status = 'Open' }) {
  const current = timelineStepIndex(status)

  return (
    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      {SUPPORT_TIMELINE.map((step, index) => {
        const done = index <= current
        return (
          <li key={step.key} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
            {index < SUPPORT_TIMELINE.length - 1 ? (
              <span
                className={`absolute left-[15px] top-8 hidden h-[calc(100%-8px)] w-px sm:left-auto sm:top-3 sm:block sm:h-px sm:w-[calc(100%-1.5rem)] sm:translate-x-[1.75rem] ${
                  index < current ? 'bg-orange-500' : 'bg-slate-200'
                }`}
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                done ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {index + 1}
            </span>
            <span className={`text-sm font-medium ${done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
