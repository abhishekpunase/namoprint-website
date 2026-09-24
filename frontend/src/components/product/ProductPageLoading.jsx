export function ProductPageLoading({ label = 'Loading...' } = {}) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-10 py-12 text-center shadow-sm">
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-orange-500"
          aria-hidden="true"
        />
        <p className="text-lg font-semibold text-slate-700" aria-live="polite">
          {label}
        </p>
      </div>
    </section>
  )
}
