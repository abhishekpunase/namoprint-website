export function ProductPageLoading({ label = 'Loading product…' } = {}) {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="aspect-square w-full animate-pulse rounded-3xl bg-slate-200" />
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="mt-auto h-12 w-full animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
      <p className="text-center text-sm font-medium text-slate-500" aria-live="polite">
        {label}
      </p>
    </section>
  )
}
