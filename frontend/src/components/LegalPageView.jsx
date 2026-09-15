import { Link } from 'react-router-dom'

function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href || '').trim())
}

export function LegalPageView({ page, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white">
        <section className="border-b border-yellow-600/20 bg-black">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center">
            <div className="mx-auto h-4 w-24 animate-pulse rounded bg-white/20" />
            <div className="mx-auto mt-6 h-10 w-64 max-w-full animate-pulse rounded bg-white/25" />
          </div>
        </section>
        <section className="mx-auto max-w-4xl space-y-4 px-4 py-16">
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-slate-100" />
        </section>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="bg-white">
        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-black">Page unavailable</h1>
          <p className="mt-3 text-gray-600">{error || 'This policy page could not be loaded.'}</p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-full bg-black px-8 py-3 font-semibold text-yellow-500 transition hover:bg-yellow-600 hover:text-black"
          >
            Back to Home
          </Link>
        </section>
      </div>
    )
  }

  const sections = Array.isArray(page.sections) ? page.sections : []
  const bullets = Array.isArray(page.bullets) ? page.bullets.filter(Boolean) : []
  const ctaHref = String(page.ctaButtonHref || '').trim() || '/contact'
  const ctaExternal = isExternalHref(ctaHref)

  return (
    <div className="bg-white">
      <section className="border-b border-yellow-600/20 bg-black">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-[0.3em] text-yellow-500">
            Legal
          </span>
          <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">
            {page.title}{' '}
            {page.titleAccent ? <span className="text-yellow-500">{page.titleAccent}</span> : null}
          </h1>
          {page.updatedLabel ? <p className="text-sm text-white/60">{page.updatedLabel}</p> : null}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        {page.intro ? <p className="mb-10 leading-relaxed text-gray-600">{page.intro}</p> : null}

        {page.highlightTitle || page.highlightContent ? (
          <div className="mb-12 rounded-2xl border-2 border-yellow-500 bg-yellow-50 p-6 md:p-8">
            {page.highlightTitle ? (
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-black">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-yellow-500">
                  !
                </span>
                {page.highlightTitle}
              </h2>
            ) : null}
            {page.highlightContent ? (
              <p className="leading-relaxed text-gray-700 whitespace-pre-line">{page.highlightContent}</p>
            ) : null}
          </div>
        ) : null}

        {sections.length ? (
          <div className="space-y-10">
            {sections.map((section, index) => (
              <div key={`${section.title}-${index}`} className="border-l-4 border-yellow-500 pl-6">
                {section.title ? (
                  <h2 className="mb-2 text-xl font-bold text-black">{section.title}</h2>
                ) : null}
                {section.content ? (
                  <p className="leading-relaxed text-gray-600 whitespace-pre-line">{section.content}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {bullets.length ? (
          <div className="mt-14">
            {page.bulletsTitle ? (
              <h2 className="mb-6 text-2xl font-bold text-black">{page.bulletsTitle}</h2>
            ) : null}
            <ul className="space-y-3">
              {bullets.map((item, index) => (
                <li
                  key={`${item.slice(0, 24)}-${index}`}
                  className="flex gap-3 rounded-xl border border-yellow-600/15 bg-yellow-50/60 px-4 py-3 text-gray-700"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-yellow-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {page.ctaTitle || page.ctaContent || page.ctaButtonLabel ? (
          <div className="mt-14 rounded-2xl border border-yellow-600/20 bg-yellow-50 p-8 text-center">
            {page.ctaTitle ? <h3 className="mb-2 text-xl font-bold text-black">{page.ctaTitle}</h3> : null}
            {page.ctaContent ? <p className="mb-6 text-gray-600">{page.ctaContent}</p> : null}
            {page.ctaButtonLabel ? (
              ctaExternal ? (
                <a
                  href={ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-black px-8 py-3 font-semibold text-yellow-500 transition hover:bg-yellow-600 hover:text-black"
                >
                  {page.ctaButtonLabel}
                </a>
              ) : (
                <Link
                  to={ctaHref}
                  className="inline-block rounded-full bg-black px-8 py-3 font-semibold text-yellow-500 transition hover:bg-yellow-600 hover:text-black"
                >
                  {page.ctaButtonLabel}
                </Link>
              )
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}
