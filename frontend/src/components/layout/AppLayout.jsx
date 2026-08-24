import { Outlet } from 'react-router-dom'
import { RouteSeo } from '../seo/RouteSeo'
import { Footer } from './Footer'
import { Header } from './Header'
import { ScrollToTop } from './ScrollToTop'

export function AppLayout() {
  return (
    <>
      <ScrollToTop />
      <RouteSeo />
      <Header />
      <main id="main-content" className="min-h-[calc(100dvh-8rem)] overflow-x-clip">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
